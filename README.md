# Atticus Quiz

Atticus Quiz là công cụ hỗ trợ chuyển đổi đề trắc nghiệm từ file DOCX thành dữ liệu có cấu trúc, cho phép chỉnh sửa câu hỏi, dùng Gemini AI để trích xuất hoặc giải đáp, sau đó xuất kết quả ra file Excel hoặc HTML.

Dự án phù hợp cho giáo viên, người biên soạn đề, hoặc người cần chuẩn hóa ngân hàng câu hỏi từ tài liệu Word sang định dạng có thể nhập lại, chỉnh sửa và chia sẻ.

## Tính năng chính

- Tải lên một hoặc nhiều file `.docx` chứa câu hỏi.
- Dùng Gemini AI để phân tích nội dung và tách câu hỏi tự động.
- Hỗ trợ nhiều dạng câu hỏi:
  - Trắc nghiệm một đáp án.
  - Câu hỏi checkbox / đúng sai nhiều lựa chọn.
  - Câu hỏi điền khuyết.
- Chỉnh sửa câu hỏi, đáp án, thời gian làm bài và giải thích đáp án trực tiếp trên giao diện.
- Nhập lại file kết quả đã xuất trước đó để tiếp tục chỉnh sửa.
- Dán nhanh chuỗi đáp án để áp dụng hàng loạt.
- Dùng AI để giải câu hỏi và tạo giải thích đáp án.
- Tùy chọn bật / tắt tìm kiếm khi AI giải câu hỏi.
- Chia nhỏ dữ liệu đầu vào theo câu hỏi, theo phần / bài, hoặc xử lý toàn bộ file.
- Chia nhỏ file xuất theo số lượng câu hỏi, file nguồn hoặc nhóm xử lý.
- Xuất kết quả ra:
  - `.xlsx`
  - `.html`
- Xem trước bản HTML trước khi tải xuống.
- Tạo site Netlify và link công khai cho bài quiz HTML.

## Công nghệ sử dụng

- React
- TypeScript
- Vite
- Gemini API thông qua `@google/genai`
- `xlsx` để xuất file Excel
- `mammoth` để đọc nội dung từ file DOCX trên trình duyệt
- Netlify API để tạo site và deploy bài quiz HTML

## Yêu cầu hệ thống

Trước khi chạy dự án, hãy cài đặt:

- Node.js phiên bản 18 trở lên
- npm hoặc một trình quản lý package tương thích
- Gemini API key

Bạn có thể lấy Gemini API key từ Google AI Studio.

## Cài đặt

Clone repository:

```bash
git clone https://github.com/sdmsdjs/atticus-quiz.git
cd atticus-quiz
```

Cài đặt dependencies:

```bash
npm install
```

## Cấu hình biến môi trường

Tạo file `.env.local` ở thư mục gốc của dự án:

```bash
touch .env.local
```

