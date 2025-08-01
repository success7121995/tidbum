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
	const { language } = useSetting();
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

			router.replace({
				pathname: '/album/[album_id]',
				params: {
					album_id: albumId,
					refresh: 'true',
				},
			});
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
		<View className="flex-1 bg-white">
			<ScrollView className="flex-1 px-6 py-6">
				{/* Header */}
				<View className="mb-8">
					<Text className="text-3xl font-bold text-slate-800 mb-2">
						{text.createAlbum}
					</Text>
					<Text className="text-slate-600 text-base">
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