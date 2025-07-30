# TidBum - Expo React Native Project

## Project Overview
TidBum is a React Native application built with Expo SDK 53, featuring a modern tech stack with TypeScript, Tailwind CSS (via NativeWind), and various React Native libraries for enhanced functionality. The app focuses on media library management with automatic permission handling and iOS settings integration.

## Tech Stack

### Core Technologies
- **Expo SDK**: ~53.0.20
- **React**: 19.0.0
- **React Native**: 0.79.5
- **TypeScript**: ~5.8.3
- **Node.js**: v23.11.0

### Styling & UI
- **NativeWind**: ^4.1.23 (Tailwind CSS for React Native)
- **Tailwind CSS**: ^3.4.17
- **React Native Reanimated**: ~3.17.4 (Animations)
- **Moti**: ^0.30.0 (Animation library)
- **Expo Blur**: ~14.1.5
- **Expo Linear Gradient**: ~14.1.5

### Navigation & Routing
- **Expo Router**: ~5.1.4 (File-based routing)
- **React Navigation**: ^7.1.6 (Bottom tabs, elements)

### State Management & Data
- **Zustand**: ^5.0.6 (State management)
- **React Hook Form**: ^7.61.1 (Form handling)
- **Zod**: ^4.0.13 (Schema validation)
- **Expo SQLite**: ~15.2.14 (Local database)
- **AsyncStorage**: ^2.2.0 (Local storage)

### Media & Assets
- **Expo AV**: ~15.1.7 (Audio/Video)
- **Expo Media Library**: ~17.1.7 (Media library access with permission handling)
- **Expo Image**: ~2.4.0
- **Expo Linking**: ~7.1.7 (iOS Settings integration)
- **React Native SVG**: 15.11.2
- **React Native WebView**: 13.13.5

### Development Tools
- **ESLint**: ^9.25.0
- **Prettier**: prettier-plugin-tailwindcss
- **Babel**: @babel/core ^7.25.2

## Project Structure

```
tidbum/
├── app/                    # Expo Router pages (file-based routing)
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home page with permission handling
├── lib/                   # Utility libraries
│   └── media.ts          # Media library utilities and permission handling
├── components/            # Reusable components
├── assets/                # Static assets (images, fonts)
│   ├── fonts/
│   └── images/
├── node_modules/
├── .expo/                 # Expo cache
├── .vscode/              # VS Code settings
├── app.json              # Expo configuration with media library permissions
├── babel.config.js       # Babel configuration
├── metro.config.js       # Metro bundler configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── global.css            # Global CSS with Tailwind directives
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Configuration Files

### babel.config.js
```javascript
module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};
```

### metro.config.js
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg', 'jpeg', 'gif', 'svg');

module.exports = withNativeWind(config, { 
  input: './global.css' 
});
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### global.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### app.json (Media Library Configuration)
```json
{
  "expo": {
    "plugins": [
      [
        "expo-media-library",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
          "savePhotosPermission": "Allow $(PRODUCT_NAME) to save photos.",
          "isAccessMediaLocationEnabled": true
        }
      ]
    ]
  }
}
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start web version
- `npm run lint` - Run ESLint

## Development Environment

### Prerequisites
- Node.js v23.11.0
- Expo CLI
- Watchman (for file watching)
- iOS Simulator / Android Emulator (optional)

### Setup Notes
- Project uses Expo Router for file-based routing
- NativeWind configured for Tailwind CSS support
- React Native Reanimated requires special Babel plugin
- Metro bundler configured for various asset types
- TypeScript strict mode enabled
- Media library permissions configured in app.json

### Recent Fixes & Improvements
- Resolved Watchman permission issues on macOS
- Configured NativeWind preset in Tailwind config
- Set up proper Metro configuration for asset handling
- Added React Native Reanimated Babel plugin
- Implemented comprehensive media library permission handling
- Added iOS Settings integration with expo-linking
- Created automatic permission prompting on first app launch
- Converted UI to use Tailwind CSS classes

## Key Features

### Media Library Management
- **Automatic Permission Handling**: Prompts for media library access on first app launch
- **iOS Settings Integration**: Direct link to app settings for permission management
- **Permission Status Management**: Comprehensive handling of granted, denied, and undetermined states
- **User-Friendly UI**: Step-by-step instructions for enabling permissions
- **Error Handling**: Graceful fallbacks and user-friendly error messages

### UI/UX Features
- **Modern Design**: Clean, accessible interface using Tailwind CSS
- **Loading States**: Proper feedback during permission requests
- **Responsive Layout**: Optimized for different screen sizes
- **Accessibility**: Proper contrast, readable fonts, and touch targets

### Technical Features
- **File-based routing with Expo Router**
- **Tailwind CSS styling with NativeWind**
- **TypeScript for type safety**
- **Local database with SQLite**
- **Form handling with React Hook Form**
- **State management with Zustand**
- **Animation support with Reanimated and Moti**
- **Media handling (audio, video, images)**
- **Cross-platform (iOS, Android, Web)**

## Media Library Implementation

### Core Functions (`lib/media.ts`)
- `checkAndRequestPermission()`: Automatic permission checking and requesting
- `openAppSettings()`: iOS Settings integration
- `getMediaLibrary()`: Media assets retrieval
- `checkMediaLibraryPermission()`: Permission status checking
- `requestMediaLibraryPermission()`: Manual permission requesting

### Permission Flow
1. **App Launch**: Automatically checks permission status
2. **Undetermined**: Shows permission request modal
3. **Denied**: Shows no-access screen with settings button
4. **Granted**: Shows success state and main app content

### iOS Settings Integration
- Uses `expo-linking` for direct app settings access
- Fallback to general settings if app-specific settings unavailable
- User-friendly error handling with manual instructions

## Development Workflow
1. Use `npx expo start` to start development server
2. Scan QR code with Expo Go app or use simulators
3. Hot reload enabled for rapid development
4. TypeScript provides compile-time error checking
5. ESLint ensures code quality
6. Media library permissions automatically handled on first launch

## Recent Updates
- **Automatic Permission Prompting**: App now automatically requests media library access on first launch
- **Centralized Permission Logic**: All permission handling moved to `lib/media.ts`
- **Tailwind CSS Implementation**: Converted all UI components to use Tailwind classes
- **iOS Settings Integration**: Direct link to app settings for permission management
- **Enhanced Error Handling**: Comprehensive error handling with user-friendly messages
