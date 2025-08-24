// Visitor Map Widget
(function() {
    'use strict';

    let visitorMap;
    let visitorsData = [];
    const STORAGE_KEY = 'visitor_map_data';
    
    // Initialize the visitor map
    function initVisitorMap() {
        try {
            // Initialize Leaflet map
            visitorMap = L.map('visitor-map', {
                zoomControl: true,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false,
                dragging: true,
                touchZoom: true,
                maxBounds: [[-85, -Infinity], [85, Infinity]], // Restrict only Y-axis (latitude)
                maxBoundsViscosity: 1.0 // Prevent dragging beyond bounds
            }).setView([30, 0], 2);

            // Add tile layer (OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
                minZoom: 1,
                noWrap: false // Allow world wrapping
            }).addTo(visitorMap);

            // Load existing visitor data
            loadVisitorData();
            
            // Track current visitor
            trackCurrentVisitor();
            
            // Update display
            updateVisitorDisplay();

        } catch (error) {
            console.error('Failed to initialize visitor map:', error);
            document.getElementById('visitor-map').innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Map unavailable</div>';
        }
    }

    // Get visitor location using IP geolocation
    async function trackCurrentVisitor() {
        try {
            // Check if visitor was already tracked in this session
            if (sessionStorage.getItem('visitor_tracked')) {
                return;
            }

            // Use ipapi.co for IP geolocation (free tier: 1000 requests/day)
            const response = await fetch('https://ipapi.co/json/', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Geolocation service unavailable');
            }
            
            const locationData = await response.json();
            
            if (locationData.latitude && locationData.longitude) {
                // Debug: Log the location data to see what's available
                console.log('Location data received:', locationData);
                
                const visitor = {
                    lat: locationData.latitude,
                    lng: locationData.longitude,
                    city: locationData.city || locationData.region_code || 'Unknown City',
                    region: locationData.region || locationData.region_code || '',
                    country: locationData.country_name || locationData.country || 'Unknown',
                    timestamp: new Date().toISOString(),
                    ip: locationData.ip || 'unknown'
                };
                
                console.log('Visitor data created:', visitor);

                // Add to visitors data (avoid duplicates by checking recent IPs)
                const recentVisitor = visitorsData.find(v => 
                    v.ip === visitor.ip && 
                    new Date(visitor.timestamp) - new Date(v.timestamp) < 24 * 60 * 60 * 1000 // 24 hours
                );
                
                if (!recentVisitor) {
                    visitorsData.push(visitor);
                    saveVisitorData();
                    addVisitorToMap(visitor);
                    updateVisitorDisplay();
                }
                
                // Mark as tracked for this session
                sessionStorage.setItem('visitor_tracked', 'true');
            }
        } catch (error) {
            console.warn('Could not track visitor location:', error);
            // Fallback: show map with existing data only
        }
    }

    // Add visitor marker to map
    function addVisitorToMap(visitor) {
        if (!visitorMap) return;

        // Create custom icon
        const visitorIcon = L.divIcon({
            className: 'visitor-marker',
            html: '<div style="background: #ff6b35; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        // Add marker with world wrapping enabled
        const marker = L.marker([visitor.lat, visitor.lng], { 
            icon: visitorIcon
        }).addTo(visitorMap);

        // Create additional markers for world wraps (at +360 and -360 longitude)
        const wrapOffsets = [-360, 360];
        wrapOffsets.forEach(offset => {
            const wrappedLng = visitor.lng + offset;
            const wrappedMarker = L.marker([visitor.lat, wrappedLng], { 
                icon: visitorIcon 
            }).addTo(visitorMap);
            
            // Add same popup to wrapped markers
            addPopupToMarker(wrappedMarker, visitor);
        });

        // Add popup to original marker
        addPopupToMarker(marker, visitor);
    }

    // Helper function to add popup to marker
    function addPopupToMarker(marker, visitor) {
        // Add popup with city name prominently displayed
        console.log('Creating popup for visitor:', visitor);
        
        let locationText = '';
        if (visitor.city && visitor.city !== 'Unknown City' && visitor.region && visitor.region !== visitor.city) {
            locationText = `${visitor.city}, ${visitor.region}`;
        } else if (visitor.city && visitor.city !== 'Unknown City') {
            locationText = visitor.city;
        } else if (visitor.region && visitor.region !== '') {
            locationText = visitor.region;
        } else {
            locationText = visitor.country;
        }
        
        console.log('Location text for popup:', locationText);
            
        marker.bindPopup(`
            <div style="text-align: center; font-size: 0.9em;">
                <strong style="font-size: 1.1em; color: #ff6b35;">${locationText}</strong><br>
                ${visitor.country !== locationText ? `<small style="color: #ccc;">${visitor.country}</small><br>` : ''}
                <small style="color: #888;">${new Date(visitor.timestamp).toLocaleDateString()}</small>
            </div>
        `);
    }

    // Load visitor data from localStorage
    function loadVisitorData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                visitorsData = JSON.parse(stored);
                // Clean old data (older than 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                visitorsData = visitorsData.filter(v => new Date(v.timestamp) > thirtyDaysAgo);
                
                // Add existing visitors to map
                visitorsData.forEach(visitor => addVisitorToMap(visitor));
            }
        } catch (error) {
            console.warn('Could not load visitor data:', error);
            visitorsData = [];
        }
    }

    // Save visitor data to localStorage
    function saveVisitorData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(visitorsData));
        } catch (error) {
            console.warn('Could not save visitor data:', error);
        }
    }

    // Update visitor statistics display
    function updateVisitorDisplay() {
        const totalElement = document.getElementById('total-visitors');
        if (totalElement) {
            const count = visitorsData.length;
            const countries = [...new Set(visitorsData.map(v => v.country))].length;
            totalElement.textContent = `${count} visitors from ${countries} countries`;
        }
    }

    // Initialize when page loads
    document.addEventListener('DOMContentLoaded', function() {
        // Add small delay to ensure DOM is fully ready
        setTimeout(initVisitorMap, 100);
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (visitorMap) {
            setTimeout(() => visitorMap.invalidateSize(), 100);
        }
    });

})();