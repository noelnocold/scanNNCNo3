Chắc chắn rồi, đây là tài liệu ghi chú kỹ thuật (take note) ở định dạng Markdown, được tạo ra dựa trên phân tích mã nguồn `js-main.js` mà bạn đã cung cấp.

---

# Ghi Chú Kỹ Thuật: Ứng Dụng Gym Tracker (js-main.js)

Tài liệu này phân tích kiến trúc và luồng hoạt động của tệp `js-main.js`, được viết trước khi mã nguồn được hoàn thiện để định hướng phát triển.

## Phần 1: Tóm Tắt Chức Năng

Ứng dụng này là một công cụ theo dõi và quản lý hoạt động tập gym cá nhân, tương tác với Firebase (Firestore và Authentication) để lưu trữ và truy xuất dữ liệu người dùng.

### Chức Năng Chính

*   **Ghi Log Tập Luyện:** Cho phép người dùng ghi lại các buổi tập cho từng nhóm cơ cụ thể (ngày, mức tạ, số lần lặp lại).
*   **Trực Quan Hóa Dữ Liệu:**
    *   **Bảng Điều Khiển Nhóm Cơ:** Hiển thị mô hình cơ thể người (trước/sau) với các nhóm cơ. Các nhóm cơ đã tập sẽ được tô sáng, kèm theo thông tin về số lần tập và mức tạ gần nhất.
    *   **Lịch Tập Theo Tuần:** Hiển thị lịch của tuần hiện tại, đánh dấu những ngày có buổi tập.
*   **Quản Lý Dữ Liệu Cá Nhân:**
    *   **Lịch Sử Tập Luyện:** Hiển thị toàn bộ lịch sử các buổi tập trong một bảng, cho phép tìm kiếm, lọc theo nhóm cơ và xóa các mục đã chọn.
    *   **Số Đo Cơ Thể:** Cho phép người dùng ghi lại và xem lại lịch sử các số đo cơ thể (cân nặng, ngực, eo, hông, tay).

### Chức Năng Phụ

*   **Tùy Chỉnh Giao Diện:** Chuyển đổi giữa giao diện Sáng (Light) và Tối (Dark).
*   **Cấu Hình Tập Luyện:** Cho phép người dùng tự định nghĩa các mức tạ và số lần lặp lại (reps) thường dùng để chọn nhanh khi ghi log.
*   **Xác Thực Người Dùng:** Tích hợp với Firebase Authentication để đảm bảo mỗi người dùng chỉ thấy và quản lý được dữ liệu của riêng mình.
*   **Tương Tác Pop-up:** Hiển thị chi tiết buổi tập khi người dùng nhấp vào một ngày trong lịch tuần.

---

## Phần 2: Phân Tích Chi Tiết Theo Từng Mục

### 1. QUẢN LÝ TRẠNG THÁI & CẤU HÌNH (STATE & CONFIGURATION)

Mục này định nghĩa các hằng số và cấu hình cốt lõi của ứng dụng.

*   **Các biến `frontMuscles`, `backMuscles`, `allMuscles`:**
    *   **Chức năng:** Lưu trữ danh sách các nhóm cơ dưới dạng mảng để dễ dàng quản lý và lặp lại.
    *   **Thành phần chính:** Các mảng (`Array`) chứa chuỗi (`String`).
    *   **Hàm liên quan:** Được sử dụng trong `createMuscleDashboard()` để tạo giao diện và `updateFilterOptions()` để tạo bộ lọc.

*   **Biến `muscleIcons`:**
    *   **Chức năng:** Ánh xạ tên của mỗi nhóm cơ với đường dẫn đến tệp hình ảnh icon tương ứng.
    *   **Thành phần chính:** Đối tượng (`Object`) với cặp `key-value`.
    *   **Hàm liên quan:** Được sử dụng trong `createMuscleDashboard()` và `showDayDetailPopup()` để hiển thị icon cho từng nhóm cơ.

### 3. CÁC HÀM TIỆN ÍCH & LÕI (CORE & UTILITY FUNCTIONS)

Các hàm nhỏ, có thể tái sử dụng trong toàn bộ ứng dụng.

