from datetime import datetime
from app import db
from flask_login import UserMixin
import json

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(20), unique=True, nullable=False)
    first_name = db.Column(db.String(64), nullable=False)
    last_name = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    date_of_birth = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    qr_data = db.Column(db.String(512), nullable=False)
    
    # Define relationship with attendance records
    attendance_records = db.relationship('Attendance', backref='student', lazy=True)
    
    def __repr__(self):
        return f'<Student {self.student_id} - {self.first_name} {self.last_name}>'
    
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def generate_qr_data(self):
        """Generate QR code data containing student information"""
        data = {
            "id": self.id,
            "student_id": self.student_id,
            "name": self.full_name(),
            "timestamp": datetime.utcnow().isoformat()
        }
        return json.dumps(data)
    
    def save_qr_data(self):
        """Generate and save QR data to the student record"""
        self.qr_data = self.generate_qr_data()
        
class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(100))
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Define relationship with attendance records
    attendance_records = db.relationship('Attendance', backref='activity', lazy=True)
    # Define relationship with user who created the activity
    creator = db.relationship('User', backref='activities_created')
    
    def __repr__(self):
        return f'<Activity {self.name}>'
    
    def is_ongoing(self):
        """Check if the activity is currently ongoing"""
        now = datetime.utcnow()
        return self.start_time <= now <= self.end_time and self.is_active
    
    def get_attendance_rate(self):
        """Calculate the attendance rate for this activity"""
        total_students = Student.query.count()
        if total_students == 0:
            return 0
        
        attended_students = Attendance.query.filter_by(activity_id=self.id).count()
        return (attended_students / total_students) * 100

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    scanned_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Define relationship with the user who scanned
    scanner = db.relationship('User', backref='scans')
    
    def __repr__(self):
        return f'<Attendance {self.student_id} for Activity {self.activity_id}>'
    
    @classmethod
    def record_attendance(cls, student_id, activity_id, user_id):
        """Record attendance for a student in an activity"""
        # Check if attendance already recorded
        existing = cls.query.filter_by(
            student_id=student_id,
            activity_id=activity_id
        ).first()
        
        if existing:
            # Already recorded
            return False
        
        # Record new attendance
        attendance = cls(
            student_id=student_id,
            activity_id=activity_id,
            scanned_by=user_id
        )
        db.session.add(attendance)
        db.session.commit()
        return True
