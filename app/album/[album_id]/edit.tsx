import AlbumForm from "@/components/AlbumForm";
import { useAlbumForm } from "@/constant/AlbumFormProvider";
import { useSetting } from "@/constant/SettingProvider";
import { getAlbumById } from "@/lib/db";
import { Language } from "@/lib/lang";
import { type Album } from "@/types/album";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

const AlbumEditScreen = () => {
    const { album_id } = useLocalSearchParams();
    const [album, setAlbum] = useState<Album | null>(null);
    const { language, theme } = useSetting();
    const { isSubmitting, handleUpdateAlbum, handleCancel, getText } = useAlbumForm();
    const text = getText(language as Language);

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
     * Handle form submission with album ID and album data
     */
    const handleSubmit = async (data: any) => {
        if (!album_id) {
            throw new Error('Album ID is required');
        }
        await handleUpdateAlbum(data, album_id as string, album);
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