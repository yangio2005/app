# Hướng dẫn triển khai trên Vercel

## Giới thiệu
Đây là hướng dẫn chi tiết để triển khai hệ thống quản lý sinh viên và điểm danh bằng mã QR trên Vercel. Vercel là một nền tảng triển khai hiện đại, hỗ trợ các ứng dụng Python/Flask.

## Các bước triển khai

### 1. Đăng ký tài khoản Vercel
- Truy cập [vercel.com](https://vercel.com) và đăng ký tài khoản mới (nếu chưa có)
- Bạn có thể đăng nhập bằng GitHub, GitLab, hoặc Bitbucket

### 2. Chuẩn bị mã nguồn
- Đảm bảo mã nguồn được lưu trữ trong một kho Git (GitHub, GitLab, Bitbucket)
- Các file cấu hình Vercel đã được thêm vào dự án:
  - `vercel.json`: Cấu hình routing và build
  - `requirements.txt.vercel`: Danh sách các gói cần thiết (đổi tên thành `requirements.txt` khi triển khai)

### 3. Triển khai trên Vercel
- Đăng nhập vào Vercel Dashboard
- Nhấp vào "New Project"
- Chọn kho lưu trữ chứa mã nguồn của bạn
- Trong quá trình cấu hình:
  - Framework Preset: Chọn "Other"
  - Root Directory: Để trống (nếu dự án nằm ở thư mục gốc)
  - Build Command: Để trống
  - Output Directory: Để trống
  - Đổi tên `requirements.txt.vercel` thành `requirements.txt`

### 4. Thiết lập biến môi trường
- Trong phần "Environment Variables" của dự án Vercel, thêm các biến sau:
  - `SESSION_SECRET`: Một chuỗi ngẫu nhiên và an toàn để mã hóa phiên đăng nhập
  - `DATABASE_URL`: URL kết nối đến cơ sở dữ liệu PostgreSQL. Vercel không có cơ sở dữ liệu tích hợp, bạn cần sử dụng dịch vụ bên ngoài như:
    - [Neon Postgres](https://neon.tech/)
    - [Supabase](https://supabase.com/)
    - [Railway](https://railway.app/)
    - [ElephantSQL](https://www.elephantsql.com/)
  - `FLASK_APP`: main.py

### 5. Triển khai và xác minh
- Nhấp "Deploy" để bắt đầu quá trình triển khai
- Vercel sẽ build và triển khai ứng dụng của bạn
- Sau khi hoàn tất, kiểm tra URL được cung cấp để xác nhận ứng dụng hoạt động bình thường

## Lưu ý quan trọng

### Cơ sở dữ liệu
Vercel không cung cấp cơ sở dữ liệu PostgreSQL, vì vậy bạn cần sử dụng dịch vụ cơ sở dữ liệu bên ngoài.

### Serverless Functions
Vercel sử dụng serverless functions, điều này có thể ảnh hưởng đến hiệu suất với các yêu cầu lâu dài hoặc tác vụ nặng. Hãy tối ưu hóa ứng dụng của bạn nếu cần thiết.

### Tài khoản Admin
Khi ứng dụng khởi động lần đầu, một tài khoản admin mặc định sẽ được tạo với thông tin đăng nhập:
- Tên người dùng: `admin`
- Mật khẩu: `admin123`

**Hãy đổi mật khẩu này ngay sau khi đăng nhập lần đầu để đảm bảo an toàn!**

## Khắc phục sự cố

### Ứng dụng không hoạt động sau khi triển khai
- Kiểm tra logs triển khai trong Vercel Dashboard
- Xác minh các biến môi trường đã được thiết lập chính xác
- Đảm bảo kết nối cơ sở dữ liệu hoạt động

### Lỗi Internal Server Error
- Kiểm tra kết nối cơ sở dữ liệu
- Xác minh `SESSION_SECRET` đã được thiết lập