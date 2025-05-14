#!/bin/bash

# Cài đặt các gói Python nếu cần
pip install -r requirements.txt

# Khởi động ứng dụng với Gunicorn
gunicorn --bind 0.0.0.0:$PORT --reuse-port --reload main:app