*   **Hàm `saveWorkouts`, `saveBodyMeasurements`, `saveWeightConfig`, `saveRepConfig`:**
    *   **Chức năng:** Lưu các mảng dữ liệu tương ứng vào `localStorage` của trình duyệt. *Lưu ý: Trong phiên bản cuối của mã, các hàm này đã được thay thế bằng logic tương tác với Firestore, nhưng chúng thể hiện ý định ban đầu về việc lưu trữ dữ liệu.*
    *   **Input:** Không có (sử dụng các biến toàn cục `workouts`, `bodyMeasurements`...).
    *   **Output:** Không có (tác dụng phụ là ghi dữ liệu vào Local Storage).

*   **Hàm `formatDate(dateInput)`:**
    *   **Chức năng:** Chuyển đổi một đối tượng Date hoặc chuỗi ngày tháng thành định dạng `DD/MM/YYYY`.
    *   **Input:** `dateInput` (có thể là Timestamp của Firestore, chuỗi ngày tháng).
    *   **Output:** Chuỗi ngày tháng đã được định dạng (ví dụ: "16/11/2025").
    *   **Các bước:**
        1.  Kiểm tra `dateInput` có hợp lệ không.
        2.  Nếu là Timestamp của Firestore (`dateInput.toDate`), chuyển thành đối tượng Date.
        3.  Nếu là chuỗi, tạo đối tượng Date từ chuỗi đó.
        4.  Lấy ngày, tháng, năm và định dạng lại với `padStart` để đảm bảo có 2 chữ số.
        5.  Trả về chuỗi kết quả.
    *   **Thành phần chính:** `new Date()`, `getDate()`, `getMonth()`, `getFullYear()`, `padStart()`.
    *   **Hàm liên quan:** Được sử dụng bởi `showDayDetailPopup()`, `renderHistoryTable()`, `renderBodyMeasurementsTable()`.

*   **Hàm `openModal(modal)` và `closeModal(modal)`:**
    *   **Chức năng:** Thêm hoặc xóa class `open` để hiện hoặc ẩn một modal.
    *   **Input:** `modal` (phần tử DOM của modal).
    *   **Output:** Không có (thay đổi giao diện).
    *   **Hàm liên quan:** Được sử dụng trong các trình xử lý sự kiện để mở/đóng `logModal` và `measurementModal`.

### 6. BẢNG ĐIỀU KHIỂN NHÓM CƠ (MUSCLE DASHBOARD)

Quản lý việc hiển thị và tương tác với sơ đồ cơ thể.

*   **Hàm `getLatestWeight(muscleName)`:**
    *   **Chức năng:** Tìm mức tạ gần nhất mà người dùng đã tập cho một nhóm cơ cụ thể.
    *   **Input:** `muscleName` (string).
    *   **Output:** Số (`Number`) là mức tạ gần nhất, hoặc 0 nếu chưa có dữ liệu.
    *   **Các bước:**
        1.  Lọc mảng `workouts` để lấy các buổi tập của `muscleName`.
        2.  Sắp xếp các buổi tập tìm được theo ngày giảm dần.
        3.  Trả về `weight` của buổi tập đầu tiên trong danh sách đã sắp xếp.
    *   **Hàm liên quan:** Được gọi bởi `updateMuscleMap()` và `openLogModal()`.

*   **Hàm `getProgressIcon(muscleName)`:**
    *   **Chức năng:** So sánh 2 buổi tập gần nhất để xác định icon tiến độ (tăng tạ, giữ nguyên, v.v.).
    *   **Input:** `muscleName` (string).
    *   **Output:** Một đối tượng (`Object`) chứa `icon` và `color`.
    *   **Các bước:**
        1.  Lọc và sắp xếp các buổi tập tương tự như `getLatestWeight`.
        2.  Nếu có ít hơn 2 buổi tập, trả về icon mặc định.
        3.  So sánh `weight` của buổi tập mới nhất và buổi kế cuối. Nếu tăng, trả về icon "tiến bộ".
        4.  Nếu `weight` bằng nhau, so sánh `rep`. Nếu `rep` giảm, trả về icon "cảnh báo".
        5.  Các trường hợp còn lại trả về icon mặc định.
    *   **Thành phần chính:** Logic so sánh giữa hai phần tử đầu tiên của mảng đã được sắp xếp.
    *   **Hàm liên quan:** Được gọi bởi `updateMuscleMap()`.

