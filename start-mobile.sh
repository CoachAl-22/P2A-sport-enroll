#!/bin/bash

echo "🚀 Starting Power2ADAPT Mobile Development Server..."
echo ""

# Check if Expo CLI is installed globally
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI globally..."
    npm install -g @expo/cli
fi

# Navigate to mobile directory
cd mobile

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing mobile app dependencies..."
    npm install
fi

# Try to install Expo if not present
if [ ! -d "node_modules/expo" ]; then
    echo "📦 Installing Expo SDK..."
    npx expo install expo@~50.0.0 --fix
fi

echo ""
echo "🎯 Starting Expo development server..."
echo "📱 Use Expo Go app on your phone to scan the QR code"
echo "🔑 Test credentials: admin@power2adapt.com / admin123"
echo ""

# Start the Expo development server with tunnel for external access
npx expo start --tunnel