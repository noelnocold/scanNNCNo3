// Lấy các phần tử DOM
const progressBar = document.querySelector('#progress-bar div');
const fileList = document.getElementById('file-list');
const backBtn = document.getElementById('back-btn');

// Gửi tin nhắn đến Service Worker để bắt đầu kiểm tra cập nhật
window.addEventListener('DOMContentLoaded', () => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        console.log('[Client] Sending CHECK_FOR_UPDATE message to Service Worker...');
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATE' });
    } else {
        console.error('[Client] Service Worker controller not found.');
    }
});

// Lắng nghe thông điệp từ Service Worker
navigator.serviceWorker.addEventListener('message', event => {
    const message = event.data;

    if (message.type === 'UPDATE_PROGRESS') {
        console.log(`[Client] Progress: ${message.progress}% for file: ${message.file}`);
        progressBar.style.width = `${message.progress}%`;

        const li = document.createElement('li');
        li.textContent = `Downloading: ${message.file}`;
        fileList.appendChild(li);
    } else if (message.type === 'UPDATE_COMPLETE') {
        console.log('[Client] Update complete! Showing back button.');
        backBtn.style.display = 'block';
    } else if (message.type === 'NO_UPDATE') {
        console.log('[Client] No update available.');
        const li = document.createElement('li');
        li.textContent = 'No updates available.';
        fileList.appendChild(li);

        // Hiển thị nút quay lại
        backBtn.style.display = 'block';
    }
});

// Quay lại giao diện chính
backBtn.addEventListener('click', () => {
    window.location.href = './homepage.html';
});