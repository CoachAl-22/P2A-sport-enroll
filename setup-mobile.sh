#!/bin/bash

# Power2ADAPT Mobile App Setup Script

echo "🚀 Setting up Power2ADAPT Mobile App..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the root project directory"
    exit 1
fi

# Navigate to mobile directory
cd mobile

echo "📱 Installing mobile app dependencies..."

# Create a package.json with correct React Native versions
cat > package.json << 'EOF'
{
  "name": "power2adapt-mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android", 
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@expo/vector-icons": "^14.0.0",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@tanstack/react-query": "^5.17.0",
    "expo": "~50.0.0",
    "expo-constants": "~15.4.0",
    "expo-linking": "~6.2.0",
    "expo-secure-store": "~12.8.0",
    "expo-status-bar": "~1.11.0",
    "react": "18.2.0",
    "react-native": "0.73.2",
    "react-native-paper": "^5.12.3",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.3.0"
  },
  "private": true
}
EOF

echo "📦 Installing dependencies..."
npm install

echo "✅ Mobile app setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Install Expo Go app on your phone"
echo "2. Run: npx expo start"
echo "3. Scan QR code with your phone"
echo "4. Login with: admin@power2adapt.com / admin123"
echo ""
echo "📚 Read mobile/SETUP.md for detailed instructions"