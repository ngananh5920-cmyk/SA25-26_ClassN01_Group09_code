# Hướng dẫn Thiết lập Frontend

## Bước 1: Cài đặt Dependencies

```bash
npm install
```

## Bước 2: Kiểm tra kết nối Backend

Frontend đã được cấu hình sẵn để kết nối với backend qua proxy:
- Frontend chạy tại: `http://localhost:4000`
- Backend API: `http://localhost:8000/api`
- Proxy tự động forward các request `/api/*` tới backend

## Bước 3: Chạy Frontend

```bash
npm run dev
```

Frontend sẽ:
- ✅ Tự động kết nối với backend qua proxy
- ✅ Chạy trên http://localhost:4000
- ✅ Hot reload khi code thay đổi

## Lưu ý

⚠️ **Đảm bảo Backend đang chạy** trước khi start frontend:
- Backend phải chạy tại `http://localhost:8000`
- Nếu backend chạy ở port khác, cập nhật `vite.config.ts`:
  ```typescript
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:YOUR_PORT', // Thay YOUR_PORT
        changeOrigin: true,
      },
    },
  },
  ```

## Build Production

```bash
npm run build
npm run preview
```

## Troubleshooting

### Lỗi: "Failed to fetch" hoặc CORS
- ✅ Đảm bảo backend đang chạy
- ✅ Kiểm tra backend có enable CORS không
- ✅ Kiểm tra proxy trong vite.config.ts

### Lỗi: "Port 4000 already in use"
- ✅ Thay đổi port trong vite.config.ts:
  ```typescript
  server: {
    port: 4001, // Port khác
  }
  ```

### Test kết nối:
Mở browser console và chạy:
```javascript
fetch('/api/health').then(r => r.json()).then(console.log)
```

Kết quả mong đợi:
```json
{
  "status": "OK",
  "message": "HRM API is running"
}
```

