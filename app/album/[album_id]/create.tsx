import AlbumForm from '@/components/AlbumForm';
import { createAlbum } from '@/lib/db';
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
				parent_album_id: album_id as string,
			});

			if (!subAlbumId) {
				throw new Error('Failed to create album');
			}

			router.replace({
				pathname: '/album/[album_id]/[sub_album_id]',
				params: {
					album_id: album_id as string,
					sub_album_id: subAlbumId,
					refresh: 'true',
				},
			});
		} catch (error) {
			Alert.alert('Error', 'Failed to create album. Please try again.');
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
		<View className="flex-1 bg-white">
			<ScrollView className="flex-1 px-6 py-6">
				{/* Header */}
				<View className="mb-8">
					<Text className="text-3xl font-bold text-slate-800 mb-2">
						Create Album
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