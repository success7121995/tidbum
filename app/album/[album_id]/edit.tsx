import AlbumForm from "@/components/AlbumForm";
import { useSetting } from "@/constant/SettingProvider";
import { getAlbumById, updateAlbum } from "@/lib/db";
import { getLanguageText, Language } from "@/lib/lang";
import { CreateAlbumFormData } from "@/lib/schema";
import { type Album } from "@/types/album";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

const AlbumEditScreen = () => {
    const { album_id } = useLocalSearchParams();
    const [album, setAlbum] = useState<Album | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { language, theme } = useSetting();
    const text = getLanguageText(language as Language);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    /**
     * Fetch album data
     */
    useFocusEffect(
        useCallback(() => {
            (async () => {
                if (album_id) {
                    const albumData = await getAlbumById(album_id as string);
                    setAlbum(albumData);
                }
            })();
        }, [album_id])
    );

    /**
     * Handle form submission
     */
    const handleSubmit = async (data: CreateAlbumFormData) => {
        setIsSubmitting(true);
        try {
            if (!album_id) {
                throw new Error('Album ID is required');
            }

            const updateData = {
                name: data.name,
                description: data.description,
                cover_asset_id: album?.cover_asset_id,
                parent_album_id: album?.parent_album_id,
            };

            await updateAlbum(album_id as string, updateData);

            // Navigate back
            router.back();
        } catch (error) {
            console.error('Error updating album:', error);
            Alert.alert(text.error, text.failedToSaveAlbum);
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

    if (!album) {
        return (
            <View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'} px-4 py-4`}>
                <Text>{text.loadingAlbum}</Text>
            </View>
        );
    }

    return (
        <View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>
            <ScrollView className="flex-1 px-6 py-6">
                {/* Header */}
                <View className="mb-8">
                    <Text className={`text-3xl font-bold ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
                        {text.editAlbum}
                    </Text> 
                    <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-base`}>
                        {text.updateAlbumDetails}
                    </Text>
                </View>

                {/* Form */}
                <AlbumForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isSubmitting={isSubmitting}
                    initialData={{
                        name: album.name,
                        description: album.description || '',
                    }}
                />
            </ScrollView>
        </View>
    );
};

export default AlbumEditScreen;