# Zwift Route Tracker

A simple, interactive web app to track Zwift cycling routes and progress toward your 500km goal.

## Features

- 📊 View all 198 routes with details (map, route name, length, elevation, badge XP)
- ✅ Check off routes you've completed (John, Alex, Karen, Carol, Ali)
- 📈 Track progress toward 500km (312.5 miles) goal
- 📊 See individual user statistics
- 🔍 Search and filter routes
- 🗳️ Vote for favorite routes
- 💾 Auto-saves your progress in browser

## How to Use

1. **Start the local server:**
   ```bash
   python3 -m http.server 8000
   ```

2. **Open in browser:**
   Navigate to `http://localhost:8000`

3. **Use the app:**
   - Check boxes to mark completed routes
   - Use the search box to find specific routes
   - Filter by "Completed" or "Remaining" routes
   - Click "Vote" to mark favorite routes
   - Watch your progress toward the 500km goal!

## Files

- `index.html` - Main app interface
- `app.js` - Application logic
- `routes_data.json` - Route data (exported from Excel)
- `zwift.xlsx` - Original Excel spreadsheet

## Data Storage

Your progress is automatically saved to browser localStorage, so it persists between sessions.

