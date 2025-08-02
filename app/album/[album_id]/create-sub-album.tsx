import AlbumForm from '@/components/AlbumForm';
import { useSetting } from '@/constant/SettingProvider';
import { createAlbum } from '@/lib/db';
import { getLanguageText, Language } from '@/lib/lang';
import { CreateAlbumFormData } from '@/lib/schema';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

const CreateAlbumScreen = () => {
	// ============================================================================
	// STATE
	// ============================================================================
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { album_id } = useLocalSearchParams();
	const { language, theme } = useSetting();
	const text = getLanguageText(language as Language);

	// The album_id from the route is the parent album ID
	const parentAlbumId = album_id as string;

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

			const subAlbumId = await createAlbum({
				name: data.name,
				description: data.description,
				parent_album_id: parentAlbumId,
			});

			if (!subAlbumId) {
				throw new Error('Failed to create album');
			}

			// Go back to parent album - the album will refresh automatically via useFocusEffect
			router.back();
		} catch (error) {
			Alert.alert(text.error, text.failedToCreateAlbum);
			throw error; // Re-throw to let the form handle the error
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