
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';
import { deleteAsset, getExistingAssetIds } from './db';

export interface MediaLibraryResult {
	success: boolean;
	assets?: MediaLibrary.PagedInfo<MediaLibrary.Asset>;
	error?: string;
}

export interface PermissionStatus {
	status: 'granted' | 'denied' | 'undetermined' | 'loading';
	isRequesting: boolean;
}

/**
 * Open iOS Settings app to the app's settings page
 */
export const openAppSettings = async () => {
	try {
		// This will open the iOS Settings app directly to the app's settings page
		const canOpen = await Linking.canOpenURL('app-settings:');
		if (canOpen) {
			await Linking.openURL('app-settings:');
		} else {
			// Fallback to general settings
			await Linking.openSettings();
		}
	} catch (error) {
		console.error('Error opening settings:', error);
		// Fallback: show alert with instructions
		Alert.alert(
			'Open Settings',
			'Please go to Settings > Privacy & Security > Photos and Videos > TidBum and enable access.',
			[{ text: 'OK' }]
		);
	}
};

/**
 * Check and automatically request permission on first app launch
 * This function handles the complete permission flow
 */
export const checkAndRequestPermission = async (): Promise<PermissionStatus> => {
	try {
		// Check current permission status
		const { status } = await MediaLibrary.getPermissionsAsync();
		
		if (status === 'granted') {
			// Permission already granted - start watcher
			await initializeMediaLibraryWatcher();
			return { status: 'granted', isRequesting: false };
		}
		
		if (status === 'denied') {
			// Permission denied, return status for UI to show settings button
			return { status: 'denied', isRequesting: false };
		}
		
		// Status is 'undetermined' - automatically request permission
		const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
		
		if (newStatus === 'granted') {
			// Permission granted - start watcher
			await initializeMediaLibraryWatcher();
			return { status: 'granted', isRequesting: false };
		} else {
			return { status: 'denied', isRequesting: false };
		}
	} catch (error) {
		console.error('Error in checkAndRequestPermission:', error);
		return { status: 'denied', isRequesting: false };
	}
};

/**
 * Get the media library assets
 * @returns MediaLibraryResult
 */
export const getMediaLibrary = async (): Promise<MediaLibraryResult> => {
	try {
		// Check current permission status
		const { status } = await MediaLibrary.getPermissionsAsync();
		
		if (status === 'granted') {
			// Permission already granted, get assets
			// Get all assets with no limit
			const assetsResult = await MediaLibrary.getAssetsAsync({
				first: 10000, // Get up to 10,000 assets
				sortBy: ['creationTime'],
				mediaType: ['photo', 'video']
			});
			
			const assetsWithDetails = await Promise.all(
				assetsResult.assets.map(async (asset) => {
					const details = await MediaLibrary.getAssetInfoAsync(asset.id);
					return { ...asset, ...details };
				})
			);

			return { 
				success: true, 
				assets: {
					...assetsResult,
					assets: assetsWithDetails
				}
			};
		}
		
		if (status === 'denied') {
			// Permission denied, show alert to user
			Alert.alert(
				'Media Library Access Required',
				'This app needs access to your media library to display your photos and videos. Please grant permission in Settings.',
				[
					{ text: 'Cancel', style: 'cancel' },
					{ 
						text: 'Open Settings', 
						onPress: openAppSettings
					}
				]
			);
			return { 
				success: false, 
				error: 'Permission denied. Please enable media library access in Settings.' 
			};
		}
		
		// Request permission
		const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
		
		if (newStatus === 'granted') {
			const assets = await MediaLibrary.getAssetsAsync({
				first: 100000, // Get up to 10,000 assets
				sortBy: ['creationTime'],
				mediaType: ['photo', 'video']
			});
			return { success: true, assets };
		} else {
			Alert.alert(
				'Permission Required',
				'Media library access is required to use this feature.',
				[{ text: 'OK' }]
			);
			return { 
				success: false, 
				error: 'Permission not granted' 
			};
		}
	} catch (error) {
		console.error('Error accessing media library:', error);
		return { 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error occurred' 
		};
	}
};

/**
 * Helper function to check if permission is granted
 * @returns true if permission is granted, false otherwise
 */
export const checkMediaLibraryPermission = async (): Promise<boolean> => {
	const { status } = await MediaLibrary.getPermissionsAsync();
	return status === 'granted';
};