Thêm Gemini API key vào file `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Lưu ý: ứng dụng cũng cho phép nhập Gemini API key trực tiếp trên giao diện. API key được lưu trong `localStorage` của trình duyệt để tiện sử dụng lại.

## Chạy dự án ở môi trường local

```bash
npm run dev
```

Sau khi chạy lệnh trên, mở địa chỉ Vite hiển thị trong terminal, thường là:

```text
http://localhost:5173
```

## Build production

```bash
npm run build
```

## Xem trước bản build

```bash
npm run preview
```

## Kiểm tra TypeScript

```bash
npm run lint
```

Lệnh này chạy TypeScript ở chế độ kiểm tra lỗi mà không tạo file build.

## Hướng dẫn sử dụng

### 1. Nhập Gemini API key

Trên giao diện ứng dụng, nhập một hoặc nhiều Gemini API key.

Có thể nhập nhiều key bằng cách phân tách bởi dấu cách, dấu phẩy, dấu chấm phẩy hoặc xuống dòng. Ứng dụng sẽ tự tạo pool key để xử lý nhiều tác vụ song song và giảm lỗi giới hạn tốc độ.

### 2. Chọn model AI

Nhập tên model Gemini muốn sử dụng. Nếu không thay đổi, ứng dụng sẽ dùng model mặc định được định nghĩa trong `services/geminiService`.

### 3. Tùy chỉnh tốc độ xử lý

Có thể cấu hình:

- Thời gian nghỉ giữa các request API.
- Số lần thử lại khi API bị lỗi tạm thời.
- Thời gian chờ trước khi thử lại.
- Số tác vụ xử lý song song.

Các tùy chọn này hữu ích khi xử lý đề lớn hoặc khi Gemini API trả lỗi quota / rate limit.

### 4. Tải file DOCX

Chọn một hoặc nhiều file `.docx` chứa nội dung câu hỏi.

Ứng dụng sẽ đọc nội dung file bằng `mammoth`, sau đó gửi nội dung sang Gemini để tách câu hỏi thành dữ liệu có cấu trúc.

### 5. Chọn cách chia nhỏ đầu vào

Có 3 chế độ:

- Không chia nhỏ: xử lý toàn bộ file trong một lần.
- Chia theo câu hỏi: phù hợp với tài liệu có đánh số `Câu 1`, `Câu 2`, `Question 1`, ...
- Chia theo phần / bài: phù hợp với tài liệu có cấu trúc `Bài 1`, `Phần 1`, `Chủ đề 1`, ...

Nếu không nhận diện được cấu trúc, ứng dụng sẽ tự chia nội dung theo độ dài ký tự để tránh gửi prompt quá lớn.

### 6. Xử lý bằng AI

Nhấn nút xử lý để Gemini phân tích file và tạo danh sách câu hỏi.

Sau khi xử lý xong, danh sách câu hỏi sẽ hiển thị trong bảng để bạn kiểm tra và chỉnh sửa.

### 7. Chỉnh sửa câu hỏi

Bạn có thể chỉnh sửa:

- Nội dung câu hỏi.
- Các lựa chọn đáp án.
- Loại câu hỏi.
- Đáp án đúng.
- Thời gian làm bài.
- Link hình ảnh.
- Giải thích đáp án.

### 8. Dán nhanh đáp án trắc nghiệm

Với câu hỏi trắc nghiệm một đáp án, có thể dán chuỗi đáp án như:

```text
A B C D A C
```

Hoặc:

```text
1 2 3 4 1 3
```

Ứng dụng sẽ tự ánh xạ:

- A → 1
- B → 2
- C → 3
- D → 4
- E → 5

### 9. Dán nhanh đáp án đúng / sai cho checkbox

Với câu hỏi checkbox hoặc đúng sai nhiều ý, có thể dán chuỗi như:

```text
Đ S Đ S
```

Ứng dụng cũng hỗ trợ một số biến thể như:

- Đúng / Sai
- Dung / Sai
- True / False
- T / F
- 1 / 0

### 10. Dùng AI để giải câu hỏi

Sau khi có danh sách câu hỏi, có thể dùng AI để tự động xác định đáp án đúng và tạo giải thích.

Tùy chọn tìm kiếm có thể bật hoặc tắt tùy nhu cầu.

### 11. Import lại file đã xuất

Ứng dụng hỗ trợ import lại file output ở định dạng:

- `.xlsx`
- `.xls`
- `.html`
- `.htm`

Tính năng này giúp tiếp tục chỉnh sửa dữ liệu đã xuất trước đó.

### 12. Xuất file

Có thể xuất kết quả ra:

- Excel `.xlsx`
- HTML `.html`

Các chế độ chia file xuất:

- Không chia: xuất toàn bộ câu hỏi vào một file.
- Chia theo số lượng câu hỏi.
- Chia theo file nguồn.
- Chia theo nhóm xử lý.

### 13. Tạo link Netlify

Sau khi có danh sách câu hỏi, có thể tạo site Netlify trực tiếp từ bản HTML quiz:

1. Bấm `Create Link`.
2. Chọn `Bài deploy` nếu output đang được chia thành nhiều file.
3. Mở `Settings` nếu muốn đổi `Site slug` hoặc dùng token riêng.
4. Chờ Netlify trả về trạng thái `ready`.

Ứng dụng tạo một Netlify site mới, deploy file `index.html`, sau đó hiển thị link công khai dạng `https://<site>.netlify.app`.

Mặc định, nút `Create Link` dùng Netlify token được cấu hình ở server bằng biến môi trường `NETLIFY_ACCESS_TOKEN`. Không đưa token này vào code frontend, không đặt trong biến `VITE_*`, và không commit vào GitHub.

Nếu deploy app này lên Netlify, cấu hình token mặc định như sau:

