import json
from functools import wraps
from flask import flash, redirect, url_for
from flask_login import current_user

def admin_required(f):
    """Decorator to require admin access for a route"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('You need admin privileges to access this page.', 'danger')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated_function

def generate_qr_code_data(student):
    """Generate QR code data for a student"""
    # This function creates the QR code data structure
    data = {
        'id': student.id,
        'student_id': student.student_id,
        'name': f"{student.first_name} {student.last_name}"
    }
    return json.dumps(data)
