# Ngoại Ngữ

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

## Danh sách bài học

Mỗi ngôn ngữ một file trong `src/data/lessons/`: `en.json`, `zh.json`, `ja.json`. Thêm bài hoặc từ mới chỉ cần sửa các file này, không cần đụng vào code.

```json
{
  "lang": "zh",
  "units": [
    {
      "id": "u1",
      "title": "Chào hỏi",
      "words": [
        { "w": "对不起", "r": "duì bu qǐ", "m": "xin lỗi", "ex": "对不起，|我|来|晚|了。", "exR": "Duìbuqǐ, wǒ lái wǎn le.", "exM": "Xin lỗi, tôi đến muộn." }
      ]
    }
  ]
}
```

| Trường | Ý nghĩa |
|---|---|
| `w` | Từ (chữ viết) |
| `r` | Phiên âm: IPA (Anh), pinyin cách nhau theo từng chữ (Trung), kana (Nhật, để `""` nếu từ đã là kana) |
| `m` | Nghĩa tiếng Việt |
| `ex` | Câu ví dụ, tách token bằng `\|`. Câu có từ 3 token trở lên được dùng cho bài sắp xếp câu |
| `exR` | Phiên âm câu ví dụ (không bắt buộc) |
| `exM` | Nghĩa câu ví dụ |
| `ro` | Romaji, chỉ tiếng Nhật (không bắt buộc) |

- `id` bài phải khác nhau trong một file, và không đổi `id` của bài đã có: tiến độ "đã xong" lưu theo `id`.
- Một từ chỉ được nằm trong một bài (thẻ ôn tập lưu theo `<lang>:<w>`).
- Bài có `"words": []` hiện là "Sắp có" trên lộ trình.
- App báo lỗi ngay khi chạy nếu file sai (trùng id bài, trùng từ, sai `lang`).

## Phiên dịch trực tiếp

Màn **Phiên dịch** nghe micro liên tục, chép lại từng câu người khác nói (Anh, Trung hoặc Nhật) và dịch song song sang tiếng Việt, ví dụ để theo dõi một cuộc họp.

- Nhận giọng nói dùng Web Speech API của trình duyệt: cần Chrome hoặc Edge trên máy tính và có mạng (Chrome gửi âm thanh tới máy chủ Google để nhận dạng).
- Dịch dùng Translator API có sẵn trong Chrome máy tính (bản 138 trở lên), chạy ngay trên máy. Lần đầu Chrome tải gói ngôn ngữ, nút sẽ hiện phần trăm. Trình duyệt không hỗ trợ thì chỉ chép lại lời nói, không dịch.
- Câu được tách theo dấu câu, hoặc theo quãng ngừng khi trình duyệt không thêm dấu câu.
- Đang nghe vẫn chuyển sang màn khác được; menu hiện chấm đỏ ở mục Phiên dịch.
- Bản ghi chỉ nằm trong bộ nhớ của tab: tải lại trang là mất. Dùng **Chép** hoặc **Tải .txt** để giữ lại.

Code: `src/lib/live.ts` (nghe, tách câu, dịch), `src/screens/Live.tsx` (màn hình).

## Tiến độ học và sao lưu

Tiến độ (XP, chuỗi ngày, bài đã xong, thẻ ôn tập, lịch sử kết quả) lưu trong localStorage của trình duyệt, nên mỗi máy và mỗi trình duyệt có tiến độ riêng.

Để mang tiến độ sang máy khác: **Cài đặt → Sao lưu tiến độ → Xuất ra file** ở máy cũ, được file `ngoai-ngu-tien-do-<ngày>.json`. Sang máy mới chọn **Nhập từ file**, app hiện tóm tắt nội dung file và hỏi lại trước khi thay tiến độ hiện tại.

File sao lưu chứa dữ liệu học cá nhân, đừng commit nó vào repo.