/**
 * Helper function to request permission only
 * @returns true if permission is granted, false otherwise
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
	const { status } = await MediaLibrary.requestPermissionsAsync();
	return status === 'granted';
};

/**
 * Get the current permission status
 * @returns 'granted' | 'denied' | 'undetermined'
 */
export const getMediaLibraryPermissionStatus = async (): Promise<'granted' | 'denied' | 'undetermined'> => {
	const { status } = await MediaLibrary.getPermissionsAsync();
	return status;
};

// ============================================================================
// MEDIA LIBRARY WATCHER STATE
// ============================================================================
let currentSubscription: MediaLibrary.Subscription | null = null;

// ============================================================================
// MEDIA LIBRARY WATCHER FUNCTIONS
// ============================================================================

/**
 * Start media library watcher
 * @param onChange - Callback function to handle media library changes
 * @returns MediaLibrary.Subscription | null
 */
export const startMediaLibraryWatcher = async (onChange: (event: MediaLibrary.MediaLibraryAssetsChangeEvent) => void): Promise<MediaLibrary.Subscription | null> => {
	try {
		const { status } = await MediaLibrary.getPermissionsAsync();
		if (status !== 'granted') {
			console.warn('Media library permission not granted, cannot start watcher');
			return null;
		}

		const subscription = MediaLibrary.addListener(onChange);

		return subscription;
	} catch (error) {
		console.error('Failed to start media library watcher:', error);
		return null;
	}
};

/**
 * Stop media library watcher
 * @param subscription - The subscription to stop
 */
export const stopMediaLibraryWatcher = (subscription: MediaLibrary.Subscription | null): void => {
	if (subscription) {
		subscription.remove();
	}
};

// Global callback for triggering UI refresh
let onDatabaseChangeCallback: (() => void) | null = null;

/**
 * Set callback for database change notifications
 * @param callback - Function to call when database changes
 */
export const setDatabaseChangeCallback = (callback: (() => void) | null) => {
	onDatabaseChangeCallback = callback;
};

/**
 * Handle media library changes
 * Automatically removes deleted assets from database
 * @param event - Media library change event
 */
export const handleMediaLibraryChange = async (event: MediaLibrary.MediaLibraryAssetsChangeEvent): Promise<void> => {
	try {
		// Get current media library assets
		const { assets } = await MediaLibrary.getAssetsAsync({
			first: 10000,
			sortBy: ['creationTime'],
			mediaType: ['photo', 'video']
		});

		// Get existing asset IDs from database
		const existingAssetIds = await getExistingAssetIds();
		
		// Find assets that exist in database but not in media library (deleted)
		const deletedAssetIds = Array.from(existingAssetIds).filter(
			dbAssetId => !assets.some(mlAsset => mlAsset.id === dbAssetId)
		);

		// Remove deleted assets from database
		for (const assetId of deletedAssetIds) {
			await deleteAsset(assetId);
		}

		if (deletedAssetIds.length > 0) {
			// Trigger UI refresh if callback is set
			if (onDatabaseChangeCallback) {
				onDatabaseChangeCallback();
			}
		}
	} catch (error) {
		console.error('Error handling media library change:', error);
	}
};

/**
 * Check if media library watcher is active
 * @returns boolean
 */
export const isMediaLibraryWatcherActive = (): boolean => {
	return currentSubscription !== null;
};

/**
 * Initialize media library watcher
 * Starts the watcher if permission is granted
 * @returns boolean - true if watcher was started successfully
 */
export const initializeMediaLibraryWatcher = async (): Promise<boolean> => {
	if (currentSubscription) {
		return true; // Already active
	}

	currentSubscription = await startMediaLibraryWatcher(handleMediaLibraryChange);
	return currentSubscription !== null;
};

/**
 * Cleanup media library watcher
 * Stops the watcher and cleans up resources
 */
export const cleanupMediaLibraryWatcher = (): void => {
	stopMediaLibraryWatcher(currentSubscription);
	currentSubscription = null;
};

/**
 * Restart media library watcher
 * Useful when permission status changes
 * @returns boolean - true if watcher was restarted successfully
 */
export const restartMediaLibraryWatcher = async (): Promise<boolean> => {
	cleanupMediaLibraryWatcher();
	return await initializeMediaLibraryWatcher();
};