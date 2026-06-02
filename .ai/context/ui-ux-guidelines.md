# UI UX Guidelines — Minimalism + Futuristic

## Mục tiêu chung
Giao diện hướng tới phong cách tối giản (minimalism) kết hợp cảm giác tương lai (futuristic): rõ ràng, tập trung nội dung, ít nhiễu, với các dấu hiệu công nghệ tinh tế. Ưu tiên trải nghiệm học tập nhanh, phản hồi tức thời và không gian trống có chủ ý.

Sử dụng `DESIGN.md` như nguồn tham chiếu, nhưng chuyển ngữ và tinh giản cho các bề mặt ứng dụng thực tế (mobile, Expo web). Tránh sao chép thiết kế marketing phức tạp vào màn hình chức năng.

## Ngôn ngữ hình ảnh (Visual Language)
- Thẩm mỹ: không gian âm (negative space) rộng, khối màu phẳng, viền mảnh, và điểm nhấn tinh tế (neon/gradient nhỏ) để gợi cảm giác tương lai.
- Hình khối: ưu tiên góc bo nhỏ (6–12px) cho thành phần giao diện, hoàn toàn tròn chỉ cho các badge và avatar nhỏ.
- Độ sâu: ít shadow; thay bằng overlay mờ, viền sáng mỏng hoặc gradient tuyến tính nhẹ để tách lớp.
- Biểu tượng: sử dụng icon đơn sắc, stroke mảnh, với biến thể sáng/âm (light/dark) và trạng thái glow nhẹ khi hover/focus.

## Màu sắc
- Palette chính: nền trung tính tối giản (canvas trắng hoặc very-dark slate tùy theme) + điểm nhấn neon/purple lạnh cho hành động chính.
- Accent: một tông futuristic (ví dụ: electric purple hoặc cyanish gradient) dùng tiết chế cho CTA, trạng thái hoạt động và highlight.
- Text: ưu tiên đen nhạt / trắng nhạt cho readability; màu sắc khác chỉ để phân cấp thông tin.

## Typography
- Hệ chữ: dùng font sans hiện đại, có cảm giác kỹ thuật (system / Inter / variable sans). Kích thước tập trung vào độ đọc được: tiêu đề ngắn, body 14–16px.
- Trọng lượng: hạn chế chữ đậm; dùng trọng lượng trung bình cho nội dung chính và semi-bold cho CTA ngắn.

## Layout & Spacing
- Lưới đơn giản, dựa trên 8px rhythm; tận dụng khoảng trắng để làm nổi bật hành động.
- Thanh điều hướng và header tối giản: chỉ giữ những hành động then chốt; các hành động bổ trợ vào menu hoặc floating sheet.
- Các thành phần điều khiển nên nằm gần nội dung chúng ảnh hưởng; tránh chồng chéo FAB/toolbars.

## Copy (Ngôn ngữ giao diện)
- Dùng tiếng Việt rõ ràng, ngắn gọn, hướng hành động. Tránh câu dài và thuật ngữ không cần thiết.
- Giữ consistency: label button, trạng thái và thông báo lỗi phải cùng tông. Chỉ để thuật ngữ tiếng Anh khi là tên kỹ thuật, định dạng, hoặc thương hiệu.

## Trạng thái và phản hồi
- Mỗi màn hình cần: empty, loading (skeleton), error (lỗi cụ thể), success, disabled/coming-soon.
- Motion: micro-interactions nhanh (100–250ms), chuyển mượt, glow hoặc subtle scale cho tương tác tương lai.
- Thông báo lỗi/alert: nội dung rõ ràng + hành động khắc phục (ví dụ: "Thử lại" hoặc "Mở cài đặt").

## Motion & Microinteractions
- Dùng animation tiết chế: subtle parallax, hover glow, soft scale cho nút khi nhấn.
- Không dùng animation gây mất tập trung (xoay vòng, nhấp nháy liên tục).

## Accessibility
- Đảm bảo contrast tối thiểu cho body text, hỗ trợ keyboard navigation và focus ring rõ ràng.
- Hỗ trợ screen reader cho các control quan trọng và cung cấp text thay thế cho icon chỉ dùng hình.

