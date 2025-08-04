import { getAlbumById, getParentAlbum, getTopLevelAlbums, moveAssetsToAlbum } from "@/lib/db";
import { Album } from "@/types/album";
import Feather from '@expo/vector-icons/Feather';
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSetting } from "../constant/SettingProvider";
import { getLanguageText, Language } from "../lib/lang";
import AlbumDirectory from "./AlbumDirectory";

interface AlbumsModalProps {
    onClose: () => void;
    visible: boolean;
    currentAlbumId: string;
    currentAlbumName: string;
    selectedAssetIds: string[];
    onAssetsMoved?: () => void;
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook for managing directory navigation within the modal
 */
const useDirectoryNavigation = (initialAlbumId: string, selectedAssetIds: string[], visible: boolean) => {
    const [currentDirectoryId, setCurrentDirectoryId] = useState(initialAlbumId);
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
    const isConfirmEnabled = useCallback(() => {
        
        if (!selectedTargetAlbum || selectedAssetIds.length === 0) {
            return false;
        }
        // Enable if selected album is different from the original album (where assets are coming from)
        return selectedTargetAlbum.album_id !== initialAlbumId;
    }, [selectedTargetAlbum, initialAlbumId, selectedAssetIds]);

    // Load data when directory changes
    useEffect(() => {
        if (currentDirectoryId) {
            loadDirectoryData(currentDirectoryId);
        }
    }, [currentDirectoryId, loadDirectoryData]);

    // Reset to initial album when modal opens
    useEffect(() => {
        if (visible) {
            setCurrentDirectoryId(initialAlbumId);
            // Automatically select the initial album as target
            const loadInitialAlbum = async () => {
                const album = await getAlbumById(initialAlbumId);
                if (album) {
                    setSelectedTargetAlbum(album);
                }
            };
            loadInitialAlbum();
        }
    }, [initialAlbumId, visible]);

    return {
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
        isConfirmEnabled: isConfirmEnabled(),
        reloadData: () => loadDirectoryData(currentDirectoryId)
    };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AlbumsModal = ({ 
    onClose, 
    visible, 
    currentAlbumId, 
    currentAlbumName, 
    selectedAssetIds,
    onAssetsMoved 
}: AlbumsModalProps) => {
    const { top, bottom } = useSafeAreaInsets();
    const { language, theme } = useSetting();
    const text = getLanguageText(language as Language);
    
    const {
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
        reloadData
    } = useDirectoryNavigation(currentAlbumId, selectedAssetIds, visible);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    /**
     * Handles the press event for an album.
     * @param album - The album to navigate to.
     */
    const handleAlbumPress = useCallback(async (album: Album) => {
        // Navigate into the album directory
        await navigateToDirectory(album.album_id!);
    }, [navigateToDirectory]);

    /**
     * Handles the press event for the parent album.
     */
    const handleParentPress = useCallback(async () => {
        await navigateToParent();
    }, [navigateToParent]);

    /**
     * Handles the selection of an album.
     * @param album - The album to select.
     */
    const handleAlbumSelect = useCallback((album: Album) => {
        // Select this album as the target for moving assets
        selectTargetAlbum(album);
    }, [selectTargetAlbum]);

    /**
     * Handles the confirmation of moving assets.
     */
    const handleConfirmMove = useCallback(async () => {
        if (!selectedTargetAlbum || !isConfirmEnabled) {
            return;
        }

        try {
            await moveAssetsToAlbum(selectedAssetIds, selectedTargetAlbum.album_id!);
            
            Alert.alert(
                text.success,
                `${selectedAssetIds.length} ${selectedAssetIds.length === 1 ? text.asset : text.assets} ${text.movedTo} "${selectedTargetAlbum.name}"`,
                [
                    {
                        text: text.ok,
                        onPress: () => {
                            onAssetsMoved?.();
                            onClose();
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error moving assets:', error);
            Alert.alert(
                text.error,
                text.moveAssetsError,
                [{ text: text.ok }]
            );
        }
    }, [selectedTargetAlbum, selectedAssetIds, isConfirmEnabled, text, onAssetsMoved, onClose]);

    /**
     * Handles the press event for the overlay.
     */
    const handleOverlayPress = useCallback(() => {
        onClose();
    }, [onClose]);

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <Modal
            visible={visible}
            onRequestClose={onClose}
            transparent={true}
            animationType="slide"
        >
            <View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`} style={{ paddingTop: top }}>
                {/* Header */}
                <View className={`flex-row items-center justify-between px-4 py-3`}>
                    <View className="flex-1">
                        <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} text-lg font-semibold`}>
                            {text.moveToAlbum}
                        </Text>
                        <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-sm`}>
                            {currentDirectory?.name || currentAlbumName}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
                    >
                        <Feather name="x" size={20} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView className={`flex-1 ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
                    {isLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color={theme === 'dark' ? '#60A5FA' : '#3B82F6'} />
                            <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mt-4`}>
                                {text.loading}
                            </Text>
                        </View>
                    ) : (
                        <AlbumDirectory
                            parentAlbum={parentAlbum}
                            subAlbums={subAlbums}
                            topLevelAlbums={topLevelAlbums}
                            currentAlbumId={currentDirectoryId}
                            selectedTargetAlbum={selectedTargetAlbum}
                            onAlbumPress={handleAlbumPress}
                            onParentPress={handleParentPress}
                            onAlbumSelect={handleAlbumSelect}
                        />
                    )}
                </ScrollView>

                {/* Bottom Bar */}
                <View className={`px-4 py-3 ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`} style={{ paddingBottom: bottom + 12 }}>
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-sm`}>
                            {selectedAssetIds.length} {selectedAssetIds.length === 1 ? text.asset : text.assets} {text.selected}
                        </Text>
                        {selectedTargetAlbum && (
                            <Text className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} text-sm font-medium`}>
                                {text.movingTo}: {selectedTargetAlbum.name}
                            </Text>
                        )}
                    </View>
                    
                    <View className="flex-row space-x-3">
                        <TouchableOpacity
                            onPress={onClose}
                            className={`flex-1 py-3 rounded-xl border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                        >
                            <Text className={`text-center font-medium ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>
                                {text.cancel}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={handleConfirmMove}
                            disabled={!isConfirmEnabled}
                            className={`flex-1 py-3 rounded-xl ${isConfirmEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <Text className={`text-center font-medium ${isConfirmEnabled ? 'text-white' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {text.confirm}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Overlay for closing */}
                <TouchableOpacity
                    className="absolute inset-0"
                    activeOpacity={1}
                    onPress={handleOverlayPress}
                    style={{ zIndex: -1 }}
                />
            </View>
        </Modal>
    );
};

export default AlbumsModal; 