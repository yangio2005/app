#!/bin/bash

# Cài đặt các gói Python nếu cần
if [ -f "requirements.txt.glitch" ]; then
    # Nếu tệp requirements.txt.glitch tồn tại, đổi tên nó thành requirements.txt
    cp requirements.txt.glitch requirements.txt
fi
pip install -r requirements.txt

# Khởi động ứng dụng với Gunicorn
gunicorn --bind 0.0.0.0:$PORT --reuse-port --reload main:app