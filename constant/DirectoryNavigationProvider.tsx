import { getAlbumById, getParentAlbum, getTopLevelAlbums } from "@/lib/db";
import { Album } from "@/types/album";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface DirectoryNavigationContextType {
    currentDirectoryId: string;
    currentDirectory: Album | null;
    parentAlbum: Album | null;
    subAlbums: Album[];
    topLevelAlbums: Album[];
    isLoading: boolean;
    selectedTargetAlbum: Album | null;
    navigateToDirectory: (albumId: string) => Promise<void>;
    selectTargetAlbum: (album: Album) => void;
    navigateToParent: () => Promise<void>;
    isConfirmEnabled: (initialAlbumId: string, selectedAssetIds: string[]) => boolean;
    reloadData: () => Promise<void>;
    resetToInitialAlbum: (albumId: string) => Promise<void>;
    refreshAlbumData: (affectedAlbumIds: string[]) => Promise<void>;
}

const DirectoryNavigationContext = createContext<DirectoryNavigationContextType | undefined>(undefined);

export const useDirectoryNavigation = () => {
    const context = useContext(DirectoryNavigationContext);
    if (!context) {
        throw new Error('useDirectoryNavigation must be used within a DirectoryNavigationProvider');
    }
    return context;
};

const DirectoryNavigationProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentDirectoryId, setCurrentDirectoryId] = useState('');
    const [currentDirectory, setCurrentDirectory] = useState<Album | null>(null);
    const [parentAlbum, setParentAlbum] = useState<Album | null>(null);
    const [subAlbums, setSubAlbums] = useState<Album[]>([]);
    const [topLevelAlbums, setTopLevelAlbums] = useState<Album[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTargetAlbum, setSelectedTargetAlbum] = useState<Album | null>(null);

    const loadDirectoryData = useCallback(async (albumId: string) => {
        setIsLoading(true);
        try {
            // Load current directory with sub-albums
            const album = await getAlbumById(albumId);
            setCurrentDirectory(album);
            setSubAlbums(album?.subAlbums || []);

            // Load parent album if exists
            const parent = await getParentAlbum(albumId);
            setParentAlbum(parent);

            // If no parent album, load top-level albums
            if (!parent) {
                const topAlbums = await getTopLevelAlbums();
                setTopLevelAlbums(topAlbums);
            } else {
                setTopLevelAlbums([]);
            }
        } catch (error) {
            console.error('Error loading directory data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Navigate to a new directory
    const navigateToDirectory = useCallback(async (albumId: string) => {
        setCurrentDirectoryId(albumId);
        // Automatically select the new directory as target
        const album = await getAlbumById(albumId);
        if (album) {
            setSelectedTargetAlbum(album);
        }
    }, []);

    // Select a target album for moving assets
    const selectTargetAlbum = useCallback((album: Album) => {
        setSelectedTargetAlbum(album);
    }, []);

    // Navigate to parent directory
    const navigateToParent = useCallback(async () => {
        if (parentAlbum) {
            await navigateToDirectory(parentAlbum.album_id!);
        }
    }, [parentAlbum, navigateToDirectory]);

    // Check if confirm button should be enabled
    const isConfirmEnabled = useCallback((initialAlbumId: string, selectedAssetIds: string[]) => {
        if (!selectedTargetAlbum || selectedAssetIds.length === 0) {
            return false;
        }
        // Enable if selected album is different from the original album (where assets are coming from)
        return selectedTargetAlbum.album_id !== initialAlbumId;
    }, [selectedTargetAlbum]);

    // Reload current directory data
    const reloadData = useCallback(async () => {
        if (currentDirectoryId) {
            await loadDirectoryData(currentDirectoryId);
        }
    }, [currentDirectoryId, loadDirectoryData]);

    // Reset to initial album
    const resetToInitialAlbum = useCallback(async (albumId: string) => {
        setCurrentDirectoryId(albumId);
        // Automatically select the initial album as target
        const album = await getAlbumById(albumId);
        if (album) {
            setSelectedTargetAlbum(album);
        }
    }, []);

    // Refresh album data when assets are moved
    const refreshAlbumData = useCallback(async (affectedAlbumIds: string[]) => {
        try {
            
            // Always reload current directory data to ensure fresh data
            if (currentDirectoryId) {
                await loadDirectoryData(currentDirectoryId);
            }

            // Check if parent album is affected and reload it
            if (parentAlbum && affectedAlbumIds.includes(parentAlbum.album_id!)) {
                const updatedParent = await getParentAlbum(currentDirectoryId);
                setParentAlbum(updatedParent);
            }

            // Check if any sub-albums are affected
            const affectedSubAlbums = subAlbums.filter(album => 
                affectedAlbumIds.includes(album.album_id!)
            );
            if (affectedSubAlbums.length > 0) {
                // Reload current directory data to get updated sub-albums with new totalAssets
                await loadDirectoryData(currentDirectoryId);
            }

            // Check if any top-level albums are affected
            const affectedTopLevelAlbums = topLevelAlbums.filter(album => 
                affectedAlbumIds.includes(album.album_id!)
            );
            if (affectedTopLevelAlbums.length > 0) {
                // Reload top-level albums with updated totalAssets
                const updatedTopAlbums = await getTopLevelAlbums();
                setTopLevelAlbums(updatedTopAlbums);
            }

            // Check if selected target album is affected
            if (selectedTargetAlbum && affectedAlbumIds.includes(selectedTargetAlbum.album_id!)) {
                const updatedTargetAlbum = await getAlbumById(selectedTargetAlbum.album_id!);
                if (updatedTargetAlbum) {
                    setSelectedTargetAlbum(updatedTargetAlbum);
                }
            }

            // If we're in a sub-album and the parent is affected, reload parent data
            if (parentAlbum && affectedAlbumIds.includes(parentAlbum.album_id!)) {
                const updatedParent = await getParentAlbum(currentDirectoryId);
                setParentAlbum(updatedParent);
            }
            

        } catch (error) {
            console.error('Error refreshing album data:', error);
        }
    }, [currentDirectoryId, parentAlbum, subAlbums, topLevelAlbums, selectedTargetAlbum, loadDirectoryData]);

    // Load data when directory changes
    useEffect(() => {
        if (currentDirectoryId) {
            loadDirectoryData(currentDirectoryId);
        }
    }, [currentDirectoryId, loadDirectoryData]);

    return (
        <DirectoryNavigationContext.Provider value={{
            currentDirectoryId,
            currentDirectory,
            parentAlbum,
            subAlbums,
            topLevelAlbums,
            isLoading,
            selectedTargetAlbum,
            navigateToDirectory,
            selectTargetAlbum,
            navigateToParent,
            isConfirmEnabled,
            reloadData,
            resetToInitialAlbum,
            refreshAlbumData,
        }}>
            {children}
        </DirectoryNavigationContext.Provider>
    );
};

// Add displayName to fix the error
DirectoryNavigationProvider.displayName = 'DirectoryNavigationProvider';

export default DirectoryNavigationProvider;