*   **Hàm `updateMuscleMap()`:**
    *   **Chức năng:** Cập nhật giao diện của sơ đồ cơ thể dựa trên dữ liệu `workouts` hiện tại.
    *   **Input:** Không có (đọc từ biến toàn cục `workouts`).
    *   **Output:** Không có (cập nhật DOM).
    *   **Các bước:**
        1.  Đếm số lần tập cho mỗi nhóm cơ.
        2.  Lặp qua tất cả các nhóm cơ (`allMuscles`).
        3.  Với mỗi nhóm cơ, tìm phần tử DOM tương ứng.
        4.  Gọi `getLatestWeight()` và `getProgressIcon()` để lấy thông tin.
        5.  Cập nhật nội dung (số lần, mức tạ, icon tiến độ) và class (`trained`) cho phần tử DOM đó.
    *   **Hàm liên quan:** Gọi `getLatestWeight()`, `getProgressIcon()`. Được gọi bởi `init()`, `handleConfirmWorkout()`, và sau khi xóa workout.

*   **Hàm `createMuscleDashboard()`:**
    *   **Chức năng:** Tạo cấu trúc HTML cho bảng điều khiển nhóm cơ khi ứng dụng khởi chạy.
    *   **Input:** Không có.
    *   **Output:** Không có (chèn HTML vào `frontBodyContainer` và `backBodyContainer`).
    *   **Các bước:**
        1.  Tạo HTML cho các nhóm cơ "Thân trước" bằng cách lặp qua mảng `frontMuscles`.
        2.  Tạo HTML cho các nhóm cơ "Thân sau" bằng cách lặp qua mảng `backMuscles`.
        3.  Gán sự kiện `click` cho mỗi hình tròn nhóm cơ để gọi `openLogModal()`.
    *   **Hàm liên quan:** Được gọi duy nhất một lần bởi `init()`.

### 7. LỊCH TẬP TRONG TUẦN & POPUP CHI TIẾT

Quản lý việc hiển thị lịch tuần và pop-up thông tin.

*   **Hàm `renderWeeklyView()`:**
    *   **Chức năng:** Vẽ lại giao diện lịch 7 ngày của tuần hiện tại.
    *   **Input:** Không có (đọc từ `workouts`).
    *   **Output:** Không có (cập nhật DOM trong `weeklyDaysContainer`).
    *   **Các bước:**
        1.  Xác định ngày bắt đầu của tuần hiện tại.
        2.  Lặp 7 lần, từ thứ Hai đến Chủ Nhật.
        3.  Trong mỗi lần lặp, tạo chuỗi ngày tháng (`YYYY-MM-DD`).
        4.  Kiểm tra xem trong mảng `workouts` có buổi tập nào trùng với ngày này không.
        5.  Tạo phần tử HTML cho ngày đó, thay đổi màu nền nếu có buổi tập và thêm viền nếu là ngày hôm nay.
    *   **Hàm liên quan:** Được gọi bởi `init()`, `handleConfirmWorkout()`, và sau khi xóa workout.

*   **Hàm `showDayDetailPopup(dateString, dayName, targetElement)`:**
    *   **Chức năng:** Hiển thị một pop-up nhỏ chứa thông tin các nhóm cơ đã tập vào ngày được chọn.
    *   **Input:** `dateString` (ngày được chọn), `dayName` (tên thứ), `targetElement` (phần tử DOM của ngày được click để định vị pop-up).
    *   **Output:** Không có (hiển thị và định vị `dayDetailPopup`).
    *   **Các bước:**
        1.  Lọc `workouts` để lấy các buổi tập của ngày `dateString`.
        2.  Lấy danh sách các nhóm cơ duy nhất đã tập.
        3.  Cập nhật tiêu đề pop-up.
        4.  Nếu không có buổi tập, hiển thị thông báo "không có". Ngược lại, hiển thị danh sách các nhóm cơ.
        5.  Tính toán và thiết lập vị trí (`top`, `left`) của pop-up để nó xuất hiện phía trên ngày được click.
    *   **Hàm liên quan:** Được gọi bởi trình xử lý sự kiện `click` trên `weeklyDaysContainer`.

### 8. MODAL GHI LOG TẬP LUYỆN (WORKOUT LOG MODAL)

Xử lý logic của cửa sổ pop-up dùng để thêm một buổi tập mới.

