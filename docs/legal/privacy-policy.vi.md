# Chính sách quyền riêng tư — Dictionary Mobile

> **BẢN NHÁP (2026-10-13), cần rà soát pháp lý trước khi xuất bản.** Soạn theo quyết định D5. Thay các chỗ trong `[ngoặc vuông]` bằng thông tin thật. Nội dung mô tả đúng cách ứng dụng đang hoạt động trong mã nguồn tại thời điểm soạn; khi tính năng thay đổi, cập nhật lại văn bản này.

Hiệu lực từ: [ngày xuất bản]

## 1. Chúng tôi là ai

Dictionary Mobile ("ứng dụng") do [Tên cá nhân/đơn vị vận hành], địa chỉ [địa chỉ], vận hành. Liên hệ về quyền riêng tư: [email hỗ trợ].

## 2. Nguyên tắc chung: dữ liệu ở trên thiết bị của bạn

Ứng dụng hoạt động theo kiểu **local-first**. Không cần tài khoản, bạn vẫn tra từ, lưu từ vựng, học flashcard, đọc tài liệu và nhập/xuất dữ liệu được. Những dữ liệu này chỉ nằm trên thiết bị của bạn; chúng tôi không nhận được chúng.

Dữ liệu chỉ rời khỏi thiết bị khi bạn **chủ động** dùng một tính năng cloud được nêu ở mục 3.

## 3. Dữ liệu được xử lý khi bạn dùng tính năng cloud

| Tính năng | Dữ liệu gửi đi | Gửi tới | Lưu bao lâu |
| --- | --- | --- | --- |
| Tài khoản (đăng ký, đăng nhập) | Email, mật khẩu (được băm, chúng tôi không đọc được) | Supabase (máy chủ tại Tokyo, Nhật Bản) | Đến khi bạn xóa tài khoản |
| Đồng bộ cloud (chỉ khi bạn bật) | Từ đã lưu, thư mục, flashcard, lịch sử tra cứu, tài liệu Reader, cài đặt, glossary và agent dịch chuyên ngành | Supabase | Đến khi bạn xóa dữ liệu hoặc tài khoản |
| Dịch (DeepL) và Trợ lý AI (OpenAI) | Đoạn văn bản bạn yêu cầu dịch hoặc hội thoại với trợ lý | Máy chủ ứng dụng (Vercel) chuyển tiếp tới DeepL SE hoặc OpenAI | Máy chủ ứng dụng không lưu nội dung. DeepL và OpenAI xử lý theo chính sách API của họ |
| Chấm điểm phát âm | Bản ghi âm và từ cần chấm | Máy chủ ứng dụng chuyển tiếp tới Microsoft Azure AI Speech | **Không lưu.** Bản ghi chỉ nằm trong bộ nhớ trong lúc chấm, rồi bị xóa |
| Xuất ra Google Sheets | Dữ liệu thư mục bạn chọn xuất; mã truy cập Google (đã mã hóa) | Google | Mã truy cập lưu đến khi bạn ngắt kết nối |
| Gửi phản hồi | Nội dung phản hồi, loại phản hồi, thông tin ngữ cảnh bạn nhập | Supabase | [thời hạn, ví dụ 24 tháng] |
| Báo cáo lỗi (chỉ khi bạn bật "Gửi báo cáo lỗi") | Thông tin lỗi kỹ thuật đã lọc bỏ email, mã truy cập và khóa; loại thiết bị và phiên bản ứng dụng | Sentry (Functional Software, Inc.) | Theo thời hạn lưu của Sentry ([ví dụ 90 ngày]) |

Để giới hạn chi phí và chống lạm dụng, máy chủ lưu **bộ đếm số lượt dùng** theo ngày/tháng cho mỗi tài khoản (ví dụ: 20 lượt chấm phát âm mỗi ngày). Bộ đếm chỉ gồm con số, không chứa nội dung bạn gửi.

## 4. Những gì chúng tôi không làm

- Không bán dữ liệu cá nhân.
- Không dùng dữ liệu của bạn để quảng cáo.
- Không có công cụ phân tích hành vi (analytics) trong ứng dụng.
- Không dùng bản dịch máy làm dữ liệu từ điển.

## 5. Cơ sở xử lý

Chúng tôi xử lý dữ liệu khi bạn đồng ý (bật một tính năng cloud, bật báo cáo lỗi, gửi bản ghi để chấm điểm) hoặc khi cần thiết để cung cấp dịch vụ bạn yêu cầu (đăng nhập, đồng bộ). Bạn có thể rút lại sự đồng ý bất cứ lúc nào trong mục Hồ sơ → Riêng tư & dữ liệu.

## 6. Chuyển dữ liệu ra nước ngoài

Các nhà cung cấp nêu ở mục 3 đặt máy chủ ngoài Việt Nam (Nhật Bản, Hoa Kỳ, Liên minh châu Âu). Chúng tôi chỉ gửi phần dữ liệu cần cho tính năng bạn đang dùng. [Bổ sung hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài theo pháp luật Việt Nam về bảo vệ dữ liệu cá nhân, nếu áp dụng.]

## 7. Quyền của bạn

- **Xem và xuất dữ liệu:** Hồ sơ → Riêng tư & dữ liệu → Xuất dữ liệu local.
- **Xóa dữ liệu trên thiết bị:** Hồ sơ → Riêng tư & dữ liệu → Xóa tất cả dữ liệu local.
- **Xóa tài khoản:** Hồ sơ → Bảo mật & dữ liệu → Xóa tài khoản cloud. Yêu cầu được giữ **30 ngày** để bạn có thể hủy; sau đó tài khoản và toàn bộ dữ liệu cloud bị xóa vĩnh viễn. [Nếu cần, cung cấp thêm đường dẫn web để yêu cầu xóa mà không cần mở ứng dụng.]
- **Tắt báo cáo lỗi:** Hồ sơ → Riêng tư & dữ liệu → Gửi báo cáo lỗi.
- Liên hệ [email hỗ trợ] để hỏi, khiếu nại hoặc yêu cầu khác. Chúng tôi trả lời trong vòng [số] ngày.

## 8. Trẻ em

Ứng dụng không dành cho trẻ em dưới [13/16] tuổi. Nếu bạn là cha mẹ và biết con mình đã tạo tài khoản, hãy liên hệ để chúng tôi xóa.

## 9. Bảo mật

Kết nối dùng HTTPS. Mỗi bảng dữ liệu cloud có chính sách truy cập theo chủ sở hữu (Row Level Security): tài khoản này không đọc được dữ liệu của tài khoản khác. Khóa của nhà cung cấp chỉ nằm trên máy chủ, không có trong ứng dụng. Mã truy cập Google được mã hóa trước khi lưu.

## 10. Thay đổi chính sách

Khi chính sách thay đổi, chúng tôi cập nhật ngày hiệu lực ở đầu trang và thông báo trong ứng dụng nếu thay đổi quan trọng.
