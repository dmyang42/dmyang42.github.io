// Client-side thumbnail generation for better performance
(function() {
    'use strict';

    // Create thumbnails using Canvas API
    function createThumbnail(imageUrl, maxWidth = 400, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions maintaining aspect ratio
                let { width, height } = img;
                if (width > height) {
                    if (width > maxWidth) {
                        height = height * (maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width = width * (maxWidth / height);
                        height = maxWidth;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob
                canvas.toBlob((blob) => {
                    const thumbnailUrl = URL.createObjectURL(blob);
                    resolve(thumbnailUrl);
                }, 'image/jpeg', quality);
            };
            
            img.onerror = reject;
            img.src = imageUrl;
        });
    }

    // Enhanced gallery class
    class EnhancedGallery {
        constructor() {
            this.images = [];
            this.thumbnailCache = new Map();
            this.currentIndex = 0;
            this.init();
        }

        async init() {
            this.createLightbox();
            this.setupLazyLoading();
            await this.convertExistingGallery();
            this.setupKeyboardNav();
        }

        async convertExistingGallery() {
            const rowElement = document.querySelector('.row');
            if (!rowElement) return;

            // Create new gallery container
            const galleryContainer = this.createGalleryContainer();
            const galleryGrid = galleryContainer.querySelector('.gallery-grid');

            // Extract images from old structure
            const existingImages = Array.from(rowElement.querySelectorAll('img'));
            
            for (const [index, img] of existingImages.entries()) {
                const galleryItem = this.createGalleryItem(img.src, `Photo ${index + 1}`);
                galleryGrid.appendChild(galleryItem);
                
                this.images.push({
                    original: img.src,
                    thumbnail: null,
                    title: `Photo ${index + 1}`,
                    element: galleryItem,
                    index: index
                });
            }

            // Hide old structure
            rowElement.style.display = 'none';
        }

        createGalleryContainer() {
            let container = document.querySelector('.gallery-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'gallery-container';
                container.innerHTML = '<div class="gallery-grid"></div>';
                
                const main = document.getElementById('main');
                const postSection = main.querySelector('.post');
                if (postSection) {
                    // Insert after the header
                    const header = postSection.querySelector('header');
                    if (header && header.nextSibling) {
                        postSection.insertBefore(container, header.nextSibling);
                    } else {
                        postSection.appendChild(container);
                    }
                }
            }
            return container;
        }

        createGalleryItem(imageSrc, title) {
            const item = document.createElement('div');
            item.className = 'gallery-item loading';
            item.innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-spinner"></div>
                    Optimizing...
                </div>
            `;
            
            item.addEventListener('click', () => {
                const imageData = this.images.find(img => img.element === item);
                if (imageData) {
                    this.openLightbox(imageData.index);
                }
            });
            
            return item;
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
                        this.loadThumbnail(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, options);

            // Observe all gallery items
            setTimeout(() => {
                this.images.forEach(img => {
                    this.observer.observe(img.element);
                });
            }, 100);
        }

        async loadThumbnail(galleryElement) {
            const imageData = this.images.find(img => img.element === galleryElement);
            if (!imageData) return;

            try {
                // Check cache first
                let thumbnailUrl = this.thumbnailCache.get(imageData.original);
                
                if (!thumbnailUrl) {
                    // Generate thumbnail
                    thumbnailUrl = await createThumbnail(imageData.original, 400, 0.8);
                    this.thumbnailCache.set(imageData.original, thumbnailUrl);
                }

                // Create and load thumbnail image
                const img = new Image();
                img.onload = () => {
                    galleryElement.innerHTML = '';
                    img.className = 'fade-in';
                    img.alt = imageData.title;
                    galleryElement.appendChild(img);
                    galleryElement.classList.remove('loading');
                };

                img.src = thumbnailUrl;
                imageData.thumbnail = thumbnailUrl;

            } catch (error) {
                console.warn('Failed to create thumbnail, loading original:', error);
                // Fallback to original image
                this.loadOriginalImage(galleryElement, imageData);
            }
        }

        loadOriginalImage(galleryElement, imageData) {
            const img = new Image();
            img.onload = () => {
                galleryElement.innerHTML = '';
                img.className = 'fade-in';
                img.alt = imageData.title;
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                galleryElement.appendChild(img);
                galleryElement.classList.remove('loading');
            };
            img.onerror = () => {
                galleryElement.innerHTML = `
                    <div class="loading-placeholder" style="color: #ff6b35;">
                        Failed to load image
                    </div>
                `;
                galleryElement.classList.remove('loading');
            };
            img.src = imageData.original;
        }

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
            if (index < 0 || index >= this.images.length) return;
            
            this.currentIndex = index;
            const modal = document.querySelector('.lightbox-modal');
            const content = modal.querySelector('.lightbox-content');
            const info = modal.querySelector('.lightbox-info');
            
            // Show loading
            content.innerHTML = `
                <div class="lightbox-loading">
                    <div class="loading-spinner"></div>
                    Loading full resolution...
                </div>
            `;
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Load full resolution
            const imageData = this.images[this.currentIndex];
            const img = new Image();
            
            img.onload = () => {
                content.innerHTML = '';
                img.className = 'lightbox-image';
                img.alt = imageData.title;
                content.appendChild(img);
                
                info.textContent = `${imageData.title} (${this.currentIndex + 1}/${this.images.length})`;
            };
            
            img.onerror = () => {
                content.innerHTML = `
                    <div class="lightbox-loading" style="color: #ff6b35;">
                        Failed to load full resolution
                    </div>
                `;
            };
            
            img.src = imageData.original;
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
                    case 'Escape':
                        this.closeLightbox();
                        break;
                    case 'ArrowLeft':
                        this.previousImage();
                        break;
                    case 'ArrowRight':
                        this.nextImage();
                        break;
                }
            });
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        new EnhancedGallery();
    });

})();