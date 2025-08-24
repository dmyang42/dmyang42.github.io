# Photo Gallery System Documentation for Claude
*Version 1.0 - Created August 2024*

## 🎨 Design System & Art Style

### Visual Philosophy
- **Clean, minimal, premium aesthetic** inspired by high-end design magazines
- **Light, airy feel** with plenty of white space
- **Scandinavian design influence** - sophisticated and understated
- **No dark themes** - everything uses light backgrounds with dark text
- **No hover overlays** - clean image viewing experience

### Typography Stack
```css
/* Primary Fonts (Google Fonts) */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Poppins:wght@300;400;500;600;700&display=swap');

- Hero Title: 'Playfair Display', serif (elegant, magazine-style)
- Card Titles: 'Playfair Display', serif
- Body Text: 'Inter', sans-serif (modern, readable)
- UI Elements: 'Inter', sans-serif
```

### Typography Hierarchy
- **Hero Title**: 4rem, font-weight: 600, gradient text effect
- **Card Titles**: 1.75rem, font-weight: 600, dark gray (#1A202C)
- **Descriptions**: 0.9rem, font-weight: 400, medium gray (#4A5568)
- **Dates**: 0.85rem, font-weight: 400, light gray (#718096) - **PLAIN TEXT ONLY**
- **Stats**: 0.8rem, font-weight: 500, gray (#718096)
- **Buttons**: 0.85rem, font-weight: 500, uppercase, letter-spacing: 0.8px

## 🌈 Color Palette System

### Base Colors (ColorHunt-inspired Light Palettes)
```css
/* Card Base Colors */
Background: #FEFEFE (pure white)
Border: #F7FAFC (very light gray)
Text Primary: #1A202C (dark charcoal)
Text Secondary: #4A5568 (medium gray)
Text Tertiary: #718096 (light gray)
```

### Location-Specific Color Schemes

#### Arctic/Nordic Locations (like Lofoten)
```css
/* Arctic Blue Palette */
Primary: #95D5B2 → #74C69D (seafoam gradient)
Text: #1A365D (deep navy)
Theme: Cool, Nordic, pristine
```

#### Mediterranean Locations (like Nice)
```css
/* Coral Rose Palette */
Primary: #FFCAD4 → #F4ACB7 (soft pink gradient)
Text: #702459 (deep rose)
Theme: Warm, romantic, coastal
```

#### Countryside Locations (like Netherlands)
```css
/* Warm Peach Palette */
Primary: #FFCF9E → #F4A261 (peach gradient)
Text: #8B4513 (warm brown)
Theme: Cozy, rustic, golden
```

### Additional Palette Options
For new locations, use these ColorHunt-inspired combinations:
- **Tropical**: `#A8E6CF → #88D8C0` (mint green)
- **Desert**: `#FFD3A5 → #FD9853` (sunset orange)  
- **Urban**: `#C7CEEA → #A0C1E8` (soft blue)
- **Mountain**: `#D4ADFC → #C19BF0` (lavender)

## 🏗️ Technical Architecture

### File Structure
```
/assets/css/enhanced-photo-gallery.css     # Main gallery styles
/assets/js/configurable-masonry-gallery.js # Reusable gallery script
/assets/js/true-masonry-gallery.js         # Location-specific gallery
/images/[location]/                        # Image folders
/images/[location]/manifest.json           # Auto-generated image list
/[location].html                           # Individual gallery pages
/photo.html                                # Main landing page
/generate-manifest.py                      # Python script for image discovery
```

### Gallery System Components

#### 1. Landing Page (photo.html)
- **Hero Section**: Title + subtitle
- **Card Grid**: Auto-fit grid (min 400px columns)
- **Article Structure**: image-container + content
- **Location Classes**: `.location-[name]` for theming

#### 2. Individual Gallery Pages
- **Auto Image Discovery**: Uses manifest.json or fallback lists
- **True Masonry Layout**: CSS columns for natural flow
- **Lazy Loading**: Intersection Observer API
- **Lightbox**: Full-screen viewing with navigation

#### 3. Masonry Gallery Features
- **Column Layout**: `column-width: 300px`, `column-gap: 20px`
- **Natural Flow**: Images maintain aspect ratios
- **No Empty Space**: Perfect packing algorithm
- **Responsive**: Adapts column count to screen size

## 📝 Step-by-Step Guide: Adding New Locations

### Step 1: Prepare Images
1. Create folder: `/images/[location-name]/`
2. Add images (JPG/JPEG/PNG recommended)
3. Use descriptive filenames

### Step 2: Generate Manifest
```bash
# Update generate-manifest.py with new location
python3 generate-manifest.py
```

### Step 3: Create Gallery Page
```html
<!-- Template: [location].html -->
<!DOCTYPE HTML>
<html>
<head>
    <title>Daming Yang - [Location Name]</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=0.75, user-scalable=no" />
    <link rel="stylesheet" href="assets/css/main.css" />
    <noscript><link rel="stylesheet" href="assets/css/noscript.css" /></noscript>
    <link rel="shortcut icon" href="images/favicon.ico">
    <link rel="stylesheet" href="assets/css/style.css" />
    <link rel="stylesheet" href="assets/css/auto-masonry-gallery.css" />
</head>
<body class="is-preload">
    <div id="wrapper" class="fade-in">
        <header id="header">
            <a class="logo">Photos</a>
        </header>
        
        <nav id="nav">
            <ul class="links">
                <li><a href="index.html">Home</a></li>
                <li><a href="research.html">Research</a></li>
                <li><a href="personal.html">More About me</a></li>
                <li class="active"><a href="photo.html">Photos</a></li>
            </ul>
            <ul class="icons">
                <li><a href="https://twitter.com/isakataigaa" class="icon brands fa-twitter"><span class="label">Twitter</span></a></li>
                <li><a href="https://github.com/dmyang42" class="icon brands fa-github"><span class="label">GitHub</span></a></li>
            </ul>
        </nav>

        <div id="main">
            <section class="post">
                <header class="major">
                    <h1>[Location Name]</h1>
                    <p>[Poetic description of the location]</p>
                </header>
            </section>
        </div>

        <div id="copyright">
            <ul><li>Design: <a href="https://html5up.net">HTML5 UP</a></li><li>[Location-specific credit]</li></ul>
        </div>
    </div>

    <script src="assets/js/jquery.min.js"></script>
    <script src="assets/js/jquery.scrollex.min.js"></script>
    <script src="assets/js/jquery.scrolly.min.js"></script>
    <script src="assets/js/browser.min.js"></script>
    <script src="assets/js/breakpoints.min.js"></script>
    <script src="assets/js/util.js"></script>
    <script src="assets/js/main.js"></script>
    <script src="assets/js/true-masonry-gallery.js"></script>
</body>
</html>
```

### Step 4: Add to Landing Page
```html
<!-- Add new article to photo.html enhanced-posts section -->
<article class="enhanced-article location-[name]">
    <div class="enhanced-image-container">
        <img src="images/[location-cover].jpg" alt="[Location Name]" />
        <div class="enhanced-overlay"></div>
    </div>
    <div class="enhanced-content">
        <header class="enhanced-header">
            <span class="enhanced-date">[Date Period]</span>
            <h2 class="enhanced-title">
                <a href="[location].html">[Location Name]</a>
            </h2>
        </header>
        <p class="enhanced-description">
            [Engaging description of the location and experience]
        </p>
        <div class="enhanced-stats">
            <div class="stat-item">
                <span class="stat-icon">📸</span>
                <span>[X] Photos</span>
            </div>
            <div class="stat-item">
                <span class="stat-icon">[theme-emoji]</span>
                <span>[Location Type]</span>
            </div>
        </div>
        <a href="[location].html" class="enhanced-cta">Explore Gallery</a>
    </div>
</article>
```

### Step 5: Add Location-Specific Styling
```css
/* Add to enhanced-photo-gallery.css */
.location-[name] .enhanced-cta {
    background: linear-gradient(135deg, [color1], [color2]);
    color: [text-color];
}

.location-[name] .enhanced-cta:hover {
    background: linear-gradient(135deg, [color2], [color1]);
    box-shadow: 0 8px 25px rgba([color1-rgba], 0.3);
}
```

### Step 6: Update Gallery JavaScript
Modify the image list in `true-masonry-gallery.js` or ensure the manifest system works.

## 🎯 Design Guidelines & Best Practices

### Writing Style
- **Poetic descriptions**: Evoke emotion and wanderlust
- **Concise but descriptive**: 2-3 sentences max
- **Avoid clichés**: Find unique angles for each location
- **Consistent tone**: Sophisticated yet accessible

### Image Guidelines
- **High quality**: At least 1920px width recommended  
- **Consistent editing**: Maintain cohesive look across galleries
- **Variety**: Mix of wide shots, details, and unique perspectives
- **Aspect ratios**: Mixed ratios work best with masonry layout

### Color Selection
- **Research the location**: Choose colors that reflect the destination
- **Light palettes only**: No dark or overly saturated colors
- **Test readability**: Ensure text is readable on all backgrounds
- **Maintain hierarchy**: Keep base text colors consistent

### Performance Considerations
- **Image optimization**: Compress images without losing quality
- **Lazy loading**: Ensure intersection observer works properly
- **Responsive design**: Test on mobile devices
- **Loading states**: Always provide visual feedback

## 🔧 Troubleshooting Common Issues

### Images Not Loading
1. Check file paths in manifest.json
2. Verify image file permissions
3. Test with browser dev tools
4. Use debug gallery scripts for diagnostics

### Layout Issues
1. Ensure CSS Grid support in target browsers
2. Check for CSS conflicts with main.css
3. Verify image aspect ratios
4. Test responsive breakpoints

### Typography Problems
1. Confirm Google Fonts are loading
2. Check for font-family fallbacks
3. Verify line-height and spacing
4. Test cross-browser compatibility

## 📋 Maintenance Checklist

### Regular Tasks
- [ ] Optimize new images before upload
- [ ] Update manifest.json when adding images
- [ ] Test responsive design on mobile
- [ ] Verify all links work
- [ ] Check loading performance
- [ ] Update copyright dates
- [ ] Backup image files

### When Adding Locations
- [ ] Choose appropriate color palette
- [ ] Write compelling description
- [ ] Create cover image for landing page
- [ ] Test masonry layout
- [ ] Verify lightbox functionality
- [ ] Update navigation if needed
- [ ] Test cross-browser compatibility

---

## 💡 Quick Reference

### Essential CSS Classes
- `.enhanced-article.location-[name]` - Main card container
- `.enhanced-image-container` - Image wrapper
- `.enhanced-content` - Text content area
- `.enhanced-date` - Plain text date (no styling)
- `.enhanced-title` - Playfair Display title
- `.enhanced-description` - Inter body text
- `.enhanced-cta` - Button with location colors

### Key Files to Modify
1. `photo.html` - Add new location card
2. `[location].html` - Create gallery page  
3. `enhanced-photo-gallery.css` - Add location colors
4. `generate-manifest.py` - Add location to script
5. `/images/[location]/` - Add image folder

### Color Palette Generator
Use https://colorhunt.co/palettes/light for new location inspirations.

---

*This documentation should be referenced at the start of any new photo gallery development session. Keep it updated as the system evolves.*