// Khởi tạo Firebase với cấu hình từ file firebase-config.js
firebase.initializeApp(firebaseConfig);

// Tạo đối tượng Firestore và Auth để thao tác với Firestore và xác thực người dùng
const firestore = firebase.firestore();
const auth = firebase.auth();

let isLoggingIn = false;

// Đăng nhập Google:
// Khi người dùng bấm nút đăng nhập, mở popup Google để xác thực.
// Nếu đăng nhập thành công, gọi showUserInfo để cập nhật giao diện.
// Nếu thất bại, hiển thị thông báo lỗi.
document.getElementById('login-google').addEventListener('click', () => {
    if (isLoggingIn) return; // Đang đăng nhập, không cho nhấn tiếp
    isLoggingIn = true;
    document.getElementById('login-google').disabled = true;

    // Hiển thị trạng thái đang xử lý
    document.getElementById('user-info').style.margin = '5px';
    const infoDiv = document.getElementById('user-info');
    infoDiv.innerHTML = 'Đang xử lý...';

    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            showUserInfo(result.user);
        })
        .catch(error => {
            alert('Đăng nhập thất bại: ' + error.message);
            showUserInfo(null); // Cập nhật lại giao diện khi đăng nhập thất bại
        })
        .finally(() => {
            isLoggingIn = false;
            document.getElementById('login-google').disabled = false;
            
        });
});

// Đăng xuất:
// Khi người dùng bấm nút đăng xuất, thực hiện signOut và cập nhật lại giao diện.
document.getElementById('logout-google').addEventListener('click', () => {
    auth.signOut().then(() => showUserInfo(null));
});

// Hiển thị thông tin người dùng và cập nhật giao diện:
// Nếu đã đăng nhập, hiển thị tên, email, bật input và nút ghi dữ liệu.
// Nếu chưa đăng nhập, ẩn nút đăng xuất, tắt input và nút ghi dữ liệu.
function showUserInfo(user) {
    const infoDiv = document.getElementById('user-info');
    if (user) {
        infoDiv.innerHTML = `Xin chào, ${user.displayName} (${user.email})`;
        document.getElementById('login-google').style.display = 'none';
        document.getElementById('logout-google').style.display = 'inline-block';
    } else {
        infoDiv.innerHTML = 'Bạn chưa đăng nhập!';
        document.getElementById('login-google').style.display = 'inline-block';
        document.getElementById('logout-google').style.display = 'none';
    }
}

// Theo dõi trạng thái đăng nhập:
// Khi trạng thái đăng nhập thay đổi (đăng nhập/đăng xuất), tự động cập nhật giao diện.
auth.onAuthStateChanged(user => showUserInfo(user));

