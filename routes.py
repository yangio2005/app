import json
import logging
from datetime import datetime, timedelta
from flask import render_template, url_for, flash, redirect, request, jsonify, abort
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.security import check_password_hash, generate_password_hash
from sqlalchemy import func

from app import db
from models import User, Student, Activity, Attendance
from forms import (
    LoginForm, RegistrationForm, StudentForm, 
    ActivityForm, AttendanceSearchForm, AttendanceScanForm
)
from utils import admin_required, generate_qr_code_data

def register_routes(app):
    
    @app.route('/')
    def index():
        """Landing page"""
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        return render_template('index.html')
    
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        """User login page"""
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        
        form = LoginForm()
        if form.validate_on_submit():
            user = User.query.filter_by(username=form.username.data).first()
            if user and check_password_hash(user.password_hash, form.password.data):
                login_user(user, remember=form.remember.data)
                next_page = request.args.get('next')
                return redirect(next_page or url_for('dashboard'))
            else:
                flash('Login unsuccessful. Please check username and password', 'danger')
        
        return render_template('login.html', form=form)
    
    @app.route('/logout')
    def logout():
        """User logout"""
        logout_user()
        return redirect(url_for('index'))
    
    @app.route('/register', methods=['GET', 'POST'])
    @admin_required
    def register():
        """Register new staff/admin users (admin only)"""
        form = RegistrationForm()
        if form.validate_on_submit():
            user = User(
                username=form.username.data,
                email=form.email.data,
                password_hash=generate_password_hash(form.password.data),
                is_admin=form.is_admin.data
            )
            db.session.add(user)
            db.session.commit()
            flash(f'Account created for {form.username.data}!', 'success')
            return redirect(url_for('dashboard'))
        
        return render_template('register.html', form=form)
    
    @app.route('/dashboard')
    @login_required
    def dashboard():
        """Main dashboard with summary statistics"""
        # Get counts for dashboard
        student_count = Student.query.count()
        activity_count = Activity.query.count()
        attendance_count = Attendance.query.count()
        
        # Get recent activities
        recent_activities = Activity.query.order_by(Activity.start_time.desc()).limit(5).all()
        
        # Get ongoing activities
        now = datetime.utcnow()
        ongoing_activities = Activity.query.filter(
            Activity.start_time <= now,
            Activity.end_time >= now,
            Activity.is_active == True
        ).all()
        
        # Get attendance data for chart (last 7 days)
        last_week = now - timedelta(days=7)
        daily_attendance = db.session.query(
            func.date(Attendance.timestamp).label('date'),
            func.count(Attendance.id).label('count')
        ).filter(Attendance.timestamp >= last_week).group_by(
            func.date(Attendance.timestamp)
        ).all()
        
        # Format for JS chart
        attendance_dates = [str(record.date) for record in daily_attendance]
        attendance_counts = [record.count for record in daily_attendance]
        
        return render_template('dashboard.html',
                              student_count=student_count,
                              activity_count=activity_count,
                              attendance_count=attendance_count,
                              recent_activities=recent_activities,
                              ongoing_activities=ongoing_activities,
                              attendance_dates=json.dumps(attendance_dates),
                              attendance_counts=json.dumps(attendance_counts))
    
    # Student routes
    @app.route('/students')
    @login_required
    def students_list():
        """List all students"""
        students = Student.query.order_by(Student.last_name, Student.first_name).all()
        return render_template('students/index.html', students=students)
    
    @app.route('/students/add', methods=['GET', 'POST'])
    @login_required
    def add_student():
        """Add a new student"""
        form = StudentForm()
        if form.validate_on_submit():
            student = Student(
                student_id=form.student_id.data,
                first_name=form.first_name.data,
                last_name=form.last_name.data,
                email=form.email.data,
                phone=form.phone.data,
                date_of_birth=form.date_of_birth.data
            )
            # Generate and store QR data
            student.save_qr_data()
            
            db.session.add(student)
            db.session.commit()
            flash(f'Student {student.full_name()} has been added!', 'success')
            return redirect(url_for('students_list'))
        
        return render_template('students/add.html', form=form)
    
    @app.route('/students/<int:id>/edit', methods=['GET', 'POST'])
    @login_required
    def edit_student(id):
        """Edit an existing student"""
        student = Student.query.get_or_404(id)
        form = StudentForm(student_id=student.student_id)
        
        if form.validate_on_submit():
            student.student_id = form.student_id.data
            student.first_name = form.first_name.data
            student.last_name = form.last_name.data
            student.email = form.email.data
            student.phone = form.phone.data
            student.date_of_birth = form.date_of_birth.data
            
            # Update QR data
            student.save_qr_data()
            
            db.session.commit()
            flash(f'Student {student.full_name()} has been updated!', 'success')
            return redirect(url_for('students_list'))
        
        # Populate form fields
        if request.method == 'GET':
            form.student_id.data = student.student_id
            form.first_name.data = student.first_name
            form.last_name.data = student.last_name
            form.email.data = student.email
            form.phone.data = student.phone
            form.date_of_birth.data = student.date_of_birth
        
        return render_template('students/edit.html', form=form, student=student)
    
    @app.route('/students/<int:id>/view')
    @login_required
    def view_student(id):
        """View a student's profile and QR code"""
        student = Student.query.get_or_404(id)
        
        # Get student's attendance history
        attendance = Attendance.query\
            .filter_by(student_id=student.id)\
            .join(Activity, Attendance.activity_id == Activity.id)\
            .order_by(Attendance.timestamp.desc())\
            .all()
        
        # Generate QR code data for display
        qr_data = student.qr_data
        
        return render_template('students/view.html', 
                              student=student, 
                              attendance=attendance,
                              qr_data=qr_data)
    
    @app.route('/students/<int:id>/delete', methods=['POST'])
    @login_required
    @admin_required
    def delete_student(id):
        """Delete a student (admin only)"""
        student = Student.query.get_or_404(id)
        
        try:
            # Delete associated attendance records first
            Attendance.query.filter_by(student_id=student.id).delete()
            
            db.session.delete(student)
            db.session.commit()
            flash(f'Student {student.full_name()} has been deleted.', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error deleting student: {str(e)}', 'danger')
            logging.error(f"Error deleting student: {str(e)}")
        
        return redirect(url_for('students_list'))
    
    # Activity routes
    @app.route('/activities')
    @login_required
    def activities_list():
        """List all activities"""
        activities = Activity.query.order_by(Activity.start_time.desc()).all()
        return render_template('activities/index.html', activities=activities)
    
    @app.route('/activities/add', methods=['GET', 'POST'])
    @login_required
    def add_activity():
        """Add a new activity"""
        form = ActivityForm()
        if form.validate_on_submit():
            activity = Activity(
                name=form.name.data,
                description=form.description.data,
                location=form.location.data,
                start_time=form.start_time.data,
                end_time=form.end_time.data,
                is_active=form.is_active.data,
                created_by=current_user.id
            )
            db.session.add(activity)
            db.session.commit()
            flash(f'Activity "{activity.name}" has been added!', 'success')
            return redirect(url_for('activities_list'))
        
        return render_template('activities/add.html', form=form)
    
    @app.route('/activities/<int:id>/edit', methods=['GET', 'POST'])
    @login_required
    def edit_activity(id):
        """Edit an existing activity"""
        activity = Activity.query.get_or_404(id)
        form = ActivityForm()
        
        if form.validate_on_submit():
            activity.name = form.name.data
            activity.description = form.description.data
            activity.location = form.location.data
            activity.start_time = form.start_time.data
            activity.end_time = form.end_time.data
            activity.is_active = form.is_active.data
            
            db.session.commit()
            flash(f'Activity "{activity.name}" has been updated!', 'success')
            return redirect(url_for('activities_list'))
        
        # Populate form fields
        if request.method == 'GET':
            form.name.data = activity.name
            form.description.data = activity.description
            form.location.data = activity.location
            form.start_time.data = activity.start_time
            form.end_time.data = activity.end_time
            form.is_active.data = activity.is_active
        
        return render_template('activities/edit.html', form=form, activity=activity)
    
    @app.route('/activities/<int:id>/delete', methods=['POST'])
    @login_required
    @admin_required
    def delete_activity(id):
        """Delete an activity (admin only)"""
        activity = Activity.query.get_or_404(id)
        
        try:
            # Delete associated attendance records first
            Attendance.query.filter_by(activity_id=activity.id).delete()
            
            db.session.delete(activity)
            db.session.commit()
            flash(f'Activity "{activity.name}" has been deleted.', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error deleting activity: {str(e)}', 'danger')
            logging.error(f"Error deleting activity: {str(e)}")
        
        return redirect(url_for('activities_list'))
    
    # Attendance routes
    @app.route('/attendance/take/<int:activity_id>')
    @login_required
    def take_attendance(activity_id):
        """Take attendance for an activity"""
        activity = Activity.query.get_or_404(activity_id)
        
        # Check if activity is ongoing
        if not activity.is_ongoing():
            flash('Cannot take attendance for activities that are not currently active.', 'warning')
            return redirect(url_for('activities_list'))
        
        form = AttendanceScanForm()
        form.activity_id.data = activity_id
        
        return render_template('attendance/take.html', activity=activity, form=form)
    
    @app.route('/attendance/scan', methods=['POST'])
    @login_required
    def scan_attendance():
        """Record attendance from QR scan"""
        form = AttendanceScanForm()
        
        if form.validate_on_submit():
            activity_id = form.activity_id.data
            scanned_data = form.scanned_data.data
            
            # Verify the activity exists
            activity = Activity.query.get_or_404(activity_id)
            
            # Parse the QR data
            try:
                data = json.loads(scanned_data)
                # Đảm bảo data là một dictionary và có khóa 'id'
                if not isinstance(data, dict) or 'id' not in data:
                    return jsonify({'success': False, 'message': 'Invalid QR code format'})
                
                student_id = data.get('id')
                if student_id is None:
                    return jsonify({'success': False, 'message': 'Student ID missing in QR code'})
                
                # Verify the student exists
                student = Student.query.get(student_id)
                if not student:
                    return jsonify({'success': False, 'message': 'Student not found'})
                
                # Record attendance
                success = Attendance.record_attendance(
                    student_id=student.id,
                    activity_id=activity.id,
                    user_id=current_user.id
                )
                
                if success:
                    return jsonify({
                        'success': True, 
                        'message': f'Attendance recorded for {student.full_name()}',
                        'student': {
                            'id': student.id,
                            'name': student.full_name(),
                            'student_id': student.student_id
                        }
                    })
                else:
                    return jsonify({
                        'success': False, 
                        'message': f'Attendance already recorded for {student.full_name()}'
                    })
                
            except json.JSONDecodeError:
                return jsonify({'success': False, 'message': 'Invalid QR code data'})
            except Exception as e:
                logging.error(f"Error recording attendance: {str(e)}")
                return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        
        return jsonify({'success': False, 'message': 'Invalid form submission'})
    
    @app.route('/attendance/view/<int:activity_id>')
    @login_required
    def view_attendance(activity_id):
        """View attendance for a specific activity"""
        activity = Activity.query.get_or_404(activity_id)
        
        # Get attendance records
        attendance_records = Attendance.query\
            .filter_by(activity_id=activity_id)\
            .join(Student, Attendance.student_id == Student.id)\
            .order_by(Attendance.timestamp.asc())\
            .all()
        
        # Calculate attendance statistics
        total_students = Student.query.count()
        attended_count = len(attendance_records)
        attendance_rate = (attended_count / total_students * 100) if total_students > 0 else 0
        
        return render_template('attendance/view.html',
                             activity=activity,
                             attendance_records=attendance_records,
                             total_students=total_students,
                             attended_count=attended_count,
                             attendance_rate=attendance_rate)
    
    @app.route('/attendance/report', methods=['GET', 'POST'])
    @login_required
    def attendance_report():
        """Generate attendance reports with filters"""
        form = AttendanceSearchForm()
        
        # Default to all attendance if no filters
        query = Attendance.query\
            .join(Student, Attendance.student_id == Student.id)\
            .join(Activity, Attendance.activity_id == Activity.id)
        
        if form.validate_on_submit():
            # Apply filters
            if form.activity_id.data:
                query = query.filter(Attendance.activity_id == form.activity_id.data)
            
            if form.student_id.data:
                query = query.join(Student).filter(Student.student_id == form.student_id.data)
            
            if form.date_from.data:
                query = query.filter(Attendance.timestamp >= form.date_from.data)
            
            if form.date_to.data:
                # Add 1 day to include the end date fully
                end_date = form.date_to.data + timedelta(days=1)
                query = query.filter(Attendance.timestamp < end_date)
        
        # Execute query with order
        attendance_records = query.order_by(Attendance.timestamp.desc()).all()
        
        # Get activities for filter dropdown
        activities = Activity.query.order_by(Activity.name).all()
        
        return render_template('attendance/report.html',
                             form=form,
                             attendance_records=attendance_records,
                             activities=activities)
    
    # API routes for QR code data
    @app.route('/api/students/<int:id>/qr-data')
    @login_required
    def get_student_qr_data(id):
        """API endpoint to get a student's QR data"""
        student = Student.query.get_or_404(id)
        
        # Generate fresh QR data
        student.save_qr_data()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'student_id': student.id,
            'student_name': student.full_name(),
            'qr_data': student.qr_data
        })
