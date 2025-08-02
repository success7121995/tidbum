import { getLanguageText, Language } from '@/lib/lang';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import AlbumForm from '../../components/AlbumForm';
import { useSetting } from '../../constant/SettingProvider';
import { createAlbum } from '../../lib/db';
import { CreateAlbumFormData } from '../../lib/schema';

const CreateAlbumScreen = () => {
	// ============================================================================
	// STATE
	// ============================================================================
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { language, theme } = useSetting();
	const text = getLanguageText(language as Language);
	// ============================================================================
	// HANDLERS
	// ============================================================================

    /**
     * Handle form submission
     * @param data 
     */
	const handleSubmit = async (data: CreateAlbumFormData) => {
		setIsSubmitting(true);
		try {
			const albumId = await createAlbum({
				name: data.name,
				description: data.description,
			});

			if (!albumId) {
				throw new Error('Failed to create album');
			}

			// Go back to album list - the list will refresh automatically via useFocusEffect
			router.back();
		} catch (error) {
			Alert.alert(text.error, text.failedToCreateAlbum);
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	/**
	 * Handle cancel button press
	 */
	const handleCancel = () => {
		router.back();
	};

	// ============================================================================
	// RENDERERS
	// ============================================================================
	return (
		<View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>
			<ScrollView className="flex-1 px-6 py-6">
				{/* Header */}
				<View className="mb-8">
					<Text className={`text-3xl font-bold ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
						{text.createAlbum}
					</Text>
					<Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-base`}>
						{text.createAlbumSubtitle}
					</Text>
				</View>

				{/* Form */}
				<AlbumForm
					onSubmit={handleSubmit}
					onCancel={handleCancel}
					isSubmitting={isSubmitting}
				/>
			</ScrollView>
		</View>
	);
};

export default CreateAlbumScreen;