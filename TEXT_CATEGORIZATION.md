# TidBum Text Categorization

This document provides a detailed categorization of all text keys used in the TidBum application for internationalization.

## 📁 ALBUM MANAGEMENT

### Album Creation & Editing
- `createAlbum` - Main action button for creating new albums
- `createAlbumSubtitle` - Descriptive text explaining album creation
- `editAlbum` - Header title for album editing screen
- `updateAlbumDetails` - Subtitle for album editing screen
- `albumName` - Form label for album name field
- `enterAlbumName` - Placeholder text for album name input
- `albumNameRequired` - Validation error message
- `albumNameTooLong` - Validation error message for character limit
- `enterAlbumDescription` - Form label for album description field
- `saveAlbum` - Button text for saving album changes
- `saving` - Loading state text while saving
- `cancel` - Button text for canceling actions

### Album Status & Navigation
- `albumNotFound` - Error message when album cannot be found
- `loadingAlbum` - Loading state text while fetching album data
- `noAlbum` - Empty state message when no albums exist
- `noDescription` - Fallback text when album has no description

### Album Content Organization
- `folders` - Section header for sub-albums/folders
- `media` - Section header for media items
- `noMediaInAlbum` - Empty state message when album has no media
- `tapToAdd` - Instructional text for adding media

### Album Actions
- `addMediaOrNewFolder` - Action description for adding content
- `addMedia` - Action button text for adding media
- `addNewFolder` - Action button text for creating sub-albums
- `deleteAlbum` - Confirmation message for album deletion

## 🖼️ MEDIA & ASSETS

### Media Types
- `photo` - Singular form of photo
- `photos` - Plural form of photos
- `video` - Singular form of video
- `videos` - Plural form of videos
- `asset` - Singular form of media asset
- `assets` - Plural form of media assets

### Media Actions
- `delete` - Generic delete action text
- `deleteAsset` - Specific delete action for assets
- `deletePhoto` - Specific delete action for photos
- `deleteVideo` - Specific delete action for videos
- `deletingAssetMessage` - Confirmation message for asset deletion

### Media Selection
- `item` - Singular form for selected items
- `items` - Plural form for selected items
- `selected` - Status indicator for selected items

## 🔐 PERMISSIONS & ACCESS

### Permission Requests
- `checkingPermissions` - Loading state while checking permissions
- `mediaAccessRequired` - Main title for permission request screen
- `mediaAccessDescription` - Detailed explanation of why permissions are needed
- `toEnableAccess` - Section header for permission instructions

### Permission Instructions
- `tapOpenSettings` - Step 1 instruction for enabling permissions
- `findTidBum` - Step 2 instruction for finding the app
- `enablePhotosVideos` - Step 3 instruction for enabling media access
- `openSettings` - Button text for opening device settings
- `tryAgain` - Button text for retrying permission request
- `requesting` - Loading state while requesting permissions

## 📚 MEDIA LIBRARY

### Library Interface
- `mediaLibrary` - Header title for media library screen
- `noMediaYet` - Empty state message when no media is available
- `addPhotosVideos` - Action description for adding media
- `available` - Status indicator for available media count

## 🖼️ ALBUM SLIDER & VIEWER

### Caption Management
- `editCaption` - Button text for editing captions
- `addCaption` - Placeholder text for caption input

## ⚙️ SETTINGS & PREFERENCES

### Settings Navigation
- `setting` - Main settings screen title
- `language` - Language settings section header
- `languageSetting` - Language selection screen title
- `languageSubtitle` - Current language display text

### Appearance Settings
- `appearance` - Appearance settings section header
- `darkMode` - Dark mode toggle label
- `darkModeSubtitle` - Dark mode description

### Help & Support
- `helpSupport` - Help and support section header
- `helpCenter` - Help center menu item
- `helpCenterSubtitle` - Help center description
- `faq` - FAQ menu item
- `faqSubtitle` - FAQ description

### Legal & Terms
- `legal` - Legal section header
- `termsOfUse` - Terms of use menu item
- `termsOfUseSubtitle` - Terms of use description
- `privacyPolicy` - Privacy policy menu item
- `privacyPolicySubtitle` - Privacy policy description

### App Information
- `version` - App version display
- `copyright` - Copyright information

## ❌ ERROR MESSAGES & ALERTS

### General Errors
- `error` - Generic error title

### Operation Failures
- `failedToUpdateLanguage` - Language update failure message
- `failedToCreateAlbum` - Album creation failure message
- `failedToSaveAlbum` - Album save failure message

### External Link Failures
- `cannotOpenHelpCenter` - Help center link failure
- `cannotOpenFAQ` - FAQ link failure
- `cannotOpenTerms` - Terms of use link failure
- `cannotOpenPolicy` - Privacy policy link failure

## 📊 Statistics

### Total Text Keys: 67
- **Album Management**: 20 keys (29.9%)
- **Media & Assets**: 12 keys (17.9%)
- **Permissions & Access**: 11 keys (16.4%)
- **Settings & Preferences**: 15 keys (22.4%)
- **Error Messages & Alerts**: 7 keys (10.4%)
- **Media Library**: 4 keys (6.0%)
- **Album Slider & Viewer**: 2 keys (3.0%)

### Language Support
- **English (EN)**: Primary language
- **Traditional Chinese (ZH_TW)**: Full localization
- **Simplified Chinese (ZH_CN)**: Full localization

## 🔧 Usage Guidelines

1. **Consistency**: All text keys follow camelCase naming convention
2. **Context**: Keys are organized by functional areas for easy maintenance
3. **Completeness**: Every user-facing text has a corresponding key
4. **Flexibility**: Keys support singular/plural forms and contextual variations
5. **Maintainability**: Clear categorization makes it easy to find and update text

## 📝 Notes

- All text keys are automatically available in all supported languages
- New text should be added to all three language sections
- Text keys should be descriptive and indicate their usage context
- Error messages include actionable instructions where appropriate
- Loading states and empty states are properly localized 