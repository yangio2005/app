# Hệ thống Quản lý Sinh viên với QR Code

Hệ thống quản lý sinh viên và điểm danh bằng mã QR (2D/3D) cho các hoạt động khác nhau.

## Tính năng chính

- Đăng nhập/Đăng ký người dùng (Admin/Nhân viên)
- Quản lý sinh viên
- Quản lý hoạt động
- Tạo mã QR (2D và 3D) cho sinh viên
- Quét mã QR để điểm danh
- Báo cáo và thống kê điểm danh

## Triển khai trên Glitch

### Các bước thực hiện

1. **Tạo dự án mới trên Glitch**
   - Tạo một dự án Python mới

2. **Tải code lên**
   - Tải tất cả các file từ Replit lên Glitch (có thể dùng tính năng Import/Export)
   - Đảm bảo tải lên tất cả các thư mục: `static`, `templates`, và các file Python

3. **Đổi tên `requirements.txt.glitch` thành `requirements.txt`**
   - Đây là file danh sách các gói cần thiết

4. **Thiết lập biến môi trường**
   - Trong Glitch, vào "🔑 .env" để thiết lập biến môi trường
   - Thiết lập `SESSION_SECRET` bằng một chuỗi ngẫu nhiên an toàn
   - Nếu muốn dùng SQLite (mặc định): `DATABASE_URL=sqlite:///student_management.db`
   - Nếu muốn dùng PostgreSQL: Tạo cơ sở dữ liệu và thiết lập `DATABASE_URL` tương ứng

5. **Chạy ứng dụng**
   - Trong Glitch, thiết lập file start với lệnh: `bash start.sh`
   - Hoặc thiết lập trực tiếp: `gunicorn --bind 0.0.0.0:$PORT main:app`

6. **Tạo tài khoản admin (nếu cần)**
   - Ứng dụng tự động tạo tài khoản admin với username: `admin` và password: `admin123`
   - Hãy đổi mật khẩu này sau khi đăng nhập lần đầu!

## Lưu ý bảo mật

- Thay đổi `SESSION_SECRET` thành một chuỗi ngẫu nhiên phức tạp
- Thay đổi mật khẩu admin mặc định ngay sau khi cài đặt
- Nếu triển khai cho môi trường thực tế, hãy sử dụng PostgreSQL thay vì SQLite