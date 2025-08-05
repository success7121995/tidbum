import { router } from "expo-router";
import { createContext, useContext, useState } from "react";
import { Alert } from "react-native";
import { createAlbum, updateAlbum } from "../lib/db";
import { getLanguageText, Language } from "../lib/lang";
import { CreateAlbumFormData } from "../lib/schema";
import { Album } from "../types/album";
import { useSetting } from "./SettingProvider";

interface AlbumFormContextType {
    isSubmitting: boolean;
    setIsSubmitting: (submitting: boolean) => void;
    handleCreateAlbum: (data: CreateAlbumFormData) => Promise<void>;
    handleCreateSubAlbum: (data: CreateAlbumFormData, parentAlbumId: string) => Promise<void>;
    handleUpdateAlbum: (data: CreateAlbumFormData, albumId: string, album?: Album | null) => Promise<void>;
    handleCancel: () => void;
    getText: (language: Language) => any;
}

const AlbumFormContext = createContext<AlbumFormContextType | undefined>(undefined);

export const useAlbumForm = () => {
    const context = useContext(AlbumFormContext);
    if (!context) {
        throw new Error('useAlbumForm must be used within an AlbumFormProvider');
    }
    return context;
};



const AlbumFormProvider = ({ children }: { children: React.ReactNode }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { language } = useSetting();

    const getText = (lang: Language) => getLanguageText(lang);

    /**
     * Handle create album form submission
     */
    const handleCreateAlbum = async (data: CreateAlbumFormData) => {
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
            const text = getText(language as Language);
            Alert.alert(text.error, text.failedToCreateAlbum);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handle create sub-album form submission
     */
    const handleCreateSubAlbum = async (data: CreateAlbumFormData, parentAlbumId: string) => {
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
            const text = getText(language as Language);
            Alert.alert(text.error, text.failedToCreateAlbum);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handle update album form submission
     */
    const handleUpdateAlbum = async (data: CreateAlbumFormData, albumId: string, album?: Album | null) => {
        setIsSubmitting(true);
        try {
            const updateData = {
                name: data.name,
                description: data.description,
                cover_uri: album?.cover_uri,
                parent_album_id: album?.parent_album_id,
            };

            await updateAlbum(albumId, updateData);

            // Navigate back - AlbumScreen will refresh data on focus
            router.back();
        } catch (error) {
            console.error('Error updating album:', error);
            const text = getText(language as Language);
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

    return (
        <AlbumFormContext.Provider value={{
            isSubmitting,
            setIsSubmitting,
            handleCreateAlbum,
            handleCreateSubAlbum,
            handleUpdateAlbum,
            handleCancel,
            getText,
        }}>
            {children}
        </AlbumFormContext.Provider>
    );
};

export default AlbumFormProvider;   