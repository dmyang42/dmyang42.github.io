// Automatic Masonry Photo Gallery with Smart Image Discovery
(function() {
    'use strict';

    class AutoMasonryGallery {
        constructor(options = {}) {
            this.options = {
                imageFolder: 'images/nice/', // Default folder
                imageExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
                thumbnailWidth: 350, // Base width for thumbnails
                quality: 0.8,
                gap: 15,
                ...options
            };
            
            this.images = [];
            this.thumbnailCache = new Map();
            this.currentIndex = 0;
            this.masonry = null;
            
            this.init();
        }

        async init() {
            await this.discoverImages();
            this.createGalleryContainer();
            this.createLightbox();
            this.setupLazyLoading();
            this.setupKeyboardNav();
            this.renderGallery();
        }

        // Automatically discover images in the folder
        async discoverImages() {
            console.log('Starting image discovery...');
            
            // Try to discover from manifest first
            try {
                const images = await this.fetchImageManifest();
                this.images = images;
                console.log(`Using ${images.length} images from manifest`);
                return;
            } catch (error) {
                console.log('Manifest discovery failed, trying HTML extraction...');
            }

            // Then try to get images from existing HTML structure
            const existingImages = this.extractExistingImages();
            
            if (existingImages.length > 0) {
                this.images = existingImages;
                console.log(`Using ${existingImages.length} images from HTML`);
                return;
            }

            // Fallback to hardcoded list
            console.log('Using fallback image list');
            this.images = this.getFallbackImageList();
        }

        extractExistingImages() {
            const images = [];
            const imgElements = document.querySelectorAll('.row img, .column img');
            
            imgElements.forEach((img, index) => {
                if (img.src && !images.find(i => i.src === img.src)) {
                    images.push({
                        src: img.src,
                        alt: img.alt || `Photo ${index + 1}`,
                        title: `Photo ${index + 1}`
                    });
                }
            });
            
            return images;
        }

        // Fetch image manifest for automatic discovery
        async fetchImageManifest() {
            try {
                const response = await fetch(`${this.options.imageFolder}manifest.json`);
                if (response.ok) {
                    const manifest = await response.json();
                    console.log(`Auto-discovered ${manifest.total_images} images from manifest`);
                    return manifest.images.map((filename, index) => ({
                        src: `${this.options.imageFolder}${filename}`,
                        alt: `${manifest.folder} Photo ${index + 1}`,
                        title: `${manifest.folder} Photo ${index + 1}`
                    }));
                }
            } catch (error) {
                console.log('No manifest found, using fallback image list');
            }
            throw new Error('No manifest found');
        }

        // Complete list of all images in the Nice folder
        getFallbackImageList() {
            const allImages = [
                '5091672487683_.pic_hd.jpg',
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
                'nice_13.jpg'
            ];
            
            return allImages.map((filename, index) => ({
                src: `${this.options.imageFolder}${filename}`,
                alt: `Nice Photo ${index + 1}`,
                title: `Nice Photo ${index + 1}`
            }));
        }

        createGalleryContainer() {
            // Remove old layout
            const oldStructure = document.querySelector('.row');
            if (oldStructure) {
                oldStructure.style.display = 'none';
            }

            // Create new container
            let container = document.querySelector('.auto-masonry-gallery');
            if (!container) {
                container = document.createElement('div');
                container.className = 'auto-masonry-gallery';
                
                const main = document.getElementById('main');
                const postSection = main.querySelector('.post');
                const header = postSection.querySelector('header');
                
                if (header && header.nextSibling) {
                    postSection.insertBefore(container, header.nextSibling);
                } else {
                    postSection.appendChild(container);
                }
            }

            this.container = container;
        }

        renderGallery() {
            this.container.innerHTML = '';
            
            this.images.forEach((imageData, index) => {
                const item = this.createGalleryItem(imageData, index);
                this.container.appendChild(item);
                imageData.element = item;
                imageData.index = index;
            });

            // Initialize masonry layout after a short delay
            setTimeout(() => {
                this.initializeMasonry();
            }, 100);
        }

        createGalleryItem(imageData, index) {
            const item = document.createElement('div');
            item.className = 'masonry-item loading';
            item.innerHTML = `
                <div class="masonry-placeholder">
                    <div class="loading-spinner"></div>
                    <span>Optimizing image...</span>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.openLightbox(index);
            });
            
            return item;
        }

        initializeMasonry() {
            // Simple CSS Grid masonry implementation
            this.updateMasonryLayout();
            
            // Update layout on window resize
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.updateMasonryLayout();
                }, 200);
            });
        }

        updateMasonryLayout() {
            const container = this.container;
            const items = Array.from(container.children);
            
            // Calculate optimal column count based on container width
            const containerWidth = container.clientWidth;
            const itemWidth = this.options.thumbnailWidth + this.options.gap;
            const columnCount = Math.max(1, Math.floor(containerWidth / itemWidth));
            
            // Apply CSS Grid with auto-fit columns
            container.style.display = 'grid';
            container.style.gridTemplateColumns = `repeat(${columnCount}, 1fr)`;
            container.style.gap = `${this.options.gap}px`;
            container.style.gridAutoRows = 'masonry'; // Future CSS feature
            
            // Fallback for browsers without masonry support
            if (!CSS.supports('grid-auto-rows', 'masonry')) {
                this.fallbackMasonryLayout(items, columnCount);
            }
        }

        fallbackMasonryLayout(items, columnCount) {
            // Manual masonry layout calculation
            const columns = Array(columnCount).fill(0);
            
            items.forEach(item => {
                if (item.querySelector('img')) {
                    // Find shortest column
                    const shortestColumnIndex = columns.indexOf(Math.min(...columns));
                    const column = shortestColumnIndex;
                    
                    item.style.gridColumn = `${column + 1}`;
                    item.style.gridRow = 'auto';
                    
                    // Update column height (approximate)
                    const img = item.querySelector('img');
                    if (img && img.naturalHeight) {
                        const aspectRatio = img.naturalHeight / img.naturalWidth;
                        const estimatedHeight = this.options.thumbnailWidth * aspectRatio;
                        columns[shortestColumnIndex] += estimatedHeight + this.options.gap;
                    }
                }
            });
        }

        setupLazyLoading() {
            const options = {
                root: null,
                rootMargin: '100px',
                threshold: 0.1
            };

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, options);

            // Start observing all items
            setTimeout(() => {
                this.images.forEach(img => {
                    if (img.element) {
                        this.observer.observe(img.element);
                    }
                });
            }, 200);
        }

        async loadImage(galleryElement) {
            const imageData = this.images.find(img => img.element === galleryElement);
            if (!imageData) {
                console.error('No image data found for element');
                return;
            }

            console.log(`Loading image: ${imageData.src}`);

            try {
                // First, try to load the original image directly
                const img = document.createElement('img');
                img.className = 'masonry-image fade-in';
                img.alt = imageData.alt;
                
                img.onload = () => {
                    console.log(`Image loaded successfully: ${imageData.src}`);
                    galleryElement.innerHTML = '';
                    
                    // Calculate optimal display dimensions
                    const maxWidth = Math.min(this.options.thumbnailWidth, img.naturalWidth);
                    const aspectRatio = img.naturalHeight / img.naturalWidth;
                    const displayHeight = maxWidth * aspectRatio;
                    
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.display = 'block';
                    img.style.maxWidth = `${maxWidth}px`;
                    
                    galleryElement.appendChild(img);
                    galleryElement.classList.remove('loading');
                    
                    // Update masonry layout after image loads
                    setTimeout(() => this.updateMasonryLayout(), 50);
                };
                
                img.onerror = (error) => {
                    console.error(`Failed to load image: ${imageData.src}`, error);
                    galleryElement.innerHTML = `
                        <div class="masonry-placeholder error">
                            <span>Failed to load image<br><small>${imageData.src}</small></span>
                        </div>
                    `;
                    galleryElement.classList.remove('loading');
                };
                
                // Set src after setting up event handlers
                img.src = imageData.src;

            } catch (error) {
                console.error('Error in loadImage:', error);
                galleryElement.innerHTML = `
                    <div class="masonry-placeholder error">
                        <span>Error loading image</span>
                    </div>
                `;
                galleryElement.classList.remove('loading');
            }
        }

        loadImagePromise(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        }

        createThumbnail(originalImg, targetWidth, targetHeight, quality) {
            return new Promise((resolve, reject) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                
                // Enable image smoothing for better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Draw image
                ctx.drawImage(originalImg, 0, 0, targetWidth, targetHeight);
                
                // Convert to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(URL.createObjectURL(blob));
                    } else {
                        reject(new Error('Failed to create thumbnail'));
                    }
                }, 'image/jpeg', quality);
            });
        }

        // Lightbox functionality (simplified)
        createLightbox() {
            const modal = document.createElement('div');
            modal.className = 'lightbox-modal';
            modal.innerHTML = `
                <div class="lightbox-close">&times;</div>
                <div class="lightbox-prev">&#8249;</div>
                <div class="lightbox-next">&#8250;</div>
                <div class="lightbox-content">
                    <div class="lightbox-loading">
                        <div class="loading-spinner"></div>
                        Loading full resolution...
                    </div>
                </div>
                <div class="lightbox-info"></div>
            `;
            
            document.body.appendChild(modal);
            
            // Event listeners
            modal.querySelector('.lightbox-close').addEventListener('click', () => this.closeLightbox());
            modal.querySelector('.lightbox-prev').addEventListener('click', () => this.previousImage());
            modal.querySelector('.lightbox-next').addEventListener('click', () => this.nextImage());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeLightbox();
            });
        }

        openLightbox(index) {
            this.currentIndex = index;
            const modal = document.querySelector('.lightbox-modal');
            const content = modal.querySelector('.lightbox-content');
            const info = modal.querySelector('.lightbox-info');
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Load full resolution
            const imageData = this.images[index];
            const img = new Image();
            
            img.onload = () => {
                content.innerHTML = '';
                img.className = 'lightbox-image';
                img.alt = imageData.alt;
                content.appendChild(img);
                
                info.textContent = `${imageData.title} (${index + 1}/${this.images.length})`;
            };
            
            img.src = imageData.src;
        }

        closeLightbox() {
            const modal = document.querySelector('.lightbox-modal');
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        previousImage() {
            this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
            this.openLightbox(this.currentIndex);
        }

        nextImage() {
            this.currentIndex = (this.currentIndex + 1) % this.images.length;
            this.openLightbox(this.currentIndex);
        }

        setupKeyboardNav() {
            document.addEventListener('keydown', (e) => {
                const modal = document.querySelector('.lightbox-modal');
                if (!modal || !modal.classList.contains('active')) return;
                
                switch(e.key) {
                    case 'Escape': this.closeLightbox(); break;
                    case 'ArrowLeft': this.previousImage(); break;
                    case 'ArrowRight': this.nextImage(); break;
                }
            });
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        new AutoMasonryGallery();
    });

})();