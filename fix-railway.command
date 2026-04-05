#!/bin/bash
# Fix Railway build — removes node_modules from git and sets the right root directory

cd ~/Documents/Claude/Mtn\ Bike\ App || { echo "❌ Folder not found"; read -p "Press Enter..."; exit 1; }

echo "🔧 Fixing Railway deployment..."
echo ""

# Make sure .gitignore is correct
cat > .gitignore << 'EOF'
node_modules/
*/node_modules/
web/build/
mobile/.expo/
.env
*/.env
.DS_Store
**/.DS_Store
*.log
EOF

echo "✅ .gitignore updated"

# Remove node_modules from git tracking (but keep the actual folder)
git rm -r --cached server/node_modules 2>/dev/null
git rm -r --cached web/node_modules 2>/dev/null
git rm -r --cached mobile/node_modules 2>/dev/null
git rm -r --cached node_modules 2>/dev/null

echo "✅ node_modules removed from git"

# Stage everything including the new railway.json files
git add .
git commit -m "fix: remove node_modules, add railway.json config"

echo ""
echo "⬆️  Pushing fix to GitHub..."
git push

echo ""
echo "✅ Done! Railway will automatically redeploy."
echo "   Watch the build at: https://railway.com"
echo ""
read -p "Press Enter to close..."
