#!/bin/bash
cd ~/Documents/Claude/Mtn\ Bike\ App || { echo "❌ Folder not found"; read -p "Press Enter..."; exit 1; }

echo "⬆️  Pushing updates to GitHub..."
git add .
git commit -m "feat: add Netlify CORS support and netlify.toml"
git push

echo ""
echo "✅ Done! Railway will auto-redeploy the backend."
echo "   Now go to vercel.com to deploy the frontend."
echo ""
read -p "Press Enter to close..."
