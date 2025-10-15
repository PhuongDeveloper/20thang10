document.addEventListener('DOMContentLoaded', () => {

    // ===============================================
    // KHAI BÁO BIẾN DỮ LIỆU & ELEMENT QUAN TRỌNG
    // ===============================================
    
    let classData = []; 
    let currentGirlId = null; 
    
    // Biến quản lý video
    let currentVideoList = [];
    let currentVideoIndex = 0;

    // Hàm tiện ích tìm element cục bộ
    const getElement = (id) => document.getElementById(id);

    // ===============================================
    // 1. TẢI DỮ LIỆU TỪ JSON
    // ===============================================
    async function loadData() {
        const girlsContainer = getElement('girls-container');
        try {
            const response = await fetch('./data/girls_data.json');
            if (!response.ok) {
                throw new Error('Không thể tải file dữ liệu JSON.');
            }
            classData = await response.json();
            renderGirlsCards(classData); 
            setInterval(createHeartRain, 150); 
        } catch (error) {
            console.error('LỖI [loadData]:', error);
            if (girlsContainer) {
                girlsContainer.innerHTML = '<p style="color: red; padding: 50px;">LỖI TẢI DỮ LIỆU.</p>';
            }
        }
        setupEventHandlers();
    }
    
    // Gán các sự kiện
    function setupEventHandlers() {
        const searchInput = getElement('search-input');
        const keypad = getElement('keypad');
        const closeButtons = document.querySelectorAll('.close-btn, .close-btn-video');
        const prevVideoBtn = getElement('prev-video-btn');
        const nextVideoBtn = getElement('next-video-btn');

        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                const searchText = e.target.value.toLowerCase().trim();
                const filteredData = classData.filter(girl => 
                    girl.name.toLowerCase().includes(searchText)
                );
                renderGirlsCards(filteredData);
            });
        }
        
        if (keypad) keypad.addEventListener('click', handleKeypadClick);

        closeButtons.forEach(btn => btn.addEventListener('click', handleCloseButtonClick));
        
        window.addEventListener('click', handleWindowClick);

        // Sự kiện cho nút chuyển video
        if (prevVideoBtn) prevVideoBtn.addEventListener('click', showPreviousVideo);
        if (nextVideoBtn) nextVideoBtn.addEventListener('click', showNextVideo);
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

    function showSafeModal(girlId) {
        currentGirlId = girlId; 
        const display = getElement('passcode-display');
        const errorMsg = getElement('error-message');
        const safeModal = getElement('safe-modal');
        
        if (display) display.value = ''; 
        if (errorMsg) errorMsg.textContent = ''; 
        if (safeModal) safeModal.style.display = 'flex';
    }

    function handleKeypadClick(e) {
        const target = e.target.closest('.keypad-btn');
        if (!target) return; 

        const key = target.getAttribute('data-key');
        const display = getElement('passcode-display');
        const errorMsg = getElement('error-message');
        
        if (!display) return; 
        if (errorMsg) errorMsg.textContent = '';

        if (key === 'C') {
            display.value = display.value.slice(0, -1);
        } else if (key && key.length === 1 && display.value.length < 4) {
            display.value += key;
            if (display.value.length === 4) {
                verifyPasscode(display.value);
            }
        }
    }

    function verifyPasscode(enteredPasscode) {
        const errorMsg = getElement('error-message');
        const girl = classData.find(g => g.id === currentGirlId);

        if (girl && enteredPasscode === girl.passcode) {
            if (errorMsg) errorMsg.textContent = '🎉 Mật mã chính xác! Đang mở quà...';
            setTimeout(() => {
                getElement('safe-modal').style.display = 'none';
                showVideoModal(girl);
            }, 300);
        } else {
            if (errorMsg) errorMsg.textContent = '❌ Mật mã không đúng. Vui lòng thử lại.';
        }
    }

    // --- HÀM HIỂN THỊ VIDEO ĐÃ CẢI TIẾN ---
    function showVideoModal(girl) { 
        const greetingArea = getElement('greeting-area'); 
        const videoModal = getElement('video-modal');

        if (!greetingArea || !videoModal) {
             console.error('LỖI: Không tìm thấy element Modal Video.');
             return;
        }

        // Hiển thị lời chúc
        greetingArea.innerHTML = `
            <h2 class="greeting-name">Quà dành tặng ${girl.name} ❤️</h2>
            <p class="greeting-text">"${girl.greeting}"</p>
        `;

        // Lấy danh sách video từ data
        currentVideoList = Object.keys(girl)
                               .filter(key => key.startsWith('videoLink'))
                               .sort() // Sắp xếp để đảm bảo thứ tự (videoLink, videoLink1, videoLink2...)
                               .map(key => girl[key]);
        
        // Reset chỉ số video về 0
        currentVideoIndex = 0;

        // Bắt đầu hiển thị video
        displayCurrentVideo();
        
        // Hiển thị modal
        videoModal.style.display = 'block';
    }

    function displayCurrentVideo() {
        const videoPlaceholder = getElement('video-placeholder');
        const videoNavigation = getElement('video-navigation');
        const prevBtn = getElement('prev-video-btn');
        const nextBtn = getElement('next-video-btn');
        const counter = getElement('video-counter');

        // Hiển thị iframe
        videoPlaceholder.innerHTML = ''; // Xóa video cũ
        if (currentVideoList.length > 0) {
            const iframe = document.createElement('iframe');
            // Thêm ?autoplay=1 để video tự chạy khi chuyển
            iframe.src = currentVideoList[currentVideoIndex] + '?autoplay=1&rel=0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            videoPlaceholder.appendChild(iframe);
        }

        // Cập nhật giao diện nút và bộ đếm
        if (currentVideoList.length > 1) {
            videoNavigation.style.display = 'flex';
            counter.textContent = `${currentVideoIndex + 1} / ${currentVideoList.length}`;
            prevBtn.disabled = (currentVideoIndex === 0);
            nextBtn.disabled = (currentVideoIndex === currentVideoList.length - 1);
        } else {
            videoNavigation.style.display = 'none';
        }
    }
    
    function showNextVideo() {
        if (currentVideoIndex < currentVideoList.length - 1) {
            currentVideoIndex++;
            displayCurrentVideo();
        }
    }

    function showPreviousVideo() {
        if (currentVideoIndex > 0) {
            currentVideoIndex--;
            displayCurrentVideo();
        }
    }

    // --- Cập nhật hàm đóng modal ---
    function stopVideoAndClose() {
        const videoModal = getElement('video-modal');
        if (videoModal && videoModal.style.display === 'block') {
            const videoPlaceholder = getElement('video-placeholder');
            if (videoPlaceholder) videoPlaceholder.innerHTML = ''; // Dừng video bằng cách xóa iframe
            videoModal.style.display = 'none';
            // Reset danh sách video
            currentVideoList = [];
            currentVideoIndex = 0;
        }
    }

    function handleCloseButtonClick() {
        getElement('safe-modal').style.display = 'none';
        stopVideoAndClose();
    }

    function handleWindowClick(event) {
        if (event.target === getElement('safe-modal')) {
            getElement('safe-modal').style.display = 'none';
        }
        if (event.target === getElement('video-modal')) {
            stopVideoAndClose();
        }
    }

    // ===============================================
    // 5. HIỆU ỨNG TIM
    // ===============================================
    function createHeartRain() {
        const rainContainer = getElement('heart-rain-container');
        if (!rainContainer) return;

        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.style.left = Math.random() * 100 + 'vw';
        const size = Math.random() * 10 + 10; 
        heart.style.width = size + 'px';
        heart.style.height = size + 'px';
        const duration = Math.random() * 5 + 5; 
        heart.style.animationDuration = duration + 's';
        rainContainer.appendChild(heart);
        setTimeout(() => heart.remove(), duration * 1000);
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('.modal')) return; 

        const clickHeart = document.createElement('div');
        clickHeart.className = 'heart click-heart';
        clickHeart.style.left = e.clientX + 'px';
        clickHeart.style.top = e.clientY + 'px';
        document.body.appendChild(clickHeart);
        setTimeout(() => clickHeart.remove(), 1000); 
    });

    // ===============================================
    // KHỞI CHẠY TRANG WEB
    // ===============================================
    loadData();

}); // KẾT THÚC DOMContentLoaded
