// Enhanced Photo Gallery with Lazy Loading and Lightbox
(function() {
    'use strict';

    let currentImageIndex = 0;
    let galleryImages = [];
    let observer = null;

    // Initialize gallery
    function initPhotoGallery() {
        // Create lightbox modal
        createLightboxModal();
        
        // Set up intersection observer for lazy loading
        setupLazyLoading();
        
        // Process existing gallery items
        processGalleryItems();
        
        // Add keyboard navigation
        setupKeyboardNavigation();
    }

    // Create thumbnail URL (simulated - you can implement actual thumbnail generation)
    function getThumbnailUrl(originalUrl) {
        // For now, we'll use URL parameters or a naming convention
        // In a real implementation, you'd generate actual thumbnails
        const parts = originalUrl.split('.');
        const extension = parts.pop();
        const baseName = parts.join('.');
        return `${baseName}_thumb.${extension}`;
    }

    // Check if thumbnail exists, fallback to original with reduced quality
    async function getOptimalImageUrl(originalUrl) {
        try {
            const thumbnailUrl = getThumbnailUrl(originalUrl);
            const response = await fetch(thumbnailUrl, { method: 'HEAD' });
            return response.ok ? thumbnailUrl : originalUrl;
        } catch (error) {
            return originalUrl;
        }
    }

    // Create lightbox modal HTML
    function createLightboxModal() {
        const modal = document.createElement('div');
        modal.className = 'lightbox-modal';
        modal.innerHTML = `
            <div class="lightbox-close">&times;</div>
            <div class="lightbox-prev">&#8249;</div>
            <div class="lightbox-next">&#8250;</div>
            <div class="lightbox-content">
                <div class="lightbox-loading">
                    <div class="loading-spinner"></div>
                    Loading...
                </div>
            </div>
            <div class="lightbox-info"></div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
        modal.querySelector('.lightbox-prev').addEventListener('click', previousImage);
        modal.querySelector('.lightbox-next').addEventListener('click', nextImage);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeLightbox();
        });
    }

    // Setup lazy loading with Intersection Observer
    function setupLazyLoading() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, options);
    }

    // Process existing gallery items and convert to new format
    function processGalleryItems() {
        // Convert old column-based layout to new grid
        const oldColumns = document.querySelectorAll('.column');
        const galleryContainer = document.querySelector('.gallery-container') || createGalleryContainer();
        
        if (oldColumns.length > 0) {
            const galleryGrid = galleryContainer.querySelector('.gallery-grid');
            
            oldColumns.forEach(column => {
                const images = column.querySelectorAll('img');
                images.forEach((img, index) => {
                    const galleryItem = createGalleryItem(img.src, `Photo ${galleryImages.length + 1}`);
                    galleryGrid.appendChild(galleryItem);
                    galleryImages.push({
                        thumbnail: img.src,
                        full: img.src,
                        title: `Photo ${galleryImages.length}`,
                        element: galleryItem
                    });
                });
            });
            
            // Hide old layout
            oldColumns.forEach(column => column.style.display = 'none');
        }

        // If no old layout, process any existing gallery items
        const existingItems = document.querySelectorAll('.gallery-item');
        existingItems.forEach((item, index) => {
            const img = item.querySelector('img');
            if (img && !galleryImages.find(gi => gi.full === img.src)) {
                galleryImages.push({
                    thumbnail: img.src,
                    full: img.src,
                    title: `Photo ${galleryImages.length + 1}`,
                    element: item
                });
            }
        });
    }

    // Create gallery container if it doesn't exist
    function createGalleryContainer() {
        let container = document.querySelector('.gallery-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'gallery-container';
            container.innerHTML = '<div class="gallery-grid"></div>';
            
            const main = document.getElementById('main');
            const postSection = main.querySelector('.post') || main;
            postSection.appendChild(container);
        }
        return container;
    }

    // Create gallery item HTML
    function createGalleryItem(imageSrc, title = '') {
        const item = document.createElement('div');
        item.className = 'gallery-item loading';
        item.innerHTML = `
            <div class="loading-placeholder">
                <div class="loading-spinner"></div>
                Loading...
            </div>
        `;
        
        item.addEventListener('click', () => {
            const imageIndex = galleryImages.findIndex(gi => gi.element === item);
            openLightbox(imageIndex);
        });
        
        // Set up lazy loading
        observer.observe(item);
        
        return item;
    }

    // Load image with optimization
    async function loadImage(galleryItem) {
        const imageIndex = galleryImages.findIndex(gi => gi.element === galleryItem);
        if (imageIndex === -1) return;
        
        const imageData = galleryImages[imageIndex];
        const optimizedUrl = await getOptimalImageUrl(imageData.thumbnail);
        
        const img = new Image();
        img.onload = () => {
            galleryItem.innerHTML = '';
            img.className = 'fade-in';
            img.alt = imageData.title;
            galleryItem.appendChild(img);
            galleryItem.classList.remove('loading');
        };
        
        img.onerror = () => {
            galleryItem.innerHTML = `
                <div class="loading-placeholder" style="color: #ff6b35;">
                    Failed to load image
                </div>
            `;
            galleryItem.classList.remove('loading');
        };
        
        img.src = optimizedUrl;
    }

    // Open lightbox
    function openLightbox(imageIndex) {
        if (imageIndex < 0 || imageIndex >= galleryImages.length) return;
        
        currentImageIndex = imageIndex;
        const modal = document.querySelector('.lightbox-modal');
        const content = modal.querySelector('.lightbox-content');
        const info = modal.querySelector('.lightbox-info');
        
        // Show loading state
        content.innerHTML = `
            <div class="lightbox-loading">
                <div class="loading-spinner"></div>
                Loading full resolution...
            </div>
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Load full resolution image
        const imageData = galleryImages[currentImageIndex];
        const img = new Image();
        
        img.onload = () => {
            content.innerHTML = '';
            img.className = 'lightbox-image';
            img.alt = imageData.title;
            content.appendChild(img);
            
            // Update info
            info.textContent = `${imageData.title} (${currentImageIndex + 1}/${galleryImages.length})`;
        };
        
        img.onerror = () => {
            content.innerHTML = `
                <div class="lightbox-loading" style="color: #ff6b35;">
                    Failed to load full resolution image
                </div>
            `;
        };
        
        img.src = imageData.full;
    }

    // Close lightbox
    function closeLightbox() {
        const modal = document.querySelector('.lightbox-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // Navigate to previous image
    function previousImage() {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        openLightbox(currentImageIndex);
    }

    // Navigate to next image
    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        openLightbox(currentImageIndex);
    }

    // Setup keyboard navigation
    function setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            const modal = document.querySelector('.lightbox-modal');
            if (!modal.classList.contains('active')) return;
            
            switch(e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    previousImage();
                    break;
                case 'ArrowRight':
                    nextImage();
                    break;
            }
        });
    }

    // Auto-detect and convert existing gallery on page load
    function autoConvertGallery() {
        // Look for the old row/column structure
        const rowElement = document.querySelector('.row');
        if (rowElement) {
            // Create new gallery structure
            const galleryContainer = createGalleryContainer();
            const galleryGrid = galleryContainer.querySelector('.gallery-grid');
            
            // Extract all images from columns
            const allImages = rowElement.querySelectorAll('img');
            allImages.forEach((img, index) => {
                const galleryItem = createGalleryItem(img.src, `Photo ${index + 1}`);
                galleryGrid.appendChild(galleryItem);
                
                galleryImages.push({
                    thumbnail: img.src,
                    full: img.src,
                    title: `Photo ${index + 1}`,
                    element: galleryItem
                });
            });
            
            // Hide the old structure
            rowElement.style.display = 'none';
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        autoConvertGallery();
        initPhotoGallery();
    });

    // Handle window resize for responsive behavior
    window.addEventListener('resize', () => {
        // Recalculate layout if needed
        const modal = document.querySelector('.lightbox-modal');
        if (modal && modal.classList.contains('active')) {
            // Refresh lightbox layout
            const img = modal.querySelector('.lightbox-image');
            if (img) {
                img.style.maxHeight = '90vh';
                img.style.maxWidth = '95vw';
            }
        }
    });

})();