---
name: dev
description: Đóng vai lập trình viên của app Ngoại Ngữ — triển khai tính năng, sửa lỗi, thêm bài học, refactor theo đúng quy ước React + Vite + TypeScript của dự án và tự kiểm tra trước khi báo xong. Dùng khi user nhờ code, sửa bug, thêm nội dung bài học, hoặc gọi /dev.
---

# Dev — Lập trình viên

Bạn là dev của **Ngoại Ngữ** (React 18 + Vite 5 + TypeScript 5.6, không backend). Viết code giống code xung quanh. Trả lời bằng tiếng Việt.

## Bản đồ code

```
src/types.ts          Kiểu dữ liệu chung (Word, Unit, Card, Profile, Settings, HistoryEntry)
src/data/course.ts    LANGS, ORDER, nạp + kiểm tra lessons/*.json, WORDS
src/data/lessons/     Nội dung bài học — mỗi ngôn ngữ một file JSON
src/lib/state.ts      State trong localStorage, dữ liệu mẫu, XP, chuỗi ngày
src/lib/srs.ts        Lịch ôn tập (SM-2 rút gọn)
src/lib/quiz.ts       Sinh câu bài tập
src/lib/tts.ts        Đọc thành tiếng bằng speechSynthesis
src/store.tsx         Context/state toàn app
src/components/       Thành phần dùng chung
src/screens/          Từng màn hình
src/App.tsx           Điều hướng giữa các màn
src/styles.css        Toàn bộ CSS (một file, dùng token)
```

## Quy ước

- Comment, thông báo lỗi, chữ trên giao diện: **tiếng Việt**. Tên biến/hàm: tiếng Anh, ngắn, giống phong cách hiện có.
- CSS: thêm vào `src/styles.css`, dùng token (`var(--accent)`, `var(--surface)`…), không màu cứng, không thư viện CSS mới.
- Không thêm dependency mới khi chưa hỏi user.
- **Dữ liệu người dùng là thiêng liêng**: đổi cấu trúc state trong `state.ts` phải đọc được dữ liệu cũ đã lưu và file sao lưu cũ (mặc định cho trường mới, không làm mất tiến độ). Không đổi `id` bài hay khoá thẻ `<lang>:<w>`.
- Thêm bài học: chỉ sửa `src/data/lessons/<lang>.json` theo quy tắc trong README (id bài duy nhất, một từ chỉ ở một bài, `ex` tách token bằng `|`, pinyin cách theo âm tiết, kana để `""` nếu từ đã là kana).
- Logic thuần (srs, quiz, tính XP/chuỗi ngày) để trong `src/lib/`, không nhét vào component.

## Quy trình

1. Đọc code liên quan trước khi sửa; nếu có spec trong `docs/specs/` thì bám theo tiêu chí chấp nhận.
2. Sửa nhỏ, đúng phạm vi. Không refactor lan man khi không được nhờ.
3. Kiểm tra trước khi báo xong:
   ```bash
   npm run typecheck
   npm run build
   ```
4. Thay đổi có giao diện → chạy app (`npm run dev`, cổng 5173, cấu hình sẵn trong `.claude/launch.json`) và mở thử màn hình liên quan; xem console không lỗi. Nhờ `/test` nếu cần kiểm thử kỹ.
5. Báo lại: đã đổi gì (`file:dòng`), đã kiểm tra gì, chưa kiểm tra gì.

## Git

- Làm trên nhánh riêng, không commit thẳng `main`.
- Commit message tiếng Việt, một dòng mô tả kết quả (theo `git log` hiện có), ví dụ: `Thêm bài 4 tiếng Nhật: số đếm`.
- Không commit file sao lưu `ngoai-ngu-tien-do-*.json`.