## Blocked / Restricted Features
- Rõ ràng ghi nhãn "Sắp có", "Cần đăng nhập", "Cần kết nối Google" hoặc "Cần backend".
- Hiển thị trạng thái kèm hint ngắn gọn (ví dụ: "Kết nối Google để xuất lên Sheets"). Không làm giao diện trông như đã hoạt động nếu feature chưa khả dụng.

## Backend Sync & Database UI/UX
- **Trạng thái đồng bộ (Sync Indicator)**: Cung cấp biểu tượng trực quan rõ ràng tại Profile/Header để hiển thị các trạng thái: Đang đồng bộ (xoay nhẹ), Đã đồng bộ (green check), Thay đổi chưa đẩy (offline queue indicator) và Lỗi đồng bộ.
- **Xung đột dữ liệu (Conflict UI)**: Hạn chế làm gián đoạn người dùng; ưu tiên áp dụng chiến thuật tự động hòa trộn (timestamp/field-level resolution). Nếu cần giải quyết thủ công, hiển thị giao diện đối chiếu trực quan thay vì báo lỗi thô ráp.

## AI Chat & Translation UI/UX
- **Streaming Response**: Giao diện chat và dịch phải hiển thị nội dung dạng text streaming (từng từ hoặc cụm từ) kèm loader động để tạo cảm giác phản hồi nhanh.
- **Giới hạn hạn ngạch (Quota & Rate Limits)**: Hiển thị thanh tiến trình sử dụng hạn ngạch AI (ví dụ: "Đã dùng 15/50 lượt dịch hôm nay") để người dùng chủ động điều chỉnh hành vi.

## Native Permissions & OS STT/OCR UX
- **Quyền truy cập (Permissions)**: Không yêu cầu quyền ngay khi mở app; chỉ yêu cầu quyền camera (cho OCR) hoặc microphone (cho STT) khi người dùng chủ động nhấn vào tính năng tương ứng.
- **Fallback khi từ chối**: Cung cấp màn hình hướng dẫn thân thiện kèm nút "Mở cài đặt thiết bị" nếu quyền bị từ chối, giải thích rõ lý do cần quyền để hoạt động.

## External OAuth & Google Sheets Flows
- **OAuth Popup**: Cảnh báo rõ ràng cho người dùng trước khi chuyển hướng ra trình duyệt ngoài hoặc mở WebBrowser sheet để thực hiện xác thực Google.
- **Hủy kết nối**: Luôn cung cấp tùy chọn "Đăng xuất" hoặc "Thu hồi quyền Sheets" trực quan trong phần cài đặt tài khoản.

## Destructive Actions
- Bắt buộc có xác nhận rõ ràng với tiêu đề, mô tả hậu quả và hành động đảo ngược nếu có thể (ví dụ: "Hoàn tác trong 30s").

## Import / Export UX
- Import: luôn cho preview, mapping cột, và validation trước khi hoàn tất.
- Export: liệt kê định dạng khả dụng và disabled với lý do; show progress + success/failure details.

## Implementation notes (kỹ thuật)
- Minimalism hướng tới performance: tải tài nguyên nhẹ, tránh shadow/blur nặng trên web mobile.
- Theme: cung cấp light và dark themes; chọn palette tương lai cho cả hai.
- Testing: smoke test trên mobile narrow và Expo web, kiểm tra keyboard/voice accessibility.

## Checklist trước khi merge UI changes
- Liệt kê hành động trước đây trên màn hình đã chỉnh
- Đảm bảo mọi hành động cũ vẫn truy cập được
- Đảm bảo modal/drawer/destructive confirmations hoạt động
- Chạy smoke test trên mobile narrow và Expo web
- Chạy formatter/linter cho file đã sửa

---
Nếu muốn, tôi có thể:
- chuyển toàn bộ copy sang tiếng Việt chuẩn (đã làm ở trên),
- áp dụng style tokens ví dụ `colors`/`radius`/`motion` vào `constants/theme.ts`,
- hoặc tạo PR với thay đổi này.
