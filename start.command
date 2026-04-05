#!/bin/bash
# SendIt MTB App - Launch Script
# Double-click this file to start both servers

APP_DIR="/Users/davidmazzeo/Documents/Claude/Mtn Bike App"
cd "$APP_DIR"

echo "🚵 Starting SendIt MTB Trail Finder..."
echo ""

# Check Node is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install it from https://nodejs.org then try again."
  read -p "Press Enter to close..."
  exit 1
fi

echo "📦 Installing server dependencies..."
cd "$APP_DIR/server" && npm install --silent

echo "📦 Installing web dependencies..."
cd "$APP_DIR/web" && npm install --silent

echo ""
echo "🟢 Starting backend server on port 5000..."
cd "$APP_DIR/server" && node index.js &
SERVER_PID=$!

sleep 2

echo "🟢 Starting web app on port 3000..."
cd "$APP_DIR/web" && npm start &
WEB_PID=$!

echo ""
echo "✅ Both servers starting up..."
echo "   Web app:  http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Opening browser in ~10 seconds..."
echo "Press Ctrl+C to stop everything."

sleep 10
open http://localhost:3000

trap "kill $SERVER_PID $WEB_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
