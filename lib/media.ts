
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

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
			// Permission already granted
			return { status: 'granted', isRequesting: false };
		}
		
		if (status === 'denied') {
			// Permission denied, return status for UI to show settings button
			return { status: 'denied', isRequesting: false };
		}
		
		// Status is 'undetermined' - automatically request permission
		const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
		
		if (newStatus === 'granted') {
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
			const assets = await MediaLibrary.getAssetsAsync();
			return { success: true, assets };
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
			const assets = await MediaLibrary.getAssetsAsync();
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