*   **Hàm `openLogModal(muscleName)`:**
    *   **Chức năng:** Mở và chuẩn bị dữ liệu cho modal ghi log.
    *   **Input:** `muscleName` (string).
    *   **Output:** Không có (hiển thị modal).
    *   **Các bước:**
        1.  Thiết lập tên nhóm cơ cho modal.
        2.  Gọi `getLatestWeight()` để hiển thị mức tạ của buổi tập trước.
        3.  Đặt ngày mặc định là hôm nay.
        4.  Xóa các giá trị cũ trong input và các nút đã chọn.
        5.  Mở modal và focus vào ô nhập tạ.
    *   **Hàm liên quan:** Được gọi khi người dùng click vào một nhóm cơ trên `muscleDashboard`.

*   **Hàm `handleConfirmWorkout()`:**
    *   **Chức năng:** Xử lý logic khi người dùng nhấn nút xác nhận trong modal ghi log.
    *   **Input:** Không có (lấy dữ liệu từ các input trong modal).
    *   **Output:** Không có.
    *   **Các bước:**
        1.  Lấy ID người dùng hiện tại từ `auth.currentUser.uid`.
        2.  Lấy thông tin nhóm cơ, ngày, tạ, rep từ modal.
        3.  Gọi hàm `addWorkoutToFirestore()` để lưu dữ liệu lên server.
        4.  Thêm buổi tập mới vào biến toàn cục `window.workouts`.
        5.  Gọi `renderWeeklyView()`, `updateMuscleMap()`, `renderHistoryTable()` để cập nhật lại toàn bộ giao diện.
        6.  Đóng modal.
    *   **Thành phần chính:** Tương tác với Firestore (`addWorkoutToFirestore`) và cập nhật giao diện.
    *   **Hàm liên quan:** Được gán cho sự kiện `click` của `confirmBtn`.

### 9. LỊCH SỬ TẬP LUYỆN (WORKOUT HISTORY TABLE)

Quản lý bảng hiển thị tất cả các buổi tập đã được ghi lại.

*   **Hàm `renderHistoryTable()`:**
    *   **Chức năng:** Lấy dữ liệu workout từ Firestore và hiển thị lên bảng lịch sử.
    *   **Input:** Không có.
    *   **Output:** Không có (cập nhật `historyTableBody`).
    *   **Các bước:**
        1.  Lấy ID người dùng.
        2.  Gọi `getWorkoutsFromFirestore()` để tải dữ liệu.
        3.  Lấy giá trị từ ô tìm kiếm và bộ lọc.
        4.  Lọc và sắp xếp dữ liệu workout dựa trên các tiêu chí trên.
        5.  Nếu không có dữ liệu, hiển thị thông báo.
        6.  Ngược lại, lặp qua dữ liệu đã lọc và tạo các hàng (`<tr>`) cho bảng.
        7.  Gọi `updateDeleteWorkoutsButtonVisibility()` để ẩn/hiện nút xóa.
    *   **Hàm liên quan:** Được gọi khi chuyển sang tab "Personal", sau khi tìm kiếm/lọc, hoặc sau khi thêm/xóa workout.

*   **Hàm `updateDeleteWorkoutsButtonVisibility()`:**
    *   **Chức năng:** Ẩn/hiện nút "Xóa mục đã chọn" dựa vào việc có checkbox nào được chọn hay không.
    *   **Input:** Không có.
    *   **Output:** Không có (thay đổi class `hidden` của nút).

*   **Hàm `updateFilterOptions()`:**
    *   **Chức năng:** Tạo các tùy chọn (`<option>`) cho bộ lọc nhóm cơ dựa trên danh sách `allMuscles`.
    *   **Input:** Không có.
    *   **Output:** Không có (cập nhật DOM cho `filterSelect`).

### 10. QUẢN LÝ SỐ ĐO CƠ THỂ (BODY MEASUREMENT)

Xử lý các chức năng liên quan đến việc ghi và xem số đo cơ thể.

*   **Hàm `getLatestMeasurement()`:**
    *   **Chức năng:** Lấy bản ghi số đo cơ thể gần nhất từ Firestore.
    *   **Input:** Không có.
    *   **Output:** `Object` chứa số đo gần nhất, hoặc `null`.
    *   **Hàm liên quan:** Được gọi khi mở modal thêm số đo (`addMeasurementBtn` click) để điền sẵn các giá trị cũ.

