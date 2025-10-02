# Visitor Map Server-Side Setup Guide

This guide will help you configure the proper server-side visitor tracking system for your website.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create a JSONBin Account
1. Go to [JSONBin.io](https://jsonbin.io/)
2. Sign up for a free account (allows 10k API calls/month)
3. Create a new bin:
   - Click "Create Bin"
   - Name it "visitor-map-data"
   - Set content to: `{"visitors": []}`
   - Set privacy to "Private"
4. Note your **Bin ID** (e.g., `64f8c2b812a5d37659c8f9e4`)
5. Go to "API Keys" section and create a new Master Key

### Step 2: Configure the API
1. Open `/assets/js/visitor-api.js`
2. Replace the configuration variables:
   ```javascript
   const API_CONFIG = {
       baseUrl: 'https://api.jsonbin.io/v3/b',
       binId: 'YOUR_ACTUAL_BIN_ID_HERE', // Replace this
       apiKey: 'YOUR_ACTUAL_API_KEY_HERE', // Replace this
       localStorageKey: 'visitor_map_backup'
   };
   ```

### Step 3: Test the System
1. Save your changes and commit to GitHub
2. Visit your website from different browsers/devices
3. Check browser console for successful API calls
4. Visit your JSONBin dashboard to see stored data

## 🔧 Alternative Setup Options

### Option A: Supabase (More Advanced)
For a more robust solution with PostgreSQL:

1. Create a [Supabase](https://supabase.com/) project
2. Create a table:
   ```sql
   CREATE TABLE visitors (
     id SERIAL PRIMARY KEY,
     ip VARCHAR(45),
     city VARCHAR(100),
     country VARCHAR(100),
     lat FLOAT,
     lng FLOAT,
     timestamp TIMESTAMP DEFAULT NOW(),
     user_agent TEXT,
     session_id VARCHAR(50)
   );
   ```
3. Enable Row Level Security and create policies
4. Update the API code to use Supabase client

### Option B: Firebase Firestore
1. Create a Firebase project
2. Enable Firestore Database
3. Set up security rules
4. Update the API to use Firebase SDK

### Option C: Your Own Server
If you have your own server, create a simple REST API:
```javascript
// Express.js example
app.post('/api/visitors', async (req, res) => {
  // Add visitor to database
});

app.get('/api/visitors', async (req, res) => {
  // Get all visitors from database
});
```

## 🛠️ Current System Benefits

### ✅ Advantages
- **Cross-browser consistency**: Same data across all browsers/devices
- **Offline support**: Works when internet is unavailable
- **Automatic sync**: Syncs offline data when back online
- **Duplicate prevention**: Server-side duplicate checking
- **Data persistence**: 6 months of visitor history
- **City grouping**: Shows visit counts per city
- **Real-time updates**: Immediate map updates

### 🔄 How It Works
1. **Page Load**: Fetches all visitors from server API
2. **New Visitor**: Gets IP geolocation → Adds to server → Updates map
3. **Duplicate Check**: Server prevents same IP within 30 minutes
4. **Offline Mode**: Stores locally → Syncs when online
5. **Data Cleaning**: Removes visitors older than 6 months

## 🐛 Troubleshooting

### Common Issues

**1. "Visitor API failed to load"**
- Check if visitor-api.js is loading before visitor-map.js
- Verify API credentials are correct

**2. "HTTP error! status: 401"**
- Invalid API key - check your JSONBin dashboard
- Make sure the API key has read/write permissions

**3. "Visitor data temporarily unavailable"**
- Network issue or API service down
- System falls back to localStorage automatically

**4. Different results across browsers**
- This was the old problem - should now be fixed
- All browsers now use the same server data

### Debug Steps
1. Open browser console (F12)
2. Look for visitor map logs:
   ```
   ✅ "Visitor API service loaded"
   ✅ "Loading visitor data from API..."
   ✅ "Loaded X visitors from API"
   ```
3. Check Network tab for API calls
4. Verify JSONBin dashboard shows data

## 📊 Monitoring

### Check Your Data
- Visit your JSONBin dashboard
- View the "visitor-map-data" bin
- See all visitor records with timestamps

### Analytics
The system now tracks:
- **IP addresses** (for duplicate prevention)
- **City/Country** (for map display)
- **Coordinates** (for map positioning)
- **Timestamps** (for data cleaning)
- **Session IDs** (for visitor uniqueness)
- **User agents** (partial, for debugging)

## 🔒 Privacy Notes

- IP addresses are only used for duplicate detection
- No personal information is stored
- Data is automatically cleaned after 6 months
- Complies with basic privacy guidelines

## 🚀 Performance

### API Limits
- **JSONBin Free**: 10,000 API calls/month
- **Estimated Usage**: ~50-100 calls/day for typical site
- **Upgrade**: $4.99/month for unlimited calls

### Loading Speed
- **Initial load**: ~200-500ms (API call)
- **Adding visitor**: ~100-300ms (single API call)
- **Offline fallback**: Instant (localStorage)

---

## ✨ You're All Set!

After completing Step 1 & 2, your visitor map will:
- ✅ Show consistent data across all browsers
- ✅ Track visitors from different countries
- ✅ Display city-based visit counts
- ✅ Work offline with automatic sync
- ✅ Clean old data automatically

The days of inconsistent visitor tracking are over! 🎉