import AlbumForm from '@/components/AlbumForm';
import { useAlbumForm } from '@/constant/AlbumFormProvider';
import { useSetting } from '@/constant/SettingProvider';
import { Language } from '@/lib/lang';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

const CreateAlbumScreen = () => {
	// ============================================================================
	// STATE
	// ============================================================================
	const { album_id } = useLocalSearchParams();
	const { language, theme } = useSetting();
	const { isSubmitting, handleCreateSubAlbum, handleCancel, getText } = useAlbumForm();
	const text = getText(language as Language);

	// The album_id from the route is the parent album ID
	const parentAlbumId = album_id as string;

	// ============================================================================
	// HANDLERS
	// ============================================================================
	/**
	 * Handle form submission with parent album ID
	 */
	const handleSubmit = async (data: any) => {
		await handleCreateSubAlbum(data, parentAlbumId);
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