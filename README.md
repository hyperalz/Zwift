# Zwift Route Planner

An interactive web app to plan and track Zwift cycling routes with multi-user support and joint ride capabilities.

## Features

- 📅 **Calendar View** - Visual calendar to plan routes by date
- 👥 **Multi-User Support** - Track routes for multiple riders (John, Alex, Karen, Carol, Ali)
- 🚴 **Joint Rides** - Multiple users can add the same route on the same date
- 📊 **Route Details** - View all 198 routes with map, length, elevation, and badge XP
- 🔍 **Search & Sort** - Search routes by name/map, sort by miles, elevation, or map
- 📈 **Progress Tracking** - Track individual progress toward 500km (312.5 miles) goal
- 💾 **Auto-Save** - Progress automatically saved to browser localStorage
- 📱 **Responsive Design** - Works on desktop and mobile devices

## How to Use

### Local Development

1. **Start the local server:**
   ```bash
   python3 -m http.server 8000
   # Or use the provided script:
   ./start.sh
   ```

2. **Open in browser:**
   Navigate to `http://localhost:8000`

3. **Use the app:**
   - Click a date on the calendar to view/add routes
   - Select a user, then choose a route to add
   - Multiple users can add the same route for joint rides
   - Use search and sort controls to find routes
   - View progress statistics for each user

### Deploy to GitHub Pages

See `DEPLOY.md` for detailed instructions, or run:

```bash
./setup-github.sh YOUR_GITHUB_USERNAME
```

Then follow the prompts to create the repo and enable GitHub Pages.

## Files

- `index.html` - Main app interface
- `app.js` - Application logic and route management
- `routes_data.json` - Route data (exported from Excel)
- `analyze.py` / `analyze_full.py` - Python scripts for data processing
- `start.sh` - Local development server script

## Data Storage

Your progress is automatically saved to browser localStorage, so it persists between sessions. Each user's route assignments are stored separately.

## Live Demo

Once deployed to GitHub Pages, your site will be available at:
```
https://YOUR_USERNAME.github.io/zwift/
```

