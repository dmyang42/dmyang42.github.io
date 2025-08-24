// Debug version of Auto Masonry Gallery
(function() {
    'use strict';

    console.log('Debug Gallery: Script loaded');

    function debugGallery() {
        console.log('Debug Gallery: Starting...');
        
        // Create gallery container
        const postSection = document.querySelector('.post');
        if (!postSection) {
            console.error('Debug Gallery: No .post section found');
            return;
        }

        const galleryContainer = document.createElement('div');
        galleryContainer.className = 'debug-gallery';
        galleryContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 15px;
            margin: 2rem 0;
            grid-auto-rows: min-content;
            align-items: start;
        `;
        
        postSection.appendChild(galleryContainer);

        // List of images to load
        const images = [
            'nice_1.jpg',
            'nice_2.jpg',
            'nice_3.jpg',
            'nice_4.jpg',
            'nice_5.jpg',
            'nice_7.jpg',
            'nice_8.jpg',
            'nice_9.jpg',
            'nice_10.jpg',
            'nice_11.jpg',
            'nice_12.jpg',
            'nice_13.jpg',
            '5091672487683_.pic_hd.jpg'
        ];

        console.log(`Debug Gallery: Attempting to load ${images.length} images`);

        images.forEach((filename, index) => {
            const imagePath = `images/nice/${filename}`;
            console.log(`Debug Gallery: Creating item ${index + 1} - ${imagePath}`);

            // Create gallery item
            const item = document.createElement('div');
            item.style.cssText = `
                background: #1e1f23;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: transform 0.3s ease;
                color: white;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 150px;
            `;

            item.innerHTML = `<div>Loading ${filename}...</div>`;

            // Create image
            const img = document.createElement('img');
            img.style.cssText = `
                width: 100%;
                height: auto;
                display: block;
                object-fit: cover;
            `;

            img.onload = function() {
                console.log(`Debug Gallery: Successfully loaded ${imagePath}`);
                
                // Calculate the natural aspect ratio
                const aspectRatio = img.naturalHeight / img.naturalWidth;
                const containerWidth = item.offsetWidth || 280; // fallback width
                const naturalHeight = containerWidth * aspectRatio;
                
                // Clear loading content
                item.innerHTML = '';
                
                // Set item height to match image aspect ratio
                item.style.minHeight = 'auto';
                item.style.height = `${naturalHeight}px`;
                item.style.display = 'block';
                
                // Reset image styles for perfect fit
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    display: block;
                    object-fit: cover;
                    object-position: center;
                `;
                
                item.appendChild(img);
                
                console.log(`Debug Gallery: Set ${filename} to ${containerWidth}x${naturalHeight}px (aspect: ${aspectRatio.toFixed(3)})`);
            };

            img.onerror = function(error) {
                console.error(`Debug Gallery: Failed to load ${imagePath}`, error);
                item.innerHTML = `<div style="text-align: center; color: #ff6b35;">
                    <div>❌ Failed to load</div>
                    <div style="font-size: 0.8em; margin-top: 5px;">${filename}</div>
                </div>`;
                item.style.background = '#2a1f1f';
            };

            // Add click handler for lightbox
            item.addEventListener('click', () => {
                if (img.src && img.complete) {
                    openLightbox(img.src, `Nice Photo ${index + 1}`);
                }
            });

            // Set image source
            img.src = imagePath;
            galleryContainer.appendChild(item);
        });
    }

    // Simple lightbox
    function openLightbox(imageSrc, title) {
        console.log(`Debug Gallery: Opening lightbox for ${imageSrc}`);
        
        const lightbox = document.createElement('div');
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;

        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.cssText = `
            max-width: 95%;
            max-height: 95%;
            object-fit: contain;
            border-radius: 8px;
        `;

        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            background: rgba(0, 0, 0, 0.5);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        lightbox.appendChild(img);
        lightbox.appendChild(closeBtn);
        document.body.appendChild(lightbox);

        // Close handlers
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target === closeBtn) {
                document.body.removeChild(lightbox);
            }
        });

        // Keyboard handler
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(lightbox);
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', debugGallery);
    } else {
        debugGallery();
    }

})();