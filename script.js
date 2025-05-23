async function scrapeMetadata(url) {
    try {
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(`${corsProxy}${encodeURIComponent(url)}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch URL. Please use manual mode instead.');
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const title = 
            doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
            doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
            doc.querySelector('title')?.textContent ||
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
            '';

        return { 
            title: title.trim(), 
            description: description.trim(), 
            image: image.trim() 
        };
    } catch (error) {
        throw new Error('Failed to fetch metadata. Please use manual mode instead.');
    }
}

// Check if we're on the redirect page
if (window.location.pathname.includes('u.html')) {
    // Redirect page logic
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    const title = params.get('title');
    const description = params.get('description');
    const image = params.get('image');

    // Set meta tags
    document.getElementById('metaTitle').content = title;
    document.getElementById('metaDescription').content = description;
    document.getElementById('metaImage').content = image;
    document.title = title;

    // Set preview content
    document.getElementById('previewTitle').textContent = title;
    document.getElementById('previewDescription').textContent = description;

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
        window.location.href = url;
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

    let isAutoMode = true;

    autoMode.addEventListener('click', () => {
        isAutoMode = true;
        autoMode.classList.add('active');
        manualMode.classList.remove('active');
        manualFields.classList.add('hidden');
        titleInput.required = false;
        descriptionInput.required = false;
        imageInput.required = false;
    });

    manualMode.addEventListener('click', () => {
        isAutoMode = false;
        manualMode.classList.add('active');
        autoMode.classList.remove('active');
        manualFields.classList.remove('hidden');
        titleInput.required = true;
        descriptionInput.required = true;
        imageInput.required = true;
    });

    urlInput.addEventListener('paste', async (e) => {
        if (isAutoMode) {
            try {
                const url = e.clipboardData.getData('text');
                const metadata = await scrapeMetadata(url);
                titleInput.value = metadata.title;
                descriptionInput.value = metadata.description;
                imageInput.value = metadata.image;
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let title, description, image;

        if (isAutoMode) {
            try {
                const metadata = await scrapeMetadata(urlInput.value);
                title = metadata.title;
                description = metadata.description;
                image = metadata.image;
            } catch (error) {
                alert(error.message);
                return;
            }
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
    });

    copyButton.addEventListener('click', () => {
        generatedUrl.select();
        document.execCommand('copy');
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = 'Copy URL';
        }, 2000);
    });
}