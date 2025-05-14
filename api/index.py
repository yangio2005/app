from app import app

# Chức năng này cho phép Vercel sử dụng ứng dụng Flask
# Không thay đổi tên hàm này

def handler(request, **kwargs):
    """
    Hàm xử lý yêu cầu cho Vercel serverless function
    """
    return app(request.environ, request.start_response)