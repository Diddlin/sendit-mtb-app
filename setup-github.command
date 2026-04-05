#!/bin/bash
# SendIt — Push to GitHub
# Double-click this file to initialize git and push to GitHub

APP_DIR="/Users/davidmazzeo/Documents/Claude/Mtn Bike App"
GITHUB_USER="dmazzeo18"
REPO_NAME="sendit-mtb"

echo "🚵 SendIt — GitHub Setup"
echo "========================"
echo ""

cd "$APP_DIR" || { echo "❌ Can't find app folder. Is it at $APP_DIR?"; read -p "Press Enter..."; exit 1; }

# Check git is installed
if ! command -v git &>/dev/null; then
  echo "❌ Git not found. Install Xcode Command Line Tools: xcode-select --install"
  read -p "Press Enter..."; exit 1
fi

# Check gh CLI is installed
if ! command -v gh &>/dev/null; then
  echo "⚠️  GitHub CLI (gh) not found."
  echo "   Install it with: brew install gh"
  echo "   Then run this script again."
  read -p "Press Enter..."; exit 1
fi

# Write .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/

# Build output
web/build/
mobile/.expo/
mobile/dist/

# Environment files — NEVER commit these
.env
server/.env
*/.env

# macOS
.DS_Store
**/.DS_Store

# Logs
*.log
npm-debug.log*

# Runtime
*.pid
EOF

echo "✅ .gitignore created"

# Init git if not already
if [ ! -d ".git" ]; then
  git init
  git branch -M main
  echo "✅ Git initialized"
fi

# Create GitHub repo (private by default — change --private to --public if you want)
echo ""
echo "📡 Creating GitHub repo: $GITHUB_USER/$REPO_NAME ..."
gh repo create "$REPO_NAME" --private --description "SendIt MTB Trail Finder" 2>&1

# Add remote if not already set
if ! git remote get-url origin &>/dev/null; then
  git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
fi

# Stage and commit everything
git add .
git commit -m "🚵 Initial commit — SendIt MTB Trail Finder

- React web app with trail search, filters, trail cards
- Node/Express backend with TrailForks, AllTrails, Singletracks, OSM
- Garmin Connect OAuth + GPX export
- User auth with JWT
- React Native mobile app (Expo)"

# Push
echo ""
echo "⬆️  Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your code is live at:"
echo "   https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "Next steps:"
echo "  1. Go to railway.app → New Project → Deploy from GitHub → pick '$REPO_NAME' → select the /server folder"
echo "  2. Go to vercel.com → New Project → Import '$REPO_NAME' → set Root Directory to 'web'"
echo ""
open "https://github.com/$GITHUB_USER/$REPO_NAME"
read -p "Press Enter to close..."
