import { Language } from '@/lib/lang';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import AlbumForm from '../../components/AlbumForm';
import { useAlbumForm } from '../../constant/AlbumFormProvider';
import { useSetting } from '../../constant/SettingProvider';

const CreateAlbumScreen = () => {
	// ============================================================================
	// STATE
	// ============================================================================
	const { language, theme } = useSetting();
	const { isSubmitting, handleCreateAlbum, handleCancel, getText } = useAlbumForm();
	const text = getText(language as Language);

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
					onSubmit={handleCreateAlbum}
					onCancel={handleCancel}
					isSubmitting={isSubmitting}
				/>
			</ScrollView>
		</View>
	);
};

export default CreateAlbumScreen;