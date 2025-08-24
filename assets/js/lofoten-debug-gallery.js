// Debug version specifically for Lofoten
(function() {
    'use strict';

    console.log('Lofoten Debug Gallery: Script loaded');

    function debugLofotenGallery() {
        console.log('Lofoten Debug Gallery: Starting...');
        
        // Create gallery container
        const postSection = document.querySelector('.post');
        if (!postSection) {
            console.error('Lofoten Debug Gallery: No .post section found');
            return;
        }

        const galleryContainer = document.createElement('div');
        galleryContainer.className = 'lofoten-debug-gallery';
        galleryContainer.style.cssText = `
            column-count: auto;
            column-width: 300px;
            column-gap: 20px;
            margin: 2rem 0;
            padding: 0;
        `;
        
        postSection.appendChild(galleryContainer);

        // List of Lofoten images
        const images = [
            "055496A1-6661-4151-9516-060225BDB435_1_105_c.jpeg",
            "11BC4AA1-6D3B-4375-80F9-B79EA2676FCC_1_105_c.jpeg",
            "139417CF-A2EB-4681-9E05-5910A3624B56_1_105_c.jpeg",
            "1A4459E2-C66E-43F2-B086-456895AEE72A_1_105_c.jpeg",
            "2B0F28D0-4BC0-4942-9E3E-14EC9FF9B8D8_1_105_c.jpeg",
            "2C1C14D5-C8F0-4766-B620-6E15FA65AB56_1_105_c.jpeg",
            "3483ADD3-DE3F-480C-9E00-1CFE559D73AD_1_105_c.jpeg",
            "38329C76-74C6-4F22-8963-DBC664AB6EB1_1_105_c.jpeg",
            "3BB0A28E-65C9-4789-B570-93E5949D6D02_1_105_c.jpeg",
            "433E061B-90DF-4EE2-A105-BD9C5D12EDDC_1_105_c.jpeg",
            "44605123-5A01-4B28-8B58-BE51763BD1E3_1_105_c.jpeg",
            "4A479765-9738-4555-902F-99ECBEFADC8E_1_105_c.jpeg",
            "53AA6024-4955-4030-83C9-4181F98DE844_1_105_c.jpeg",
            "7B7074E2-3416-475B-9042-2294DD27298B_1_105_c.jpeg",
            "86FB7CB6-E4B6-4156-9367-BF7FD73C78D4_1_105_c.jpeg",
            "8B10E7DB-57BB-4AB3-A33D-099E26ADED64_1_105_c.jpeg",
            "9ED16111-EA4C-4E8D-9844-5D13C76854B3_1_105_c.jpeg",
            "A9F683A7-342C-424E-85D9-614804CC7EDF_1_105_c.jpeg",
            "BF1F4EEB-9A32-4E24-A619-C4B76D8BF9EF_1_105_c.jpeg",
            "C5372E40-61AE-4CDF-8CF4-5F56257B8721_1_105_c.jpeg",
            "E45E6C71-85A5-4B27-8AD7-359510786249_1_105_c.jpeg",
            "E4C2F4B1-BF9E-4883-A930-D1F4122A3109_1_105_c.jpeg",
            "ECB3C7C3-8A9D-4C4D-BD50-7F458406366B_1_105_c.jpeg"
        ];

        console.log(`Lofoten Debug Gallery: Attempting to load ${images.length} images`);

        images.forEach((filename, index) => {
            const imagePath = `images/lofoten/${filename}`;
            console.log(`Lofoten Debug Gallery: Creating item ${index + 1} - ${imagePath}`);

            // Create gallery item
            const item = document.createElement('div');
            item.style.cssText = `
                display: inline-block;
                width: 100%;
                margin-bottom: 20px;
                background: #1e1f23;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: transform 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                break-inside: avoid;
                page-break-inside: avoid;
                color: white;
                position: relative;
                min-height: 150px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            item.innerHTML = `<div style="text-align: center; padding: 20px;">
                <div style="margin-bottom: 10px;">🏔️</div>
                <div>Loading ${filename.substring(0, 20)}...</div>
            </div>`;

            // Create image
            const img = document.createElement('img');
            img.style.cssText = `
                width: 100%;
                height: auto;
                display: block;
                object-fit: contain;
            `;

            img.onload = function() {
                console.log(`Lofoten Debug Gallery: Successfully loaded ${imagePath} (${img.naturalWidth}x${img.naturalHeight})`);
                item.innerHTML = '';
                item.style.minHeight = 'auto';
                item.style.display = 'block';
                item.appendChild(img);
                
                // Add hover effect
                item.addEventListener('mouseenter', () => {
                    item.style.transform = 'translateY(-5px) scale(1.02)';
                    item.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.transform = 'translateY(0) scale(1)';
                    item.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                });

                // Add fade-in
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    item.style.transition = 'all 0.6s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 50);
            };

            img.onerror = function(error) {
                console.error(`Lofoten Debug Gallery: Failed to load ${imagePath}`, error);
                item.innerHTML = `<div style="text-align: center; color: #ff6b35; padding: 20px;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">❌</div>
                    <div>Failed to load</div>
                    <div style="font-size: 0.8em; margin-top: 5px; opacity: 0.7;">${filename}</div>
                    <div style="font-size: 0.7em; margin-top: 5px; opacity: 0.5;">Path: ${imagePath}</div>
                </div>`;
                item.style.background = '#2a1f1f';
            };

            // Add click handler for lightbox
            item.addEventListener('click', () => {
                if (img.src && img.complete) {
                    openSimpleLightbox(img.src, `Lofoten Photo ${index + 1}`);
                }
            });

            // Set image source
            img.src = imagePath;
            galleryContainer.appendChild(item);
        });
    }

    // Simple lightbox
    function openSimpleLightbox(imageSrc, title) {
        console.log(`Lofoten Debug Gallery: Opening lightbox for ${title}`);
        
        const lightbox = document.createElement('div');
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
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

        const info = document.createElement('div');
        info.innerHTML = title;
        info.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            background: rgba(0, 0, 0, 0.7);
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 1rem;
        `;

        lightbox.appendChild(img);
        lightbox.appendChild(closeBtn);
        lightbox.appendChild(info);
        document.body.appendChild(lightbox);

        // Close handlers
        const closeLightbox = () => {
            document.body.removeChild(lightbox);
        };

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target === closeBtn) {
                closeLightbox();
            }
        });

        // Keyboard handler
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', debugLofotenGallery);
    } else {
        debugLofotenGallery();
    }

})();