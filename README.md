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

## Tra cứu

Màn **Tra cứu** tìm từ trong tất cả bài học của cả 3 ngôn ngữ.

- Gõ chữ, phiên âm, romaji hoặc nghĩa tiếng Việt; không cần dấu: `xin loi`, `nihao`, `arigato`, `茶` đều ra.
  Gõ có dấu tiếng Việt thì chỉ tìm theo nghĩa (`ăn` không khớp nhầm với `ani`).
- Lọc theo ngôn ngữ, mỗi nút lọc hiện số kết quả. Ô tìm để trống thì liệt kê toàn bộ từ.
- Chi tiết từ: chữ lớn, phiên âm, nghe phát âm, câu ví dụ, trạng thái ôn tập; nút **Thêm vào ôn tập** và **Học bài N**.
- **Tra online** (luôn hiện dưới kết quả trong bài học, tự tra sau khi ngừng gõ ~0,6 giây, gõ tiếp thì huỷ yêu cầu cũ):

  | Dịch vụ | Dùng cho |
  |---|---|
  | [MyMemory](https://mymemory.translated.net/doc/spec.php) | Nghĩa tiếng Việt và chiều Việt → Anh/Trung/Nhật. Miễn phí khoảng 5.000 từ/ngày mỗi máy |
  | [Free Dictionary](https://dictionaryapi.dev/) | Tiếng Anh: IPA, file phát âm, từ loại, định nghĩa, ví dụ |
  | [Wiktionary](https://en.wiktionary.org/api/rest_v1/) | Tiếng Trung, Nhật (và dự phòng cho Anh): từ loại, định nghĩa bằng tiếng Anh. Chữ giản thể / kana tự chuyển sang trang chính qua `{{zh-see}}` / `{{ja-see}}` |

  Các dịch vụ đều cho gọi thẳng từ trình duyệt (có CORS), không cần máy chủ riêng. Ngôn ngữ của từ được đoán tự động (kana → Nhật, chữ Hán → Trung, có dấu tiếng Việt → Việt, còn lại → Anh) và đổi lại được.
  MyMemory lỗi hoặc hết lượt thì dùng bộ dịch trên máy của Chrome (Translator API) nếu có. Jisho chặn CORS nên chưa dùng.
- **Lưu vào sổ từ**: từ tra online được lưu trong `saved` của tiến độ (đi theo file sao lưu) và vào ôn tập như từ trong bài học.

Code: `src/lib/lookup.ts` (chuẩn hoá bỏ dấu, chấm điểm khớp, đoán ngôn ngữ), `src/lib/online.ts` (gọi các dịch vụ online), `src/screens/Lookup.tsx` (màn hình).

## Phiên dịch trực tiếp

Màn **Phiên dịch** nghe micro liên tục, chép lại từng câu người khác nói (Anh, Trung hoặc Nhật) và dịch song song sang tiếng Việt, ví dụ để theo dõi một cuộc họp.

- Nhận giọng nói dùng Web Speech API của trình duyệt: cần Chrome hoặc Edge trên máy tính và có mạng (Chrome gửi âm thanh tới máy chủ Google để nhận dạng).
- Dịch dùng Translator API có sẵn trong Chrome máy tính (bản 138 trở lên), chạy ngay trên máy. Lần đầu Chrome tải gói ngôn ngữ, nút sẽ hiện phần trăm. Trình duyệt không hỗ trợ thì chỉ chép lại lời nói, không dịch.
- Câu được tách theo dấu câu, hoặc theo quãng ngừng khi trình duyệt không thêm dấu câu.
- Đang nghe vẫn chuyển sang màn khác được; menu hiện chấm đỏ ở mục Phiên dịch.
- Bản ghi chỉ nằm trong bộ nhớ của tab: tải lại trang là mất. Dùng **Chép** hoặc **Tải .txt** để giữ lại.

Code: `src/lib/live.ts` (nghe, tách câu, dịch), `src/screens/Live.tsx` (màn hình).

## Tiến độ học và sao lưu

Tiến độ (XP, chuỗi ngày, bài đã xong, thẻ ôn tập, lịch sử kết quả, từ tra online đã lưu) lưu trong localStorage của trình duyệt, nên mỗi máy và mỗi trình duyệt có tiến độ riêng.

Để mang tiến độ sang máy khác: **Cài đặt → Sao lưu tiến độ → Xuất ra file** ở máy cũ, được file `ngoai-ngu-tien-do-<ngày>.json`. Sang máy mới chọn **Nhập từ file**, app hiện tóm tắt nội dung file và hỏi lại trước khi thay tiến độ hiện tại.

File sao lưu chứa dữ liệu học cá nhân, đừng commit nó vào repo.
