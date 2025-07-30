# TidBum - Expo React Native Project

## Project Overview
TidBum is a React Native application built with Expo SDK 53, featuring a modern tech stack with TypeScript, Tailwind CSS (via NativeWind), and various React Native libraries for enhanced functionality. The app focuses on media library management with automatic permission handling, iOS settings integration, streamlined album creation forms with validation, a robust local SQLite database for data persistence, and a responsive grid-based album gallery interface. The codebase follows a well-organized structure with clear separation of concerns and consistent code organization patterns.

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
- **React Hook Form**: ^7.61.1 (Form handling with validation)
- **Zod**: ^4.0.13 (Schema validation)
- **@hookform/resolvers**: ^5.2.1 (Zod integration with React Hook Form)
- **Expo SQLite**: ~15.2.14 (Local database with prepared statements)
- **AsyncStorage**: ^2.2.0 (Local storage)
- **React Native UUID**: ^2.0.3 (UUID generation for unique identifiers)

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
│   ├── index.tsx          # Home page with permission handling
│   └── album/             # Album-related pages
│       ├── _layout.tsx    # Album layout
│       ├── index.tsx      # Album list page with responsive grid
│       ├── create.tsx     # Album creation form
│       └── [album_id]/    # Dynamic album routes
│           ├── _layout.tsx # Album detail layout
│           └── index.tsx   # Album detail page
├── lib/                   # Utility libraries
│   ├── db.ts             # SQLite database operations and schema
│   ├── media.ts          # Media library utilities and permission handling
│   └── schema.ts         # Zod schemas for form validation
├── types/                 # TypeScript type definitions
│   └── album.d.ts        # Album interface definitions
├── components/            # Reusable components
│   ├── AlbumCard.tsx     # Responsive album card with navigation
│   └── AlbumForm.tsx     # Reusable album creation form
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

## Code Organization Structure

### File-Level Organization Pattern
The project follows a consistent code organization pattern across all files:

```typescript
// ============================================================================
// IMPORTS
// ============================================================================
import React from 'react';
import { View, Text } from 'react-native';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface ComponentProps {
    // props definition
}

// ============================================================================
// CONSTANTS
// ============================================================================
const CONSTANTS = {
    // app-wide constants
};

// ============================================================================
// UTILITIES & HELPERS
// ============================================================================
const helperFunction = () => {
    // helper functions
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Component = ({ props }: ComponentProps) => {
    // ============================================================================
    // STATE & REFS
    // ============================================================================
    const [state, setState] = useState();
    const ref = useRef();

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useEffect(() => {
        // side effects
    }, []);

    // ============================================================================
    // HANDLERS & CALLBACKS
    // ============================================================================
    const handlePress = () => {
        // event handlers
    };

    // ============================================================================
    // RENDERERS
    // ============================================================================
    const renderItem = () => {
        // render functions
    };

    // ============================================================================
    // MAIN RENDER
    // ============================================================================
    return (
        <View>
            {/* JSX */}
        </View>
    );
};

// ============================================================================
// EXPORTS
// ============================================================================
export default Component;
```

### Current File Organization Status

#### ✅ **Well-Organized Files**
- **`app/album/index.tsx`**: Follows the pattern with STATE, HANDLERS, RENDERERS sections
- **`components/AlbumCard.tsx`**: Organized with HANDLERS and RENDERERS sections
- **`lib/db.ts`**: Structured with DATABASE INITIALIZATION, ALBUM OPERATIONS, ASSET OPERATIONS sections

#### 🔄 **Files Needing Organization**
- **`app/index.tsx`**: Home page with permission handling
- **`app/album/create.tsx`**: Album creation form
- **`app/album/[album_id]/index.tsx`**: Album detail page
- **`components/AlbumForm.tsx`**: Album form component
- **`lib/media.ts`**: Media library utilities
- **`lib/schema.ts`**: Validation schemas

### Recommended Project-Level Organization

