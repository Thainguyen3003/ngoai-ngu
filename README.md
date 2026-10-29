# Ba Ngữ

Web học tiếng Anh, tiếng Trung và tiếng Nhật cho người Việt. React 18 + Vite + TypeScript, không cần backend.

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # kiểm tra kiểu + build ra dist/
```

## Cấu trúc

```
src/
  data/course.ts        Nội dung khóa học (bài, từ, câu ví dụ) và thông tin từng ngôn ngữ
  lib/state.ts          State lưu trong localStorage, dữ liệu mẫu, XP, chuỗi ngày
  lib/srs.ts            Lịch ôn tập ngắt quãng (SM-2 rút gọn)
  lib/quiz.ts           Sinh 10 câu bài tập cho một bài
  lib/tts.ts            Đọc thành tiếng bằng giọng có sẵn của trình duyệt
  components/           Header, thanh tab, thẻ từ (ô 田字格, pinyin theo thanh điệu), cài đặt
  screens/              Onboarding, Home, Path, Lesson, Quiz, Result, Review, Deck
  App.tsx               Điều hướng giữa các màn và xử lý khi xong bài / phiên ôn
```

## Thêm bài học

Thêm một mục vào `RAW` trong `src/data/course.ts`. Mỗi từ là:

```ts
W(chữ, phiên âm, nghĩa, 'câu|ví|dụ', 'phiên âm câu', 'nghĩa câu', romaji)
```

- Tiếng Trung: pinyin cách nhau theo từng chữ (`'duì bu qǐ'`) để hiện trên từng ô.
- Tiếng Nhật: phiên âm là kana (để trống nếu từ đã là kana), tham số cuối là romaji.
- Câu ví dụ tách token bằng `|`; câu có từ 3 token trở lên được dùng cho bài sắp xếp câu.
- Bài có `words: []` hiện là "Sắp có" trên lộ trình.
