document.addEventListener('DOMContentLoaded', () => {

    // ===============================================
    // KHAI BÁO BIẾN DỮ LIỆU & ELEMENT QUAN TRỌNG
    // (Bây giờ tất cả các biến DOM đều được tìm lại cục bộ khi cần)
    // ===============================================
    
    // Gán biến DOM CỤC BỘ (Không phải toàn cục)
    let classData = []; 
    let currentGirlId = null; 

    // Hàm tiện ích tìm element cục bộ
    const getElement = (id) => document.getElementById(id);

    // ===============================================
    // 1. TẢI DỮ LIỆU TỪ JSON
    // ===============================================
    async function loadData() {
        // Tìm element DOM ngay khi hàm loadData chạy để đảm bảo chúng tồn tại
        const girlsContainer = getElement('girls-container');
        const rainContainer = getElement('heart-rain-container');
        
        try {
            const response = await fetch('./data/girls_data.json');
            if (!response.ok) {
                throw new Error('Không thể tải file dữ liệu JSON. Vui lòng kiểm tra đường dẫn và cú pháp.');
            }
            classData = await response.json();
            renderGirlsCards(classData); 
            
            if (rainContainer) {
                // Chỉ chạy nếu element rainContainer được tìm thấy
                setInterval(createHeartRain, 150); 
            }
            
        } catch (error) {
            console.error('LỖI [loadData]:', error);
            if (girlsContainer) {
                girlsContainer.innerHTML = '<p style="color: red; padding: 50px;">LỖI TẢI DỮ LIỆU. Vui lòng kiểm tra Console (F12) để xem chi tiết.</p>';
            }
        }
        
        // Gán sự kiện cho các nút điều khiển (chỉ cần chạy một lần)
        setupEventHandlers();
    }
    
    // Hàm mới để tập trung logic gán sự kiện cho Modal
    function setupEventHandlers() {
        const searchInput = getElement('search-input');
        const keypad = getElement('keypad');
        const closeButtons = document.querySelectorAll('.close-btn, .close-btn-video');
        
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                const searchText = e.target.value.toLowerCase().trim();
                const filteredData = classData.filter(girl => 
                    girl.name.toLowerCase().includes(searchText)
                );
                renderGirlsCards(filteredData);
            });
        }
        
        // Gán sự kiện cho bàn phím số
        if (keypad) { 
            keypad.addEventListener('click', handleKeypadClick);
        }

        // Gán sự kiện Đóng Modal
        if (closeButtons.length > 0) {
            closeButtons.forEach(btn => {
                btn.addEventListener('click', handleCloseButtonClick);
            });
        }
        
        // Gán sự kiện đóng Modal khi click ra ngoài (window)
        window.addEventListener('click', handleWindowClick);
    }
    

    // ===============================================
    // 2. HIỂN THỊ CÁC CARD THÔNG TIN
    // ===============================================
    function renderGirlsCards(data) {
        const girlsContainer = getElement('girls-container');
        if (!girlsContainer) return;

        girlsContainer.innerHTML = ''; 
        if (data.length === 0) {
            girlsContainer.innerHTML = '<p>Không tìm thấy bạn nữ nào phù hợp.</p>';
            return;
        }

        data.forEach(girl => {
            const card = document.createElement('div');
            card.className = 'girl-card';
            card.setAttribute('data-id', girl.id);
            
            card.innerHTML = `
                <img src="${girl.avatarUrl}" alt="Avatar của ${girl.name}" class="avatar">
                <h2>${girl.name}</h2>
                <p>Sinh nhật: ${girl.dob}</p>
                <button class="surprise-btn">Xem Điều Bất Ngờ ✨</button>
            `;

            const surpriseBtn = card.querySelector('.surprise-btn');
            surpriseBtn.addEventListener('click', () => showSafeModal(girl.id));

            girlsContainer.appendChild(card);
        });
    }

    // ===============================================
    // 4. LOGIC KÉT SẮT (MODAL) VÀ VIDEO
    // ===============================================

    // a. Hiện Modal Két Sắt
    function showSafeModal(girlId) {
        currentGirlId = girlId; 
        const display = getElement('passcode-display');
        const errorMsg = getElement('error-message');
        const safeModal = getElement('safe-modal');
        
        if (display) display.value = ''; 
        if (errorMsg) errorMsg.textContent = ''; 
        if (safeModal) safeModal.style.display = 'flex'; // Thay đổi từ 'block' thành 'flex'
    }

    // b. Xử lý click bàn phím số (Bao gồm Nút Mở)
 function handleKeypadClick(e) {
    const target = e.target.closest('.keypad-btn');
    if (!target) return; 

    const key = target.getAttribute('data-key');
    const currentPasscodeDisplay = getElement('passcode-display');
    const errorMsg = getElement('error-message'); // Lấy element thông báo lỗi
    
    if (!currentPasscodeDisplay) return; 

    let currentCode = currentPasscodeDisplay.value || '';
    if (errorMsg) errorMsg.textContent = ''; // Xóa lỗi chỉ khi errorMsg tồn tại

    if (key === 'C') {
        currentPasscodeDisplay.value = currentCode.slice(0, -1);
        
    } else if (key && key.length === 1 && currentCode.length < 4) {
        currentPasscodeDisplay.value += key;
        if (currentPasscodeDisplay.value.length === 4) {
            verifyPasscode(currentPasscodeDisplay.value, errorMsg);
        }
    }
}

    // Hàm mới để kiểm tra mật mã
    function verifyPasscode(enteredPasscode, errorMsg) {
        // KIỂM TRA AN TOÀN TUYỆT ĐỐI
        const currentPasscodeDisplay = getElement('passcode-display'); // Lấy lại nếu cần
        if (!currentPasscodeDisplay) {
            console.error('LỖI (Unlock): Element bàn phím bị mất khi xác thực.');
            return;
        }

        const trimmedPasscode = (enteredPasscode || '').trim(); 

        // console.log('Đang kiểm tra mật mã. Mật mã nhập:', trimmedPasscode); 
        
        // Kiểm tra độ dài
        if (trimmedPasscode.length !== 4) { 
            if (errorMsg) errorMsg.textContent = '❌ Mật mã phải có 4 chữ số.';
            return; 
        }

        const girl = classData.find(g => g.id === currentGirlId);

        if (girl && trimmedPasscode === girl.passcode) {
            if (errorMsg) errorMsg.textContent = '🎉 Mật mã chính xác! Đang mở quà...';
            
            setTimeout(() => {
                const safeModal = getElement('safe-modal');
                if (safeModal) safeModal.style.display = 'none';
                showVideoModal(girl);
            }, 300);
            
        } else {
            if (errorMsg) errorMsg.textContent = '❌ Mật mã không đúng. Vui lòng thử lại.';
        }
    }


    // c. Hiển thị Modal Video - ĐÃ SỬA CHỮA HOÀN TOÀN TÌM LẠI BIẾN CỤC BỘ
    function showVideoModal(girl) { 
        // TÌM TẤT CẢ CÁC ELEMENT CỤC BỘ NGAY TẠI ĐÂY
        const videoPlaceholder = getElement('video-placeholder');
        const greetingAreaLocal = getElement('greeting-area'); 
        const videoModal = getElement('video-modal');

        // Kiểm tra an toàn
        if (!greetingAreaLocal || !videoPlaceholder || !videoModal) {
             console.error('LỖI (Video): Không tìm thấy element Modal Video (greetingArea, videoPlaceholder, hoặc videoModal). Vui lòng kiểm tra index.html.');
             return;
        }

        const greetingHTML = `
            <h2 class="greeting-name">Quà dành tặng ${girl.name} ❤️</h2>
            <p class="greeting-text">"${girl.greeting}"</p>
        `;

        greetingAreaLocal.innerHTML = greetingHTML; 

        const iframe = document.createElement('iframe');
        iframe.src = girl.videoLink + '?autoplay=1&rel=0'; 
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        
        videoPlaceholder.innerHTML = ''; 
        videoPlaceholder.appendChild(iframe);
        
        videoModal.style.display = 'block';
    }

    // d. Xử lý đóng Modal
    function handleCloseButtonClick() {
        const safeModal = getElement('safe-modal');
        const videoModal = getElement('video-modal');
        
        if (safeModal) safeModal.style.display = 'none';
        
        if (videoModal && videoModal.style.display === 'block') {
            const videoPlaceholder = getElement('video-placeholder');
            if (videoPlaceholder) videoPlaceholder.innerHTML = '';
            videoModal.style.display = 'none';
        }
    }

    // e. Đóng modal khi click ra ngoài (window)
    function handleWindowClick(event) {
        const safeModal = getElement('safe-modal');
        const videoModal = getElement('video-modal');
        
        if (event.target === safeModal) {
            if (safeModal) safeModal.style.display = 'none';
        }
        if (event.target === videoModal) {
            const videoPlaceholder = getElement('video-placeholder');
            if (videoPlaceholder) videoPlaceholder.innerHTML = ''; 
            if (videoModal) videoModal.style.display = 'none';
        }
    }

    // ===============================================
    // 5. HIỆU ỨNG TIM (MƯA TIM VÀ TIM CLICK)
    // ===============================================

    // a. Tạo Mưa Tim Rơi (Heart Rain)
    function createHeartRain() {
        const rainContainer = getElement('heart-rain-container');
        // Logic tạo tim (giữ nguyên)
        const heart = document.createElement('div');
        heart.className = 'heart';
        
        heart.style.left = Math.random() * 100 + 'vw';
        
        const size = Math.random() * 10 + 10; 
        heart.style.width = size + 'px';
        heart.style.height = size + 'px';
        
        const duration = Math.random() * 5 + 5; 
        heart.style.animationDuration = duration + 's';
        
        if (rainContainer) {
            rainContainer.appendChild(heart);
        }

        setTimeout(() => {
            if (heart.parentNode) heart.remove();
        }, duration * 1000);
    }


    // b. Hiệu Ứng Tim Bay Khi Click
    document.addEventListener('click', (e) => {
        if (e.target.closest('.modal')) return; 

        const clickHeart = document.createElement('div');
        clickHeart.className = 'heart click-heart';
        clickHeart.style.left = e.clientX + 'px';
        clickHeart.style.top = e.clientY + 'px';
        
        document.body.appendChild(clickHeart);

        setTimeout(() => {
            clickHeart.remove();
        }, 1000); 
    });


    // ===============================================
    // KHỞI CHẠY TRANG WEB
    // ===============================================
    loadData();

}); // KẾT THÚC DOMContentLoaded