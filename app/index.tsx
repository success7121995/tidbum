import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSetting } from "../constant/SettingProvider";
import { getLanguageText, Language } from "../lib/lang";
import {
	checkAndRequestPermission,
	openAppSettings,
	PermissionStatus,
	requestMediaLibraryPermission
} from "../lib/media";

export default function Index() {
	const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
		status: 'loading',
		isRequesting: false
	});

	const { language, theme } = useSetting();
	const text = getLanguageText(language as Language);

	useEffect(() => { 
		// Automatically check and request permission on app launch
		handleInitialPermissionCheck();
	}, []);

	/**
	 * Handle initial permission check and automatic request
	 */
	const handleInitialPermissionCheck = async () => {
		try {
			const result = await checkAndRequestPermission();
			setPermissionStatus(result);
			if (result.status === 'granted') {
				router.replace('/album');
			}
		} catch (error) {
			console.error('Error in initial permission check:', error);
		}
	};

	/**
	 * Request the media library permission manually
	 */
	const handleRequestPermission = async () => {
		setPermissionStatus(prev => ({ ...prev, isRequesting: true }));
		try {
			const granted = await requestMediaLibraryPermission();
			if (granted) {
				setPermissionStatus({ status: 'granted', isRequesting: false });
				router.replace('/album');
			} else {
				setPermissionStatus({ status: 'denied', isRequesting: false });
			}
		} catch (error) {
			console.error('Error requesting permission:', error);
			setPermissionStatus({ status: 'denied', isRequesting: false });
		}
	};

	/**
	 * Open the app settings
	 */
	const handleOpenSettings = async () => {
		await openAppSettings();
	};

	/**
	 * Show loading state
	 */
	if (permissionStatus.status === 'loading') {
		return (
			<View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>
				<View className="flex-1 justify-center items-center px-6 py-10">
					<View className={`w-10 h-10 rounded-full border-3 ${theme === 'dark' ? 'border-dark-border border-t-blue-500' : 'border-light-border border-t-blue-500'} mb-4`} />
					<Text className={`text-base ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} font-medium`}>{text.checkingPermissions}</Text>
				</View>
			</View>
		);
	}


	/**
	 * Show main app content when permission is granted
	 */
	return (
		<View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>
			<View className="flex-1 justify-center items-center px-6 py-10">
				{/* Icon placeholder */}
				<View className={`w-20 h-20 rounded-full ${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} justify-center items-center mb-6`}>
					<Text className="text-4xl">📷</Text>
				</View>
				
				<Text className={`text-2xl font-bold ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} text-center mb-4`}>
					{text.mediaAccessRequired}
				</Text>
				
				<Text className={`text-base ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-center leading-6 mb-8 max-w-80`}>
					{text.mediaAccessDescription}
				</Text>
				
				<View className="self-stretch mb-8">
					<Text className={`text-lg font-semibold ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-4 text-center`}>
						{text.toEnableAccess}
					</Text>
					<View className="flex-row items-center mb-3 px-4">
						<Text className="w-6 h-6 rounded-full bg-blue-500 text-white text-center leading-6 text-sm font-semibold mr-3">
							1
						</Text>
						<Text className={`text-base ${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'} flex-1`}>
							{text.tapOpenSettings}
						</Text>
					</View>
					<View className="flex-row items-center mb-3 px-4">
						<Text className="w-6 h-6 rounded-full bg-blue-500 text-white text-center leading-6 text-sm font-semibold mr-3">
							2
						</Text>
						<Text className={`text-base ${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'} flex-1`}>
							{text.findTidBum}
						</Text>
					</View>
					<View className="flex-row items-center mb-3 px-4">
						<Text className="w-6 h-6 rounded-full bg-blue-500 text-white text-center leading-6 text-sm font-semibold mr-3">
							3
						</Text>
						<Text className={`text-base ${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'} flex-1`}>
							{text.enablePhotosVideos}
						</Text>
					</View>
				</View>
				
				<View className="self-stretch space-y-3">
					<TouchableOpacity 
						className="bg-blue-500 py-4 px-8 rounded-xl items-center shadow-lg shadow-blue-500/30"
						onPress={handleOpenSettings}
					>
						<Text className={`text-white text-base font-semibold`}>
							{text.openSettings}
						</Text>
					</TouchableOpacity>
					
					<TouchableOpacity 
						className={`bg-transparent mt-5 py-4 px-8 rounded-xl border ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'} items-center`}
						onPress={handleRequestPermission}
						disabled={permissionStatus.isRequesting}
					>
						<Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-base font-medium`}>
							{permissionStatus.isRequesting ? text.requesting : text.tryAgain}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

