// Visitor Map Widget
(function() {
    'use strict';

    let visitorMap;
    let visitorsData = [];
    let visitorMarkers = []; // Keep track of all markers for clearing
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

    // Get visitor location using IP geolocation and accumulate all visitors over 6 months
    async function trackCurrentVisitor() {
        try {
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
            console.log('Location data received:', locationData);
            
            if (locationData.latitude && locationData.longitude) {
                const visitor = {
                    lat: locationData.latitude,
                    lng: locationData.longitude,
                    city: locationData.city || locationData.region_code || 'Unknown City',
                    region: locationData.region || locationData.region_code || '',
                    country: locationData.country_name || locationData.country || 'Unknown',
                    timestamp: new Date().toISOString(),
                    ip: locationData.ip || 'unknown',
                    userAgent: navigator.userAgent.substring(0, 50), // Partial UA for uniqueness
                    sessionId: generateSessionId()
                };
                
                console.log('New visitor data:', visitor);

                // Check for recent duplicate (same IP within 30 minutes to avoid spam but allow VPN switches)
                const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
                const isDuplicate = visitorsData.some(v => 
                    v.ip === visitor.ip && 
                    new Date(v.timestamp) > thirtyMinutesAgo
                );
                
                if (!isDuplicate) {
                    visitorsData.push(visitor);
                    console.log(`New visitor added from ${visitor.city}, ${visitor.country} (IP: ${visitor.ip}). Total visitors: ${visitorsData.length}`);
                    saveVisitorData();
                    // Refresh the entire map with aggregated data
                    clearAllMarkers();
                    addAggregatedVisitorsToMap();
                    updateVisitorDisplay();
                } else {
                    console.log('Duplicate visitor within 30 minutes, not adding to avoid spam');
                    // Still update display to show existing visitor
                    updateVisitorDisplay();
                }
            }
        } catch (error) {
            console.warn('Could not track visitor location:', error);
            // Show map with existing data only
        }
    }

    // Generate a simple session ID for visitor tracking
    function generateSessionId() {
        return 'visit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    // Clear all visitor markers from the map
    function clearAllMarkers() {
        visitorMarkers.forEach(marker => {
            if (visitorMap && marker) {
                visitorMap.removeLayer(marker);
            }
        });
        visitorMarkers = [];
    }

    // Group visitors by city and add aggregated markers
    function addAggregatedVisitorsToMap() {
        if (!visitorMap || visitorsData.length === 0) return;

        // Group visitors by city (using city + country as unique key)
        const cityGroups = {};
        visitorsData.forEach(visitor => {
            const cityKey = `${visitor.city}, ${visitor.country}`;
            if (!cityGroups[cityKey]) {
                cityGroups[cityKey] = {
                    lat: visitor.lat,
                    lng: visitor.lng,
                    city: visitor.city,
                    country: visitor.country,
                    count: 0,
                    visitors: []
                };
            }
            cityGroups[cityKey].count++;
            cityGroups[cityKey].visitors.push(visitor);
        });

        // Add aggregated markers for each city
        Object.values(cityGroups).forEach(group => {
            console.log(`Adding aggregated marker for ${group.city}: ${group.count} visits`);
            addCityMarkerToMap(group);
        });
    }

    // Add city marker to map with visit count
    function addCityMarkerToMap(cityGroup) {
        if (!visitorMap) return;

        // Create custom icon with size based on visit count
        const baseSize = Math.min(12 + (cityGroup.count * 2), 24); // Scale marker size, max 24px
        const visitorIcon = L.divIcon({
            className: 'visitor-marker',
            html: `<div style="background: #ff6b35; width: ${baseSize}px; height: ${baseSize}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: ${Math.min(10, baseSize/2)}px; font-weight: bold;">${cityGroup.count > 1 ? cityGroup.count : ''}</div>`,
            iconSize: [baseSize + 4, baseSize + 4],
            iconAnchor: [(baseSize + 4)/2, (baseSize + 4)/2]
        });

        // Add marker with world wrapping enabled
        const marker = L.marker([cityGroup.lat, cityGroup.lng], { 
            icon: visitorIcon
        }).addTo(visitorMap);
        visitorMarkers.push(marker); // Track marker for potential clearing

        // Create additional markers for world wraps (at +360 and -360 longitude)
        const wrapOffsets = [-360, 360];
        wrapOffsets.forEach(offset => {
            const wrappedLng = cityGroup.lng + offset;
            const wrappedMarker = L.marker([cityGroup.lat, wrappedLng], { 
                icon: visitorIcon 
            }).addTo(visitorMap);
            visitorMarkers.push(wrappedMarker); // Track wrapped markers too
            
            // Add same popup to wrapped markers
            addCityPopupToMarker(wrappedMarker, cityGroup);
        });

        // Add popup to original marker
        addCityPopupToMarker(marker, cityGroup);
    }

    // Legacy function for backward compatibility (now unused)
    function addVisitorToMap(visitor) {
        // This function is now handled by addAggregatedVisitorsToMap
        console.log('Legacy addVisitorToMap called, using aggregated system instead');
    }

    // Helper function to add popup to city marker with visit count
    function addCityPopupToMarker(marker, cityGroup) {
        console.log('Creating city popup for:', cityGroup.city, 'with', cityGroup.count, 'visits');
        
        let locationText = '';
        if (cityGroup.city && cityGroup.city !== 'Unknown City') {
            locationText = cityGroup.city;
        } else {
            locationText = cityGroup.country;
        }
        
        const visitText = cityGroup.count === 1 ? '1 visit' : `${cityGroup.count} visits`;
            
        marker.bindPopup(`
            <div style="text-align: center; font-size: 0.9em;">
                <strong style="font-size: 1.1em; color: #ff6b35;">${locationText}</strong><br>
                ${cityGroup.country !== locationText ? `<small style="color: #ccc;">${cityGroup.country}</small><br>` : ''}
                <strong style="color: #666; font-size: 1em;">${visitText}</strong>
            </div>
        `);
    }

    // Legacy popup function (keeping for compatibility)
    function addPopupToMarker(marker, visitor) {
        // This is now handled by addCityPopupToMarker
        console.log('Legacy popup function called');
    }

    // Load visitor data from localStorage
    function loadVisitorData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                visitorsData = JSON.parse(stored);
                console.log('Loaded visitor data from storage:', visitorsData.length, 'visitors');
                
                // Clean old data (older than 6 months)
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
                const beforeCleanup = visitorsData.length;
                visitorsData = visitorsData.filter(v => new Date(v.timestamp) > sixMonthsAgo);
                console.log(`Cleaned old data: ${beforeCleanup} -> ${visitorsData.length} visitors`);
                
                // Clear existing markers before re-adding
                clearAllMarkers();
                
                // Group visitors by city and add aggregated markers
                addAggregatedVisitorsToMap();
                
                // Save cleaned data back to storage
                if (beforeCleanup !== visitorsData.length) {
                    saveVisitorData();
                }
            } else {
                console.log('No stored visitor data found');
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