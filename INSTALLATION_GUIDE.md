# 🎭 Gothic Influence Shopify Theme Installation

## What You're Getting

A complete dark, elegant theme for your Shopify store with:

✅ **Dark Gothic Color Palette**
- Deep blacks (#0d0d0d, #1a1a1a)
- Dark grays (#2a2a2a, #3a3a3a)
- Gothic greens (#1a472a, #2d6a40, #3d8a50)
- Copper gold accents (#c9a961, #dab969)

✅ **Professional Components**
- Elegant header with animated navigation
- Hero section with gradient
- Responsive product grid
- Hover effects with glow
- Footer with sections
- Mobile-optimized layout

✅ **Typography**
- Playfair Display for headings (elegant serif)
- Poppins for body text (clean sans-serif)

✅ **Interactive Elements**
- Smooth transitions
- Gradient buttons
- Hover animations
- Responsive design

---

## 🚀 How to Apply (Choose One Method)

### **METHOD 1: Easiest - Copy CSS into Theme Settings (5 min)**

1. **Open your Shopify Admin**
   - Go to https://admin.shopify.com/store/gothic-influence
   - Log in if needed

2. **Navigate to Theme Customization**
   - Click **Online Store** (left sidebar)
   - Click **Themes**
   - Find **Horizon** (your current theme)
   - Click the **pencil icon** or **Customize** button

3. **Locate Custom CSS Section**
   - In the theme editor, look for **Theme settings** (bottom left, gear icon)
   - Scroll down to find **Additional CSS** or **Custom CSS**
   - Click **Add** or the text area

4. **Paste the CSS**
   - Open: `/data/workspace/shopify_theme.css`
   - Copy ALL the contents (Ctrl+A, Ctrl+C)
   - Paste into the CSS field in Shopify (Ctrl+V)
   - Click **Save**

5. **View Your Store**
   - Go to https://gothic-influence.myshopify.com
   - Your theme is now live!

---

### **METHOD 2: Code Editor - Advanced (10 min)**

1. **Open Theme Code Editor**
   - Go to **Online Store → Themes**
   - Click **Actions → Edit Code** (next to Horizon theme)

2. **Create CSS Asset File**
   - Click **Add a new asset** (top left)
   - Choose **Create a blank file**
   - Name: `custom-gothic.css`
   - Click **Create**

3. **Paste the CSS**
   - Copy contents of `/data/workspace/shopify_theme.css`
   - Paste into the blank file
   - Click **Save**

4. **Link CSS to Theme**
   - Open `theme.liquid` (in the sidebar under Layout folder)
   - Find the `</head>` closing tag (near the end of the HEAD section)
   - Add this line BEFORE `</head>`:
     ```liquid
     <link rel="stylesheet" href="{{ 'custom-gothic.css' | asset_url }}">
     ```
   - Click **Save**

5. **Preview & Publish**
   - Your store should now show the dark gothic theme
   - Go to https://gothic-influence.myshopify.com to see it live

---

### **METHOD 3: Using Inline Styles (Alternative)**

If methods 1-2 don't work, you can add the CSS directly to your `theme.liquid`:

1. Open `theme.liquid` code editor (same as Method 2)
2. Find the `<head>` section
3. Create a `<style>` block and paste the CSS inside
4. Save

---

## 📁 Files You Have

Located in `/data/workspace/`:

- **`shopify_theme.css`** — Complete CSS stylesheet (13.6 KB)
- **`shopify_theme_preview.html`** — Visual preview of theme
- **`SHOPIFY_THEME_SETUP.md`** — Detailed setup guide
- **`apply_shopify_theme.py`** — Automated upload script (for future use)

---

## 🎨 Color Reference

Need to customize? Find these colors in the CSS:

```css
/* Page Background */
--color-dark-black: #0d0d0d

/* Gray Backgrounds */
--color-dark-gray-1: #1a1a1a (headers)
--color-dark-gray-2: #2a2a2a (cards)
--color-dark-gray-3: #3a3a3a (deep areas)

/* Gothic Green (Accents) */
--color-gothic-green-dark: #1a472a
--color-gothic-green: #2d6a40 ← MAIN GREEN
--color-gothic-green-light: #3d8a50

/* Copper Gold (Highlights) */
--color-copper-gold: #c9a961 ← MAIN GOLD
--color-copper-gold-light: #dab969

/* Text Colors */
--color-text-primary: #f5f5f5 (bright white)
--color-text-secondary: #d0d0d0 (light gray)
```

**To change colors:**
1. Open `shopify_theme.css`
2. Search for the color hex code
3. Replace with your preferred color
4. Save and reupload to Shopify

---

## ✅ Testing Checklist

After applying the theme, verify:

- [ ] Page background is very dark
- [ ] Header has dark gray background with green border
- [ ] Logo text is copper gold
- [ ] Navigation links have animated underlines
- [ ] Hero section has gradient background
- [ ] Product cards have dark backgrounds
- [ ] Product titles are bright white
- [ ] Prices are in copper gold
- [ ] Buttons have green gradient
- [ ] Buttons have copper gold borders
- [ ] Hover effects work smoothly
- [ ] Footer matches header style
- [ ] Store looks good on mobile

---

## 🔧 Customization Examples

### Change the Green Color

Open `shopify_theme.css` and replace:
```css
--color-gothic-green: #2d6a40
```

With a different green:
- Darker: `#1a4d2e`
- Lighter: `#4a9e6f`
- Sage: `#556b5d`

### Change Gold Accent

Replace:
```css
--color-copper-gold: #c9a961
```

With alternatives:
- Brighter: `#f4c430` (pure gold)
- Rosegold: `#d4886f`
- Silver: `#c0c0c0`

### Adjust Text Brightness

For darker text, change:
```css
--color-text-primary: #f5f5f5
```

To:
- `#e8e8e8` (slightly darker)
- `#d0d0d0` (noticeably darker)
- `#a0a0a0` (very dark - less readable)

---

## 🚨 Troubleshooting

### "Theme didn't apply"
- Clear your browser cache (Ctrl+Shift+Delete)
- Force refresh (Ctrl+F5)
- Wait 1-2 minutes for Shopify to process

### "Colors look wrong"
- Make sure you copied the ENTIRE CSS file
- Check that no characters were cut off
- Paste into a text editor first to verify

### "Layout looks broken"
- The CSS assumes you have the Horizon theme
- If using a different theme, some styles may need adjustment
- Contact support if issues persist

### "Mobile looks bad"
- The theme includes mobile breakpoints
- Try refreshing on your phone
- Test in Chrome DevTools (F12 → toggle device toolbar)

---

## 📱 Mobile Responsive

Your theme automatically adjusts for:
- **Desktop** (1200px+): Full grid layout
- **Tablet** (768px-1200px): 2-column grid
- **Mobile** (320px-768px): Single column, touch-optimized

No extra setup needed!

---

## 💡 Pro Tips

1. **Add product images** — The theme looks best with high-quality product photos
2. **Use consistent fonts** — Stick to the Playfair Display + Poppins combo
3. **Test on real devices** — Preview on your phone, tablet, desktop
4. **Optimize images** — Compress product photos to load faster
5. **Add descriptions** — Product descriptions show on cards

---

## Next Steps

Once your theme is live:

1. ✅ Upload product images
2. ✅ Write product descriptions
3. ✅ Set shipping rates
4. ✅ Configure payment methods
5. ✅ Set up email notifications
6. ✅ Test complete checkout flow

---

## 🎉 You're All Set!

Your dark, elegant gothic theme is ready to impress customers.

**Questions?** Review the CSS file directly or check the color variables at the top.

**Store URL:** https://gothic-influence.myshopify.com

Good luck! 🎭✨

