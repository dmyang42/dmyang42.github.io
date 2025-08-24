// Configurable Masonry Gallery for Multiple Locations
(function() {
    'use strict';

    // Get configuration from window.galleryConfig or use defaults
    const config = window.galleryConfig || {
        imageFolder: 'images/nice/',
        locationName: 'Nice'
    };

    console.log(`Configurable Masonry Gallery: Loading ${config.locationName} gallery from ${config.imageFolder}`);

    async function createMasonryGallery() {
        console.log(`${config.locationName} Gallery: Starting...`);
        
        // Create gallery container
        const postSection = document.querySelector('.post');
        if (!postSection) {
            console.error(`${config.locationName} Gallery: No .post section found`);
            return;
        }

        const galleryContainer = document.createElement('div');
        galleryContainer.className = 'configurable-masonry-gallery';
        
        // Use CSS columns for true masonry effect
        galleryContainer.style.cssText = `
            column-count: auto;
            column-width: 300px;
            column-gap: 20px;
            margin: 2rem 0;
            padding: 0;
        `;
        
        postSection.appendChild(galleryContainer);

        // Try to load from manifest first
        let images = [];
        try {
            const manifestResponse = await fetch(`${config.imageFolder}manifest.json`);
            if (manifestResponse.ok) {
                const manifest = await manifestResponse.json();
                images = manifest.images;
                console.log(`${config.locationName} Gallery: Loaded ${images.length} images from manifest`);
            } else {
                throw new Error('No manifest found');
            }
        } catch (error) {
            console.log(`${config.locationName} Gallery: Could not load manifest, using fallback`);
            // You could add fallback logic here if needed
            return;
        }

        if (images.length === 0) {
            galleryContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                    <h3>No images found</h3>
                    <p>Could not load images from ${config.imageFolder}</p>
                </div>
            `;
            return;
        }

        console.log(`${config.locationName} Gallery: Creating ${images.length} gallery items`);

        images.forEach((filename, index) => {
            const imagePath = `${config.imageFolder}${filename}`;
            console.log(`${config.locationName} Gallery: Creating item ${index + 1} - ${imagePath}`);

            // Create gallery item container
            const item = document.createElement('div');
            item.className = 'masonry-item';
            item.style.cssText = `
                display: inline-block;
                width: 100%;
                margin-bottom: 20px;
                background: #1e1f23;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                break-inside: avoid;
                page-break-inside: avoid;
                position: relative;
            `;

            // Loading placeholder
            const placeholder = document.createElement('div');
            placeholder.style.cssText = `
                padding: 40px 20px;
                text-align: center;
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.9rem;
                min-height: 120px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            `;
            placeholder.innerHTML = `
                <div style="margin-bottom: 10px;">🏔️</div>
                <div>Loading ${config.locationName} photo...</div>
            `;

            item.appendChild(placeholder);

            // Create image
            const img = document.createElement('img');
            
            img.onload = function() {
                console.log(`${config.locationName} Gallery: Successfully loaded ${imagePath} (${img.naturalWidth}x${img.naturalHeight})`);
                
                // Clear placeholder
                item.innerHTML = '';
                
                // Set image styles for perfect fit
                img.style.cssText = `
                    width: 100%;
                    height: auto;
                    display: block;
                    object-fit: contain;
                    background: transparent;
                `;
                
                // Add hover effect container
                const imageWrapper = document.createElement('div');
                imageWrapper.style.cssText = `
                    position: relative;
                    overflow: hidden;
                `;
                
                imageWrapper.appendChild(img);
                item.appendChild(imageWrapper);
                
                // Add hover effects
                item.addEventListener('mouseenter', () => {
                    item.style.transform = 'translateY(-5px) scale(1.02)';
                    item.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
                    img.style.filter = 'brightness(1.1)';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.transform = 'translateY(0) scale(1)';
                    item.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                    img.style.filter = 'brightness(1)';
                });
                
                // Add fade-in animation
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    item.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 50); // Faster stagger for more images
            };

            img.onerror = function(error) {
                console.error(`${config.locationName} Gallery: Failed to load ${imagePath}`, error);
                item.innerHTML = `
                    <div style="
                        padding: 40px 20px;
                        text-align: center;
                        color: #ff6b35;
                        min-height: 120px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div style="font-size: 2rem; margin-bottom: 10px;">❌</div>
                        <div>Failed to load</div>
                        <div style="font-size: 0.8em; margin-top: 5px; opacity: 0.7;">${filename}</div>
                    </div>
                `;
                item.style.background = '#2a1f1f';
            };

            // Add click handler for lightbox
            item.addEventListener('click', () => {
                if (img.src && img.complete && !img.classList.contains('error')) {
                    openLightbox(img.src, `${config.locationName} Photo ${index + 1}`, index, images);
                }
            });

            // Set image source to start loading
            img.src = imagePath;
            galleryContainer.appendChild(item);
        });
    }

    // Enhanced lightbox with navigation
    function openLightbox(imageSrc, title, currentIndex, allImages) {
        console.log(`${config.locationName} Gallery: Opening lightbox for ${title}`);
        
        const lightbox = document.createElement('div');
        lightbox.className = 'masonry-lightbox';
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
            opacity: 0;
            transition: opacity 0.3s ease;
            backdrop-filter: blur(10px);
        `;

        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;

        // Close button
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 30px;
            right: 30px;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            background: rgba(0, 0, 0, 0.6);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        `;

        // Navigation buttons
        const prevBtn = document.createElement('div');
        prevBtn.innerHTML = '‹';
        prevBtn.style.cssText = `
            position: absolute;
            left: 30px;
            top: 50%;
            transform: translateY(-50%);
            color: white;
            font-size: 3rem;
            cursor: pointer;
            background: rgba(0, 0, 0, 0.6);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            ${currentIndex === 0 ? 'opacity: 0.3; pointer-events: none;' : ''}
        `;

        const nextBtn = document.createElement('div');
        nextBtn.innerHTML = '›';
        nextBtn.style.cssText = `
            position: absolute;
            right: 30px;
            top: 50%;
            transform: translateY(-50%);
            color: white;
            font-size: 3rem;
            cursor: pointer;
            background: rgba(0, 0, 0, 0.6);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            ${currentIndex === allImages.length - 1 ? 'opacity: 0.3; pointer-events: none;' : ''}
        `;

        // Info panel
        const infoPanel = document.createElement('div');
        infoPanel.innerHTML = `${title} (${currentIndex + 1}/${allImages.length})`;
        infoPanel.style.cssText = `
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            background: rgba(0, 0, 0, 0.7);
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 1rem;
            backdrop-filter: blur(10px);
        `;

        lightbox.appendChild(img);
        lightbox.appendChild(closeBtn);
        lightbox.appendChild(prevBtn);
        lightbox.appendChild(nextBtn);
        lightbox.appendChild(infoPanel);
        document.body.appendChild(lightbox);

        // Animate in
        requestAnimationFrame(() => {
            lightbox.style.opacity = '1';
            img.style.transform = 'scale(1)';
        });

        // Event handlers
        const closeLightbox = () => {
            lightbox.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(lightbox)) {
                    document.body.removeChild(lightbox);
                }
            }, 300);
        };

        closeBtn.addEventListener('click', closeLightbox);
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        // Navigation
        if (currentIndex > 0) {
            prevBtn.addEventListener('click', () => {
                closeLightbox();
                setTimeout(() => {
                    openLightbox(`${config.imageFolder}${allImages[currentIndex - 1]}`, `${config.locationName} Photo ${currentIndex}`, currentIndex - 1, allImages);
                }, 300);
            });
        }

        if (currentIndex < allImages.length - 1) {
            nextBtn.addEventListener('click', () => {
                closeLightbox();
                setTimeout(() => {
                    openLightbox(`${config.imageFolder}${allImages[currentIndex + 1]}`, `${config.locationName} Photo ${currentIndex + 2}`, currentIndex + 1, allImages);
                }, 300);
            });
        }

        // Keyboard navigation
        const keyHandler = (e) => {
            switch(e.key) {
                case 'Escape':
                    closeLightbox();
                    document.removeEventListener('keydown', keyHandler);
                    break;
                case 'ArrowLeft':
                    if (currentIndex > 0) {
                        closeLightbox();
                        setTimeout(() => {
                            openLightbox(`${config.imageFolder}${allImages[currentIndex - 1]}`, `${config.locationName} Photo ${currentIndex}`, currentIndex - 1, allImages);
                        }, 300);
                        document.removeEventListener('keydown', keyHandler);
                    }
                    break;
                case 'ArrowRight':
                    if (currentIndex < allImages.length - 1) {
                        closeLightbox();
                        setTimeout(() => {
                            openLightbox(`${config.imageFolder}${allImages[currentIndex + 1]}`, `${config.locationName} Photo ${currentIndex + 2}`, currentIndex + 1, allImages);
                        }, 300);
                        document.removeEventListener('keydown', keyHandler);
                    }
                    break;
            }
        };
        document.addEventListener('keydown', keyHandler);

        // Hover effects
        [closeBtn, prevBtn, nextBtn].forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(0, 0, 0, 0.8)';
                btn.style.transform = btn === prevBtn || btn === nextBtn ? 'translateY(-50%) scale(1.1)' : 'scale(1.1)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(0, 0, 0, 0.6)';
                btn.style.transform = btn === prevBtn || btn === nextBtn ? 'translateY(-50%) scale(1)' : 'scale(1)';
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createMasonryGallery);
    } else {
        createMasonryGallery();
    }

    // Add responsive behavior
    window.addEventListener('resize', () => {
        const gallery = document.querySelector('.configurable-masonry-gallery');
        if (gallery) {
            // Adjust column width based on screen size
            const screenWidth = window.innerWidth;
            if (screenWidth < 768) {
                gallery.style.columnWidth = '250px';
                gallery.style.columnGap = '15px';
            } else if (screenWidth < 1024) {
                gallery.style.columnWidth = '280px';
                gallery.style.columnGap = '18px';
            } else {
                gallery.style.columnWidth = '300px';
                gallery.style.columnGap = '20px';
            }
        }
    });

})();