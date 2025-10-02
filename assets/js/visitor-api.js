// Visitor API Service for Server-Side Visitor Tracking
(function() {
    'use strict';

    // Configuration for the visitor tracking API
    const API_CONFIG = {
        // Using JSONBin.io as a free JSON storage service
        // You'll need to create an account at jsonbin.io and get your API key
        baseUrl: 'https://api.jsonbin.io/v3/b',
        binId: 'YOUR_BIN_ID_HERE', // Replace with your actual bin ID
        apiKey: 'YOUR_API_KEY_HERE', // Replace with your actual API key
        
        // Alternative: Using a simple HTTP POST service
        // fallbackUrl: 'https://httpbin.org/post', // For testing only
        
        // Backup localStorage for offline capability
        localStorageKey: 'visitor_map_backup'
    };

    // Visitor API class
    class VisitorAPI {
        constructor() {
            this.isOnline = navigator.onLine;
            this.setupOfflineDetection();
        }

        // Setup online/offline detection
        setupOfflineDetection() {
            window.addEventListener('online', () => {
                this.isOnline = true;
                console.log('Back online - syncing visitor data');
                this.syncOfflineData();
            });

            window.addEventListener('offline', () => {
                this.isOnline = false;
                console.log('Gone offline - using local storage');
            });
        }

        // Get all visitors from server
        async getAllVisitors() {
            try {
                console.log('Fetching all visitors from server...');
                
                const response = await fetch(`${API_CONFIG.baseUrl}/${API_CONFIG.binId}/latest`, {
                    method: 'GET',
                    headers: {
                        'X-Master-Key': API_CONFIG.apiKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const visitors = data.record?.visitors || [];
                
                console.log(`Successfully loaded ${visitors.length} visitors from server`);
                
                // Cache in localStorage as backup
                this.cacheVisitors(visitors);
                
                return visitors;

            } catch (error) {
                console.warn('Failed to fetch visitors from server:', error);
                return this.getBackupVisitors();
            }
        }

        // Add a new visitor to server
        async addVisitor(visitorData) {
            try {
                // Get current visitors
                const existingVisitors = await this.getAllVisitors();
                
                // Check for duplicates (same IP within 30 minutes)
                const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
                const isDuplicate = existingVisitors.some(v => 
                    v.ip === visitorData.ip && 
                    new Date(v.timestamp) > thirtyMinutesAgo
                );

                if (isDuplicate) {
                    console.log('Duplicate visitor detected, not adding');
                    return { success: false, reason: 'duplicate', visitors: existingVisitors };
                }

                // Add new visitor
                const updatedVisitors = [...existingVisitors, visitorData];
                
                // Clean old data (6 months)
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
                const cleanedVisitors = updatedVisitors.filter(v => 
                    new Date(v.timestamp) > sixMonthsAgo
                );

                console.log(`Adding visitor: ${visitorData.city}, ${visitorData.country}`);
                console.log(`Total visitors after cleanup: ${cleanedVisitors.length}`);

                // Save to server
                const response = await fetch(`${API_CONFIG.baseUrl}/${API_CONFIG.binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': API_CONFIG.apiKey
                    },
                    body: JSON.stringify({ visitors: cleanedVisitors })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Cache updated data
                this.cacheVisitors(cleanedVisitors);
                
                return { success: true, visitors: cleanedVisitors };

            } catch (error) {
                console.warn('Failed to add visitor to server:', error);
                
                // Fallback to localStorage
                return this.addVisitorOffline(visitorData);
            }
        }

        // Offline fallback methods
        addVisitorOffline(visitorData) {
            try {
                const visitors = this.getBackupVisitors();
                
                // Check for duplicates
                const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
                const isDuplicate = visitors.some(v => 
                    v.ip === visitorData.ip && 
                    new Date(v.timestamp) > thirtyMinutesAgo
                );

                if (!isDuplicate) {
                    visitors.push(visitorData);
                    this.cacheVisitors(visitors);
                    
                    // Mark for sync when online
                    this.markForSync(visitorData);
                }
                
                return { success: true, visitors, offline: true };

            } catch (error) {
                console.error('Failed to add visitor offline:', error);
                return { success: false, error };
            }
        }

        // Cache visitors in localStorage
        cacheVisitors(visitors) {
            try {
                localStorage.setItem(API_CONFIG.localStorageKey, JSON.stringify(visitors));
                localStorage.setItem(API_CONFIG.localStorageKey + '_timestamp', Date.now().toString());
            } catch (error) {
                console.warn('Failed to cache visitors:', error);
            }
        }

        // Get backup visitors from localStorage
        getBackupVisitors() {
            try {
                const cached = localStorage.getItem(API_CONFIG.localStorageKey);
                if (cached) {
                    const visitors = JSON.parse(cached);
                    console.log(`Using cached visitors: ${visitors.length} entries`);
                    return visitors;
                }
            } catch (error) {
                console.warn('Failed to get backup visitors:', error);
            }
            return [];
        }

        // Mark visitor for sync when back online
        markForSync(visitorData) {
            try {
                const pendingSync = JSON.parse(localStorage.getItem('visitors_pending_sync') || '[]');
                pendingSync.push(visitorData);
                localStorage.setItem('visitors_pending_sync', JSON.stringify(pendingSync));
            } catch (error) {
                console.warn('Failed to mark for sync:', error);
            }
        }

        // Sync offline data when back online
        async syncOfflineData() {
            try {
                const pending = JSON.parse(localStorage.getItem('visitors_pending_sync') || '[]');
                if (pending.length === 0) return;

                console.log(`Syncing ${pending.length} offline visitors...`);
                
                for (const visitor of pending) {
                    await this.addVisitor(visitor);
                    // Small delay to avoid overwhelming the API
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // Clear pending sync
                localStorage.removeItem('visitors_pending_sync');
                console.log('Offline sync completed');

            } catch (error) {
                console.warn('Failed to sync offline data:', error);
            }
        }

        // Health check for the API service
        async healthCheck() {
            try {
                const response = await fetch(`${API_CONFIG.baseUrl}/${API_CONFIG.binId}/latest`, {
                    method: 'HEAD',
                    headers: {
                        'X-Master-Key': API_CONFIG.apiKey
                    }
                });
                return response.ok;
            } catch (error) {
                return false;
            }
        }

        // Initialize the bin if it doesn't exist
        async initializeBin() {
            try {
                const response = await fetch(`${API_CONFIG.baseUrl}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': API_CONFIG.apiKey,
                        'X-Bin-Name': 'visitor-map-data'
                    },
                    body: JSON.stringify({ visitors: [] })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Initialized new visitor data bin:', data.metadata.id);
                    return data.metadata.id;
                }
            } catch (error) {
                console.warn('Failed to initialize bin:', error);
            }
            return null;
        }
    }

    // Export the API class globally
    window.VisitorAPI = VisitorAPI;

    // Create a singleton instance
    window.visitorAPI = new VisitorAPI();

    console.log('Visitor API service loaded');

})();