```
tidbum/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Home page
│   └── album/                   # Album feature
│       ├── _layout.tsx          # Album layout
│       ├── index.tsx            # Album list (✅ organized)
│       ├── create.tsx           # Album creation
│       └── [album_id]/          # Dynamic album routes
│           ├── _layout.tsx      # Album detail layout
│           └── index.tsx        # Album detail page
├── components/                   # Reusable components
│   ├── AlbumCard.tsx            # Album card (✅ organized)
│   └── AlbumForm.tsx            # Album form
├── lib/                         # Utility libraries
│   ├── db.ts                    # Database operations (✅ organized)
│   ├── media.ts                 # Media utilities
│   └── schema.ts                # Validation schemas
├── types/                       # TypeScript definitions
│   └── album.d.ts               # Album types
├── hooks/                       # Custom React hooks (planned)
│   ├── useAlbums.ts             # Album-related hooks
│   └── useMedia.ts              # Media-related hooks
├── stores/                      # State management (planned)
│   ├── albumStore.ts            # Album state
│   └── mediaStore.ts            # Media state
├── utils/                       # Utility functions (planned)
│   ├── constants.ts             # App constants
│   ├── helpers.ts               # Helper functions
│   └── validators.ts            # Validation utilities
└── assets/                      # Static assets
    ├── images/
    └── fonts/
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
- React Hook Form with Zod validation for forms
- SQLite database with prepared statements for security
- React Native UUID for secure unique identifier generation
- Responsive grid layout for album gallery
- **Consistent code organization pattern across files**

### Recent Fixes & Improvements
- Resolved Watchman permission issues on macOS
- Configured NativeWind preset in Tailwind config
- Set up proper Metro configuration for asset handling
- Added React Native Reanimated Babel plugin
- Implemented comprehensive media library permission handling
- Added iOS Settings integration with expo-linking
- Created automatic permission prompting on first app launch
- Converted UI to use Tailwind CSS classes
- Implemented simplified album creation forms with React Hook Form and Zod validation
- Created reusable form components for better code organization
- Fixed TypeScript type issues with form validation schemas
- **Implemented SQLite database with secure prepared statements**
- **Added comprehensive database operations for albums and assets**
- **Created type-safe database interfaces and operations**
- **Implemented UUID generation using react-native-uuid**
- **Added database initialization and table creation**
- **Fixed UNIQUE constraint issues with proper UUID generation**
- **Added debugging logs for album creation process**
- **Implemented responsive grid layout for album gallery**
- **Redesigned AlbumCard component with modern UI**
- **Added precise navigation controls (cover photo only)**
- **Implemented asset counting with sub-album support**
- **Established consistent code organization pattern**
- **Organized key files with clear section separation**

## Key Features

### Code Organization & Architecture
- **Consistent File Structure**: All files follow the same organization pattern
- **Clear Section Separation**: Imports, Types, Constants, State, Effects, Handlers, Renderers
- **Scalable Architecture**: Easy to maintain and extend as project grows
- **Type Safety**: Proper TypeScript integration throughout
- **Modular Components**: Reusable components with clear responsibilities
- **Separation of Concerns**: Database, UI, and business logic properly separated

### Database Management
- **SQLite Integration**: Local database with expo-sqlite for data persistence
- **Secure Prepared Statements**: Protection against SQL injection attacks
- **Type-Safe Operations**: Full TypeScript integration with database operations
- **Automatic Initialization**: Database and tables created automatically on first run
- **Comprehensive CRUD**: Complete create, read, update, delete operations
- **Resource Management**: Proper statement finalization and connection handling
- **UUID Generation**: Secure unique identifier generation using react-native-uuid
- **Debug Logging**: Console logging for debugging album creation process
- **Asset Counting**: Recursive asset counting including sub-albums

### Media Library Management
- **Automatic Permission Handling**: Prompts for media library access on first app launch
- **iOS Settings Integration**: Direct link to app settings for permission management
- **Permission Status Management**: Comprehensive handling of granted, denied, and undetermined states
- **User-Friendly UI**: Step-by-step instructions for enabling permissions
- **Error Handling**: Graceful fallbacks and user-friendly error messages

### Form Management & Validation
- **React Hook Form Integration**: Efficient form state management
- **Zod Schema Validation**: Type-safe form validation with detailed error messages
- **Reusable Form Components**: Modular form components for consistency
- **Real-time Validation**: Instant feedback on form input
- **Simplified Interface**: Clean, focused forms with essential fields only
- **Type Safety**: Proper TypeScript integration with form validation

### UI/UX Features
- **Modern Design**: Clean, accessible interface using Tailwind CSS
- **Loading States**: Proper feedback during form submission and permission requests
- **Responsive Layout**: Optimized for different screen sizes
- **Accessibility**: Proper contrast, readable fonts, and touch targets
- **Keyboard Handling**: Proper keyboard avoidance and input management
- **Responsive Grid**: Adaptive layout (3 columns on iPhone, 5 on iPad)
- **Precise Navigation**: Cover photo only clickable for album navigation
- **Modern Card Design**: Rounded corners, shadows, and proper spacing

### Technical Features
- **File-based routing with Expo Router**
- **Tailwind CSS styling with NativeWind**
- **TypeScript for type safety**
- **Local database with SQLite and prepared statements**
- **Form handling with React Hook Form**
- **State management with Zustand**
- **Animation support with Reanimated and Moti**
- **Media handling (audio, video, images)**
- **Cross-platform (iOS, Android, Web)**
- **UUID generation for unique identifiers**
- **Responsive grid layout system**
- **Consistent code organization pattern**

## Database Implementation

### Core Database Functions (`lib/db.ts`)
- `initDb()`: Initialize database and create tables
- `getDb()`: Get database instance (auto-initializes if needed)
- `closeDb()`: Close database connection
- `createAlbum()`: Create new album with UUID generation and debugging logs
- `getAlbumById()`: Retrieve album by ID
- `getTopLevelAlbums()`: Get top-level albums with asset counts
- `getAllAlbums()`: Get all albums
- `updateAlbum()`: Update album details
- `deleteAlbum()`: Delete album and related assets
- `createAsset()`: Add media assets to albums
- `getAssetsByAlbum()`: Get all assets in an album
- `updateAssetOrder()`: Reorder assets within albums
- `setAlbumCover()`: Set album cover image
- `getAlbumStats()`: Get album statistics and counts
- `getAlbumTotalAssetCount()`: Count assets including sub-albums
- `getAllSubAlbumIds()`: Recursively get sub-album IDs

### Database Schema
- **Album Table**: Stores album information with hierarchical support
- **Asset Table**: Stores media assets with ordering and metadata
- **Foreign Key Relationships**: Proper referential integrity
- **Automatic Timestamps**: Created and updated timestamps
- **UUID Primary Keys**: Secure unique identifiers using react-native-uuid

### Security Features
- **Prepared Statements**: Protection against SQL injection
- **Parameter Binding**: Safe parameter passing
- **Statement Finalization**: Proper resource cleanup
- **Type Safety**: Full TypeScript integration
- **Error Handling**: Comprehensive error management
- **UUID Generation**: Cryptographically secure unique identifiers

### Current Implementation Status
- **Database Initialization**: ✅ Complete with table creation
- **Album Creation**: ✅ Working with UUID generation and debugging
- **Prepared Statements**: ✅ Implemented for security
- **Type Safety**: ✅ Full TypeScript integration
- **Error Handling**: ✅ Comprehensive error management
- **Debug Logging**: ✅ Console logs for troubleshooting
- **Asset Counting**: ✅ Recursive counting with sub-album support
- **Album Retrieval**: ✅ Top-level albums with asset counts
- **Code Organization**: ✅ Consistent structure in database files

## UI Components

### AlbumCard Component (`components/AlbumCard.tsx`)
- **Responsive Design**: Adapts to different screen sizes
- **Cover Photo Display**: Shows album cover with fallback placeholder
- **Precise Navigation**: Only cover photo is clickable for navigation
- **Menu Integration**: Separate menu icon for album actions
- **Asset Count Display**: Shows total assets with proper pluralization
- **Modern Styling**: Rounded corners, shadows, and clean typography
- **Type Safety**: Full TypeScript integration with optional totalAssets
- **Code Organization**: ✅ Well-structured with HANDLERS and RENDERERS sections

### Responsive Grid Layout
- **iPhone Layout**: 3 albums per row using `w-1/3`
- **iPad Layout**: 5 albums per row using `w-1/5`
- **Breakpoint Detection**: 768px width for tablet detection
- **Flexible Spacing**: Proper padding and margins for grid items
- **FlatList Integration**: Efficient rendering for large album lists
- **Tailwind Classes**: Pure Tailwind implementation for responsive design

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

## Form Implementation

### Schema Validation (`lib/schema.ts`)
- `albumSchema`: Simplified album creation form validation
- `createAlbumSchema`: Extended album creation validation
- `albumSearchSchema`: Album search and filter validation
- Type-safe form data interfaces with proper TypeScript integration

### Form Components
- `AlbumForm`: Reusable album creation form component
- Real-time validation with error messages
- Simplified interface with essential fields only
- Loading states and submission handling
- Proper TypeScript type safety

### Form Features
- **Required Fields**: Name validation with character limits
- **Optional Fields**: Description with character limit
- **Real-time Validation**: Instant feedback on form input
- **Error Handling**: User-friendly error messages
- **Type Safety**: Full TypeScript integration
- **Clean UI**: Minimal, focused interface

## Development Workflow
1. Use `npx expo start` to start development server
2. Scan QR code with Expo Go app or use simulators
3. Hot reload enabled for rapid development
4. TypeScript provides compile-time error checking
5. ESLint ensures code quality
6. Media library permissions automatically handled on first launch
7. Form validation provides real-time feedback
8. Database automatically initializes on first app launch
9. Debug logs help troubleshoot database operations
10. Responsive grid adapts to device screen size
11. **Consistent code organization pattern for maintainability**

## Recent Updates
- **Automatic Permission Prompting**: App now automatically requests media library access on first launch
- **Centralized Permission Logic**: All permission handling moved to `lib/media.ts`
- **Tailwind CSS Implementation**: Converted all UI components to use Tailwind classes
- **iOS Settings Integration**: Direct link to app settings for permission management
- **Enhanced Error Handling**: Comprehensive error handling with user-friendly messages
- **Simplified Album Forms**: Streamlined form system with React Hook Form and Zod validation
- **Reusable Components**: Modular form components for better code organization
- **Schema Validation**: Type-safe form validation with detailed error messages
- **TypeScript Fixes**: Resolved type issues with form validation schemas
- **Clean Architecture**: Simplified form structure focusing on essential fields
- **SQLite Database Implementation**: Complete database layer with secure operations
- **Prepared Statements**: SQL injection protection with prepared statements
- **UUID Generation**: Secure unique identifier generation using react-native-uuid
- **Database Schema**: Comprehensive table structure for albums and media assets
- **Type-Safe Database Operations**: Full TypeScript integration with database layer
- **Resource Management**: Proper database connection and statement handling
- **Debug Logging**: Added console logs for troubleshooting album creation
- **UNIQUE Constraint Fixes**: Resolved database constraint violations with proper UUID generation
- **Responsive Grid Layout**: Implemented adaptive grid (3 columns iPhone, 5 columns iPad)
- **AlbumCard Redesign**: Modern card design with cover photo navigation
- **Precise Navigation**: Cover photo only clickable for better UX
- **Asset Counting**: Recursive asset counting including sub-albums
- **Modern UI Components**: Rounded corners, shadows, and clean typography
- **Tailwind Integration**: Pure Tailwind classes for responsive design
- **Code Organization Structure**: Established consistent file organization pattern
- **Section Separation**: Clear separation of imports, types, state, handlers, and renderers
- **Maintainable Architecture**: Scalable code structure for team development
