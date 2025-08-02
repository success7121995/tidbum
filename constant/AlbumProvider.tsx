import { deleteAlbum, insertAssets } from "@/lib/db";
import { getLanguageText, Language } from "@/lib/lang";
import { Album } from "@/types/album";
import { Asset } from "@/types/asset";
import { router } from "expo-router";
import { createContext, useCallback, useContext } from "react";
import { ActionSheetIOS } from "react-native";
import { useSetting } from "./SettingProvider";

// ============================================================================
// TYPES
// ============================================================================
interface AlbumContextType {
    fetchAlbums?: () => Promise<void>;
    handleEditAlbum?: (album: Album, parentAlbumId?: string) => void;
    handleDeleteAlbum?: (albumId: string) => void;
    handleCreateAlbum?: (album: Album) => void;
    handleAddAssets?: (albumId: string, parentAlbumId?: string, onMediaSelect?: () => void) => void;
    handleSelectAssets?: (albumId: string, assets: Asset[], onSuccess?: () => void) => Promise<void>;
    handleAlbumDeleteActionSheet?: (albumId: string, onSuccess?: () => void) => void;
    handleAlbumDelete?: (albumId: string, onSuccess?: () => void) => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================
const AlbumContext = createContext<AlbumContextType>({
    handleDeleteAlbum: () => {},
    handleEditAlbum: () => {},
    handleAddAssets: () => {},
    handleSelectAssets: async () => {},
    handleAlbumDeleteActionSheet: () => {},
    handleAlbumDelete: async () => {},
});

// ============================================================================
// HOOKS
// ============================================================================
export const useAlbum = () => {
    const context = useContext(AlbumContext);
    if (!context) {
        throw new Error("useAlbum must be used within an AlbumProvider");
    }
    return context;
};

// ============================================================================
// PROVIDER
// ============================================================================
const AlbumProvider = ({ children }: { children: React.ReactNode }) => {
    const { language } = useSetting();
    const text = getLanguageText(language as Language);

    /**
     * Fetch albums - placeholder for future implementation
     */
    const fetchAlbums = useCallback(async () => {
        // This is a placeholder - in a real implementation, you might want to
        // trigger a refresh of the album list from the home screen
        // For now, we'll just return a resolved promise
        return Promise.resolve();
    }, []);

    /**
     * Handle edit album
     * @param album - The album to edit
     * @param parentAlbumId - Optional parent album ID for sub-albums
     */
    const handleEditAlbum = useCallback((album: Album, parentAlbumId?: string) => {
        const pathname = parentAlbumId 
            ? '/album/[album_id]/edit'
            : '/album/[album_id]/edit';
        
        const params = {
            album_id: album.album_id || '',
            name: album.name,
            description: album.description || '',
            cover_asset_id: album.cover_asset_id || '',
        };

        router.push({
            pathname,
            params,
        });
    }, []);

    /**
     * Handle add assets
     * @param albumId - The album ID to add assets to
     * @param parentAlbumId - Optional parent album ID for sub-albums
     * @param onMediaSelect - Callback when user selects "Add media"
     */
    const handleAddAssets = useCallback((albumId: string, parentAlbumId?: string, onMediaSelect?: () => void) => {
        
        ActionSheetIOS.showActionSheetWithOptions({
            message: text.addMediaOrNewFolder,
            options: [text.addMedia, text.addNewFolder, text.cancel],
            cancelButtonIndex: 2,
        }, (selectedIndex) => {
            if (selectedIndex === 0) {
                // Call the callback to open media library
                if (onMediaSelect) {
                    onMediaSelect();
                }
            } else if (selectedIndex === 1) {
                if (parentAlbumId) {
                    router.push({
                        pathname: '/album/[album_id]/create-sub-album',
                        params: { album_id: parentAlbumId }
                    });
                } else {
                    router.push('/album/create');
                }
            }
        });
    }, []);

    /**
     * Handle select assets
     * @param albumId - The album ID to insert assets into
     * @param assets - Array of assets to insert
     * @param onSuccess - Optional callback after successful insertion
     */
    const handleSelectAssets = useCallback(async (albumId: string, assets: Asset[], onSuccess?: () => void) => {
        try {
            await insertAssets(albumId, assets);
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error inserting assets:', error);
        }
    }, []);

    /**
     * Handle album delete action sheet
     * @param albumId - The album ID to delete
     * @param onSuccess - Optional callback after successful deletion
     */
    const handleAlbumDeleteActionSheet = useCallback((albumId: string, onSuccess?: () => void) => {
        ActionSheetIOS.showActionSheetWithOptions({
            message: 'Are you sure you want to delete this album? This action cannot be undone.',
            options: ['Delete', 'Cancel'],
            destructiveButtonIndex: 0,
            cancelButtonIndex: 1,
        }, (selectedIndex) => {
            if (selectedIndex === 0) {
                handleAlbumDelete(albumId, onSuccess);
            }
        });
    }, []);

    /**
     * Handle album delete
     * @param albumId - The album ID to delete
     * @param onSuccess - Optional callback after successful deletion
     */
    const handleAlbumDelete = useCallback(async (albumId: string, onSuccess?: () => void) => {
        try {
            await deleteAlbum(albumId);
            if (onSuccess) {
                onSuccess();
            } else {
                router.back();
            }
        } catch (error) {
            console.error('Error deleting album:', error);
        }
    }, []);

    return (
        <AlbumContext.Provider value={{
            fetchAlbums,
            handleEditAlbum,
            handleAddAssets,
            handleSelectAssets,
            handleAlbumDeleteActionSheet,
            handleAlbumDelete,
        }}>
            {children}
        </AlbumContext.Provider>
    );
};

export default AlbumProvider;