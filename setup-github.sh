#!/bin/bash

# Script to set up GitHub repository for Zwift project
# Usage: ./setup-github.sh YOUR_GITHUB_USERNAME

if [ -z "$1" ]; then
    echo "Usage: ./setup-github.sh YOUR_GITHUB_USERNAME"
    echo ""
    echo "Example: ./setup-github.sh alexosborne"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="zwift"

echo "🚀 Setting up GitHub repository for Zwift..."
echo ""

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Remote 'origin' already exists. Removing it..."
    git remote remove origin
fi

# Add remote
echo "📡 Adding GitHub remote..."
git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo ""
echo "✅ Remote added successfully!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Create the repository on GitHub:"
echo "   Go to: https://github.com/new"
echo "   Repository name: ${REPO_NAME}"
echo "   Set to PUBLIC (required for GitHub Pages)"
echo "   DO NOT initialize with README/license"
echo "   Click 'Create repository'"
echo ""
echo "2. Push your code:"
echo "   git push -u origin main"
echo ""
echo "3. Enable GitHub Pages:"
echo "   - Go to: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/settings/pages"
echo "   - Source: Branch 'main', folder '/ (root)'"
echo "   - Click Save"
echo ""
echo "4. Your site will be live at:"
echo "   https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/"
echo ""