*   **Hàm `renderBodyMeasurementsTable()`:**
    *   **Chức năng:** Lấy và hiển thị danh sách các lần đo số đo cơ thể lên bảng.
    *   **Input:** Không có.
    *   **Output:** Không có (cập nhật `measurementsTableBody`).
    *   **Các bước:** Tương tự `renderHistoryTable()`, nhưng dành cho dữ liệu số đo cơ thể.

*   **Hàm `handleSaveMeasurement(e)`:**
    *   **Chức năng:** Xử lý việc lưu một bản ghi số đo mới vào Firestore.
    *   **Input:** `e` (sự kiện submit của form).
    *   **Output:** Không có.
    *   **Các bước:**
        1.  Ngăn chặn hành vi mặc định của form.
        2.  Lấy ID người dùng và các giá trị từ input.
        3.  Gọi `addBodyMeasurementToFirestore()` để lưu dữ liệu.
        4.  Gọi `renderBodyMeasurementsTable()` để làm mới bảng.
        5.  Đóng modal.
    *   **Hàm liên quan:** Được gán cho sự kiện `submit` của `measurementForm`.

### 11. CẤU HÌNH TẬP LUYỆN (WORKOUT CONFIGURATION)

Cho phép người dùng tùy chỉnh các nút chọn nhanh mức tạ và rep.

*   **Hàm `renderOptions(...)` và `renderConfigButtons(...)`:**
    *   **Chức năng:** Tạo các nút bấm (`<button>`) từ một mảng cấu hình (`weightConfig`, `repConfig`). `renderOptions` tạo nút cho modal, `renderConfigButtons` tạo nút cho khu vực cài đặt.
    *   **Input:** Container DOM, mảng cấu hình, đơn vị, v.v.
    *   **Output:** Không có (cập nhật DOM).

*   **Hàm `renderAllConfigs()`:**
    *   **Chức năng:** Hàm tổng hợp, gọi các hàm render con để hiển thị tất cả các cấu hình.
    *   **Input:** Không có.
    *   **Các bước:**
        1.  Lấy cấu hình từ Firestore bằng `getConfigurationsFromFirestore`.
        2.  Cập nhật các biến toàn cục `weightConfig`, `repConfig`.
        3.  Gọi `renderOptions` để cập nhật các nút trong modal log.
        4.  Gọi `renderConfigButtons` để cập nhật các nút trong tab cài đặt.

*   **Hàm `addNewConfig(...)`:**
    *   **Chức năng:** Thêm một giá trị mới (tạ hoặc rep) vào mảng cấu hình và lưu lại vào Firestore.
    *   **Input:** Input DOM, mảng cấu hình, hàm callback để lưu.
    *   **Output:** Không có.
    *   **Các bước:**
        1.  Lấy và chuyển đổi giá trị từ input thành số.
        2.  Kiểm tra tính hợp lệ (là số, chưa tồn tại).
        3.  Thêm giá trị mới vào mảng và sắp xếp lại.
        4.  Gọi hàm `updateConfigurationsInFirestore()` để lưu thay đổi.
        5.  Gọi `renderAllConfigs()` để làm mới giao diện.

### 12. KHỞI TẠO ỨNG DỤNG (INITIALIZATION)

Hàm chính để bắt đầu ứng dụng.

*   **Hàm `init()`:**
    *   **Chức năng:** Thiết lập trạng thái ban đầu và khởi chạy các thành phần chính của ứng dụng.
    *   **Input:** Không có.
    *   **Output:** Không có.
    *   **Các bước:**
        1.  Áp dụng theme đã lưu.
        2.  Gọi `createMuscleDashboard()` để tạo sơ đồ cơ thể.
        3.  Sử dụng `auth.onAuthStateChanged()` để lắng nghe trạng thái đăng nhập của người dùng.
        4.  **Nếu người dùng đã đăng nhập:**
            *   Lấy ID người dùng.
            *   Tải toàn bộ dữ liệu cần thiết từ Firestore (`workouts`, `bodyMeasurements`, `configurations`).
            *   Gán dữ liệu vào các biến toàn cục (`window.workouts`...).
            *   Render các thành phần giao diện chính (`updateMuscleMap`, `renderWeeklyView`, `renderAllConfigs`).
        5.  **Nếu người dùng chưa đăng nhập:** Chuyển hướng về trang đăng nhập.
    *   **Thành phần chính:** `auth.onAuthStateChanged` là trái tim của việc khởi tạo, đảm bảo ứng dụng chỉ chạy khi đã xác thực người dùng thành công.