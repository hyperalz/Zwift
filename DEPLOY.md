# Deploying to GitHub

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `zwift`
3. Description: "Zwift route planner with multi-user support and joint rides"
4. Set to **Public** (required for GitHub Pages)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Push to GitHub

After creating the repo, GitHub will show you commands. Use these:

```bash
cd /Users/alexosbornemac/the-accused/zwift
git remote add origin https://github.com/YOUR_USERNAME/zwift.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/zwift`
2. Click **Settings** tab
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**

## Step 4: Access Your Public URL

After a few minutes, your site will be available at:
```
https://YOUR_USERNAME.github.io/zwift/
```

## Alternative: Using GitHub CLI (if installed)

If you install GitHub CLI (`brew install gh`), you can create the repo automatically:

```bash
gh repo create zwift --public --source=. --remote=origin --push
gh repo view --web
```

Then enable GitHub Pages as described in Step 3 above.

