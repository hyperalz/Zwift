# Firebase Setup Guide

This guide will help you set up Firebase so that all users can share their route data when accessing the public GitHub Pages URL.

## Why Firebase?

- ✅ **Free** - Generous free tier (1GB storage, 10GB/month transfer)
- ✅ **Simple** - No backend code needed, works with static GitHub Pages
- ✅ **Real-time** - Updates appear instantly for all users
- ✅ **Secure** - Firebase handles authentication and security
- ✅ **Fallback** - If Firebase isn't configured, the app uses localStorage (local to each browser)

## Quick Setup (5 minutes)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `zwift-tracker` (or any name you like)
4. Disable Google Analytics (not needed for this)
5. Click **"Create project"**

### Step 2: Enable Realtime Database

1. In your Firebase project, click **"Realtime Database"** in the left menu
2. Click **"Create database"**
3. Choose location (pick closest to you, e.g., `us-central1`)
4. Start in **"Test mode"** (we'll secure it in Step 4)
5. Click **"Enable"**

### Step 3: Get Your Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **`</>`** (web) icon
5. Register app with nickname: `zwift-web` (or any name)
6. **Copy the `firebaseConfig` object** - it looks like this:

```javascript
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

### Step 4: Add Config to Your Project

1. Copy `firebase-config.example.js` to `firebase-config.js`:
   ```bash
   cp firebase-config.example.js firebase-config.js
   ```

2. Open `firebase-config.js` and paste your Firebase config values

3. **Important:** Make sure `firebase-config.js` is in your `.gitignore` if you don't want to commit your API keys publicly. However, for Realtime Database with proper security rules, it's safe to include in a public repo.

### Step 5: Set Up Security Rules

1. In Firebase Console, go to **Realtime Database** > **Rules** tab
2. You should see a text editor with existing rules. **Delete everything** in the editor
3. Copy and paste **exactly** this (allows read/write for everyone - fine for a shared challenge tracker):

```
{
  "rules": {
    "zwiftUserData": {
      ".read": true,
      ".write": true
    }
  }
}
```

**Important:** 
- Make sure there are no extra spaces or characters
- The JSON must be valid (opening and closing braces match)
- Don't include the markdown code block markers (```) - just the JSON itself

4. Click **"Publish"** button

**If you still get a parse error:**
- Make sure you're in the **Realtime Database** rules (not Firestore)
- Try copying the rules one line at a time
- Check that all quotes are straight quotes (") not curly quotes (" or ")

### Step 6: Deploy

1. Commit and push your changes:
   ```bash
   git add firebase-config.js index.html app.js
   git commit -m "Add Firebase integration for shared data"
   git push
   ```

2. Wait for GitHub Pages to update (1-2 minutes)

3. Visit your site - you should see in the browser console: `✅ Firebase connected`

## Testing

1. Open the site in two different browsers (or incognito windows)
2. Add a route in one browser
3. Refresh the other browser - you should see the route appear!
4. This confirms Firebase is working and data is shared

## Troubleshooting

### "Firebase not configured" message
- Check that `firebase-config.js` exists and has your config
- Make sure all values are filled in (not "YOUR_API_KEY", etc.)

### Data not syncing
- Check browser console for errors
- Verify Firebase Realtime Database is enabled
- Check that security rules allow read/write

### Still using localStorage
- The app will fall back to localStorage if Firebase fails
- Check the browser console for error messages
- Verify your `databaseURL` in the config is correct

## Cost

Firebase Realtime Database free tier includes:
- 1 GB storage
- 10 GB/month transfer
- 100 concurrent connections

For a small group challenge tracker, this is more than enough and will stay free.

## Disabling Firebase

If you want to go back to localStorage-only (each browser has its own data):
- Simply delete or rename `firebase-config.js`
- The app will automatically use localStorage

