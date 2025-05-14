from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, TextAreaField, DateField, DateTimeField, HiddenField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError
from models import User, Student, Activity

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=64)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    is_admin = BooleanField('Admin Access')
    submit = SubmitField('Register')
    
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username is already taken. Please choose a different one.')
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email is already registered. Please use a different one.')

class StudentForm(FlaskForm):
    student_id = StringField('Student ID', validators=[DataRequired(), Length(min=4, max=20)])
    first_name = StringField('First Name', validators=[DataRequired(), Length(max=64)])
    last_name = StringField('Last Name', validators=[DataRequired(), Length(max=64)])
    email = StringField('Email', validators=[DataRequired(), Email(), Length(max=120)])
    phone = StringField('Phone Number', validators=[Length(max=20)])
    date_of_birth = DateField('Date of Birth', format='%Y-%m-%d')
    submit = SubmitField('Submit')
    
    def __init__(self, *args, student_id=None, **kwargs):
        super(StudentForm, self).__init__(*args, **kwargs)
        self.original_student_id = student_id
    
    def validate_student_id(self, student_id):
        if self.original_student_id != student_id.data:
            student = Student.query.filter_by(student_id=student_id.data).first()
            if student:
                raise ValidationError('This student ID is already registered.')
    
    def validate_email(self, email):
        student = Student.query.filter_by(email=email.data).first()
        if student and (not self.original_student_id or student.student_id != self.original_student_id):
            raise ValidationError('This email is already registered.')

class ActivityForm(FlaskForm):
    name = StringField('Activity Name', validators=[DataRequired(), Length(max=100)])
    description = TextAreaField('Description')
    location = StringField('Location', validators=[Length(max=100)])
    start_time = DateTimeField('Start Time', format='%Y-%m-%dT%H:%M', validators=[DataRequired()])
    end_time = DateTimeField('End Time', format='%Y-%m-%dT%H:%M', validators=[DataRequired()])
    is_active = BooleanField('Active')
    submit = SubmitField('Submit')
    
    def validate_end_time(self, end_time):
        if end_time.data <= self.start_time.data:
            raise ValidationError('End time must be after start time.')

class AttendanceSearchForm(FlaskForm):
    activity_id = HiddenField()
    student_id = StringField('Student ID')
    date_from = DateField('From Date', format='%Y-%m-%d')
    date_to = DateField('To Date', format='%Y-%m-%d')
    submit = SubmitField('Search')

class AttendanceScanForm(FlaskForm):
    activity_id = HiddenField('Activity', validators=[DataRequired()])
    scanned_data = HiddenField('Scanned Data', validators=[DataRequired()])
    submit = SubmitField('Record Attendance')