1. Vào `https://app.netlify.com/user/applications#personal-access-tokens` để tạo personal access token.
2. Vào site Netlify đang host app này.
3. Mở `Site configuration` → `Environment variables`.
4. Thêm biến `NETLIFY_ACCESS_TOKEN` với token thật.
5. Deploy lại app.

Khi chạy local chỉ bằng `npm run dev`, Netlify Function mặc định không chạy. Có thể chuyển `Settings` → `Cách deploy` sang `Token riêng của người dùng`, hoặc chạy bằng Netlify CLI nếu muốn test đường server-side.

## Cấu trúc thư mục

```text
atticus-quiz/
├── components/          # Các component giao diện
├── services/            # Logic gọi Gemini / Netlify API và xử lý AI
├── netlify/functions/   # Netlify Function giữ token mặc định ở server
├── utils/               # Hàm import / export XLSX, HTML
├── App.tsx              # Component chính của ứng dụng
├── index.tsx            # Entry point React
├── index.css            # CSS chính
├── types.ts             # Kiểu dữ liệu dùng chung
├── vite.config.ts       # Cấu hình Vite
├── package.json         # Dependencies và scripts
└── README.md            # Tài liệu hướng dẫn dự án
```

## Scripts có sẵn

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy ứng dụng ở môi trường phát triển |
| `npm run build` | Build ứng dụng cho production |
| `npm run preview` | Xem trước bản build production |
| `npm run lint` | Kiểm tra lỗi TypeScript |

## Lưu ý bảo mật

- Không commit file `.env`, `.env.local` hoặc bất kỳ file env thật nào lên GitHub.
- Không chia sẻ Gemini API key công khai.
- Không chia sẻ Netlify personal access token công khai.
- Nếu API key bị lộ, hãy thu hồi và tạo key mới.
- Không đặt Netlify token vào biến `VITE_*`; các biến này sẽ bị đóng gói vào frontend.
- Khi nhập API key trên giao diện, key có thể được lưu trong `localStorage` của trình duyệt.
- Khi nhập Netlify token trên giao diện, token cũng có thể được lưu trong `localStorage` của trình duyệt.
- Với token mặc định, token thật chỉ nên nằm trong biến môi trường server `NETLIFY_ACCESS_TOKEN`.

## Xử lý lỗi thường gặp

### Ứng dụng báo chưa nhập API key

Hãy nhập Gemini API key trên giao diện hoặc cấu hình trong file `.env.local`.

### Không đọc được file DOCX

Kiểm tra lại file có đúng định dạng `.docx` không. File `.doc` cũ có thể không được hỗ trợ tốt.

### AI không tách được câu hỏi

Hãy thử:

- Chia nhỏ file theo câu hỏi.
- Chia nhỏ file theo phần / bài.
- Làm rõ định dạng câu hỏi trong tài liệu.
- Giảm số lượng câu hỏi mỗi lần xử lý.

### Lỗi quota hoặc rate limit

Hãy thử:

- Tăng thời gian nghỉ giữa các request.
- Giảm số tác vụ xử lý song song.
- Tăng số lần thử lại.
- Sử dụng nhiều Gemini API key nếu có.

### File xuất bị chia thành nhiều phần

Kiểm tra chế độ chia file xuất. Nếu muốn xuất một file duy nhất, chọn chế độ không chia.

## Định dạng dữ liệu câu hỏi

Mỗi câu hỏi thường bao gồm các trường:

- Nội dung câu hỏi.
- Danh sách lựa chọn.
- Loại câu hỏi.
- Đáp án đúng.
- Thời gian làm bài.
- Link hình ảnh.
- Giải thích đáp án.
- File nguồn.
- Nhóm xử lý.

## Đóng góp

Bạn có thể đóng góp bằng cách:

1. Fork repository.
2. Tạo branch mới.
3. Commit thay đổi.
4. Mở pull request.

```bash
git checkout -b feature/ten-tinh-nang
npm run lint
npm run build
git add .
git commit -m "Add feature"
git push origin feature/ten-tinh-nang
```

## Giấy phép

Dự án hiện chưa khai báo license. Nếu muốn công khai mã nguồn, nên thêm file `LICENSE` phù hợp, ví dụ MIT License.

## Tác giả

Dự án được phát triển bởi `sdmsdjs`.
