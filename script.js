// Toast notification function
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✅' : '❌';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
}

async function scrapeMetadata(url) {
    try {
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(`${corsProxy}${encodeURIComponent(url)}`, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 15000
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch the webpage (Status: ${response.status}). Please try manual mode.`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const title = 
            doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
            doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
            doc.querySelector('title')?.textContent?.trim() ||
            url.split('/').pop() ||
            'No title available';

        const description = 
            doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
            doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
            doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
            '';

        const image = 
            doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
            doc.querySelector('meta[property="twitter:image"]')?.getAttribute('content') ||
            doc.querySelector('meta[property="twitter:image:src"]')?.getAttribute('content') ||
            doc.querySelector('link[rel="image_src"]')?.getAttribute('href') ||
            '';

        return { 
            title: title.trim(), 
            description: description.trim(), 
            image: image.trim() 
        };
    } catch (error) {
        console.error('Metadata fetch error:', error);
        throw new Error('Unable to fetch webpage metadata automatically. Please switch to manual mode and enter the details yourself.');
    }
}

if (window.location.pathname.includes('u.html')) {
    // Redirect page logic
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    const title = params.get('title');
    const description = params.get('description');
    const image = params.get('image');

    document.getElementById('metaTitle').content = title;
    document.getElementById('metaDescription').content = description;
    document.getElementById('metaImage').content = image;
    document.title = title;

    document.getElementById('previewTitle').textContent = decodeURIComponent(title);
    document.getElementById('previewDescription').textContent = decodeURIComponent(description);
    const previewImage = document.getElementById('previewImage');
    if (image) {
        previewImage.src = decodeURIComponent(image);
        previewImage.style.display = 'block';
        previewImage.onerror = () => {
            previewImage.style.display = 'none';
        };
    } else {
        previewImage.style.display = 'none';
    }

    let timeLeft = 20;
    const progressBar = document.getElementById('progressBar');
    const timer = document.getElementById('timer');
    const continueBtn = document.getElementById('continueBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const countdown = document.getElementById('countdown');

    const countdownInterval = setInterval(() => {
        timeLeft--;
        timer.textContent = timeLeft;
        progressBar.style.width = ((20 - timeLeft) / 20 * 100) + '%';

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            countdown.textContent = 'Ready to proceed!';
            continueBtn.classList.remove('hidden');
            cancelBtn.classList.remove('hidden');
        }
    }, 1000);

    continueBtn.addEventListener('click', () => {
        window.location.href = decodeURIComponent(url);
    });

    cancelBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
} else {
    // Form page logic
    const form = document.getElementById('redirectForm');
    const result = document.getElementById('result');
    const generatedUrl = document.getElementById('generatedUrl');
    const copyButton = document.getElementById('copyButton');
    const autoMode = document.getElementById('autoMode');
    const manualMode = document.getElementById('manualMode');
    const manualFields = document.getElementById('manualFields');
    const urlInput = document.getElementById('url');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const imageInput = document.getElementById('image');
    const submitButton = form.querySelector('.submit-button');
    const buttonText = submitButton.querySelector('.button-text');
    const buttonLoader = submitButton.querySelector('.button-loader');

    let isAutoMode = true;

    autoMode.addEventListener('click', () => {
        isAutoMode = true;
        autoMode.classList.add('active');
        manualMode.classList.remove('active');
        manualFields.classList.add('hidden');
        titleInput.required = false;
        descriptionInput.required = false;
        imageInput.required = false;
        showToast('Switched to Auto Mode');
    });

    manualMode.addEventListener('click', () => {
        isAutoMode = false;
        manualMode.classList.add('active');
        autoMode.classList.remove('active');
        manualFields.classList.remove('hidden');
        titleInput.required = true;
        descriptionInput.required = true;
        imageInput.required = true;
        showToast('Switched to Manual Mode');
    });

    urlInput.addEventListener('paste', async (e) => {
        if (isAutoMode) {
            try {
                const url = e.clipboardData.getData('text');
                const metadata = await scrapeMetadata(url);
                titleInput.value = metadata.title;
                descriptionInput.value = metadata.description;
                imageInput.value = metadata.image;
                showToast('Metadata fetched successfully');
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
                manualMode.click();
                showToast(error.message, 'error');
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        buttonText.classList.add('hidden');
        buttonLoader.classList.remove('hidden');
        submitButton.disabled = true;
        
        let title, description, image;

        try {
            if (isAutoMode) {
                const metadata = await scrapeMetadata(urlInput.value);
                title = metadata.title;
                description = metadata.description;
                image = metadata.image;
                showToast('Metadata fetched successfully');
            } else {
                title = titleInput.value;
                description = descriptionInput.value;
                image = imageInput.value;
            }

            const url = encodeURIComponent(urlInput.value);
            title = encodeURIComponent(title);
            description = encodeURIComponent(description);
            image = encodeURIComponent(image);

            const redirectUrl = `${window.location.origin}/u.html?url=${url}&title=${title}&description=${description}&image=${image}`;
            
            generatedUrl.value = redirectUrl;
            result.classList.remove('hidden');
            showToast('Redirect URL generated successfully');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            // Hide loading state
            buttonText.classList.remove('hidden');
            buttonLoader.classList.add('hidden');
            submitButton.disabled = false;
        }
    });

    copyButton.addEventListener('click', () => {
        generatedUrl.select();
        document.execCommand('copy');
        showToast('URL copied to clipboard');
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = 'Copy URL';
        }, 2000);
    });
}