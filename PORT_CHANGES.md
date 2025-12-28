cd backend# ✅ Đã Thay Đổi Port Configuration

## 📋 Tóm tắt thay đổi

### Port mới:
- **Backend**: `http://localhost:8000` (trước đây: 5000)
- **Frontend**: `http://localhost:4000` (trước đây: 3000)

## 📝 Các file đã được cập nhật:

### Backend:
- ✅ `backend/env.example` - PORT=8000
- ✅ `backend/setup.js` - PORT=8000 trong envContent
- ✅ `backend/src/server.ts` - Default port 8000
- ✅ `backend/SETUP.md` - Tất cả references đã cập nhật

### Frontend:
- ✅ `frontend/vite.config.ts` - Port 4000 và proxy target 8000
- ✅ `frontend/SETUP.md` - Tất cả references đã cập nhật

### Documentation:
- ✅ `README.md` - Đã cập nhật port references
- ✅ `CONNECTION_GUIDE.md` - Đã cập nhật port references

## ⚠️ Quan trọng: Cập nhật file .env

Nếu bạn đã tạo file `.env` trước đó, bạn cần **cập nhật thủ công**:

1. Mở file `backend/.env`
2. Thay đổi dòng `PORT=5000` thành `PORT=8000`
3. Lưu file

Hoặc xóa file `.env` cũ và chạy lại:
```bash
cd backend
npm run setup
```

## 🚀 Cách chạy với port mới:

### Backend:
```bash
cd backend
npm run dev
# Sẽ chạy tại: http://localhost:8000
```

### Frontend:
```bash
cd frontend
npm run dev
# Sẽ chạy tại: http://localhost:4000
```

## ✅ Kiểm tra kết nối:

1. Backend health check:
   ```bash
   curl http://localhost:8000/api/health
   ```

2. Frontend (mở browser):
   ```
   http://localhost:4000
   ```

3. Test proxy (từ frontend):
   - Mở browser console tại `http://localhost:4000`
   - Chạy: `fetch('/api/health').then(r => r.json()).then(console.log)`

## 📌 Lưu ý:

- ✅ Proxy configuration đã được cập nhật tự động
- ✅ Tất cả API calls từ frontend sẽ tự động forward tới backend:8000
- ✅ Không cần thay đổi code trong các component, tất cả đã được cấu hình tự động






