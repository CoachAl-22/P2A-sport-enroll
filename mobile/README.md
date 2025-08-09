# Power2ADAPT Mobile App

A React Native mobile application for the Power2ADAPT athletic program management platform, built with Expo.

## Features

- 🔐 **Secure Authentication** - User login with session management
- 📱 **Native Mobile Experience** - Built for iOS and Android
- 🏃‍♂️ **Class Management** - Browse and enroll in athletic classes
- 📊 **Personal Dashboard** - View enrollments and notifications
- 🔔 **Real-time Notifications** - Stay updated with program updates
- 👨‍👩‍👧‍👦 **Multi-child Support** - Manage enrollments for multiple children
- 💳 **Integrated Payments** - Seamless payment processing
- 🎯 **Venue Integration** - Find classes at multiple Melbourne locations

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and build tools
- **React Native Paper** - Material Design component library
- **React Navigation** - Native navigation
- **TanStack Query** - Server state management
- **TypeScript** - Type safety
- **Expo SecureStore** - Secure credential storage

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API services
│   ├── context/            # React context providers
│   └── theme/              # Theme and styling
├── App.tsx                 # Root component
├── app.json               # Expo configuration
└── package.json           # Dependencies
```

## Development Setup

### Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Expo CLI**: `npm install -g @expo/cli`
4. **Expo Go app** on your phone (for testing)

### Installation

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update API configuration:**
   Edit `app.json` to set your API URL:
   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": "https://your-replit-domain.replit.app"
       }
     }
   }
   ```

### Running the App

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Run on specific platforms:**
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

3. **Test on device:**
   - Scan the QR code with Expo Go app
   - Or use device simulators

## Building for Production

### Using EAS Build (Recommended)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS:**
   ```bash
   eas build:configure
   ```

3. **Build for iOS:**
   ```bash
   npm run build:ios
   ```

4. **Build for Android:**
   ```bash
   npm run build:android
   ```

### App Store Deployment

1. **Submit to App Store:**
   ```bash
   npm run submit:ios
   ```

2. **Submit to Google Play:**
   ```bash
   npm run submit:android
   ```

## Configuration

### Environment Variables

Set these in your `app.json` extra section:

- `apiUrl` - Your backend API URL
- `stripePublishableKey` - Stripe public key (if using payments)

### App Configuration

Key configuration files:

- `app.json` - Expo configuration, app metadata
- `eas.json` - Build configuration (created when running EAS configure)
- `metro.config.js` - Metro bundler configuration

## Key Features Implementation

### Authentication
- Secure token storage with Expo SecureStore
- Automatic session management
- Login/logout flows

### Navigation
- Bottom tab navigation for main sections
- Stack navigation for detailed views
- Protected routes based on authentication

### State Management
- TanStack Query for server state
- React Context for global app state
- Automatic cache invalidation

### UI/UX
- Material Design with React Native Paper
- Consistent theming and styling
- Responsive design for various screen sizes
- Loading states and error handling

## Development Guidelines

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Consistent file naming conventions
- Component-based architecture

### Testing
```bash
# Run tests (when implemented)
npm test

# Type checking
npx tsc --noEmit
```

### Performance
- Optimized bundle size
- Lazy loading for screens
- Efficient API calls with caching
- Image optimization

## Troubleshooting

### Common Issues

1. **Metro bundler errors:**
   ```bash
   npx expo start --clear
   ```

2. **iOS Simulator issues:**
   ```bash
   npx expo run:ios --clean
   ```

3. **Android build issues:**
   ```bash
   npx expo run:android --clean
   ```

### Debug Mode
- Enable debug mode in Expo Go
- Use React Native Debugger
- Check Metro logs for errors

## Production Checklist

- [ ] Update app version in `app.json`
- [ ] Set production API URL
- [ ] Configure app icons and splash screen
- [ ] Test on physical devices
- [ ] Review app store guidelines
- [ ] Prepare app store metadata
- [ ] Configure app signing certificates

## Support

For technical support or questions:
- Check the [Expo documentation](https://docs.expo.dev/)
- Review [React Native documentation](https://reactnative.dev/)
- Contact the development team

## License

This project is part of the Power2ADAPT platform. All rights reserved.