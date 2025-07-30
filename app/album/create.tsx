import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import AlbumForm from '../../components/AlbumForm';
import { CreateAlbumFormData } from '../../lib/schema';

const CreateAlbumScreen = () => {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Handle form submission
     * @param data 
     */
	const handleSubmit = async (data: CreateAlbumFormData) => {
		setIsSubmitting(true);
		try {
			// TODO: Implement album creation logic here
			console.log('Creating album:', data);
			
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			Alert.alert(
				'Success!',
				'Album created successfully',
				[
					{
						text: 'OK',
						onPress: () => {
							router.back();
						}
					}
				]
			);
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

	return (
		<View className="flex-1 bg-white">
			<ScrollView className="flex-1 px-6 py-6">
				{/* Header */}
				<View className="mb-8">
					<Text className="text-3xl font-bold text-slate-800 mb-2">
						Create Album
					</Text>
					<Text className="text-slate-600 text-base">
						Organize your photos and videos into beautiful albums
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