import { deleteSelectedAssets as deleteSelectedAssetsFromDb } from "@/lib/db";
import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import React, { useCallback, useRef, useState } from "react";
import { ActionSheetIOS, Dimensions, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from "react-native-reanimated";
import { useSetting } from "../constant/SettingProvider";
import { getLanguageText, Language } from "../lib/lang";
import { type Album } from "../types/album";
import AlbumCard from "./AlbumCard";

interface AlbumProps {
    album: Album;
    onAssetPress?: (asset: Asset) => void;
    onSelectionChange?: (selectedAssets: Asset[]) => void;
    onAssetsUpdate?: (updatedAssets: Asset[]) => void;
}

const AlbumWithAssets = ({ album, onAssetPress, onSelectionChange, onAssetsUpdate }: AlbumProps) => {
    // ============================================================================
    // CONSTANTS
    // ============================================================================
    const screenWidth = Dimensions.get('window').width;
    const isTablet = screenWidth >= 768;
    const numColumns = isTablet ? 9 : 5;
    const gap = 2; // 2px gap between items
    const itemSize = (screenWidth - (gap * (numColumns + 1))) / numColumns; // Account for gaps

    // ============================================================================
    // STATE
    // ============================================================================
    const [assets, setAssets] = useState<Asset[]>(album.assets || []);
    const [subAlbums, setSubAlbums] = useState<Album[]>(album.subAlbums || []);
    const [draggedItem, setDraggedItem] = useState<{ type: 'asset' | 'album', index: number } | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

    // ============================================================================
    // CONTEXT
    // ============================================================================
    const { language } = useSetting();
    const text = getLanguageText(language as Language);

    // ============================================================================
    // ANIMATED VALUES
    // ============================================================================
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const zIndex = useSharedValue(0);
    const draggedItemOpacity = useSharedValue(1);
    const draggedItemType = useSharedValue<'asset' | 'album' | null>(null);
    const draggedItemIndex = useSharedValue(-1);

    // ============================================================================
    // REFS
    // ============================================================================
    const flatListRef = useRef<FlatList>(null);
    const albumListRef = useRef<FlatList>(null);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    /**
     * Handle album delete
     * @param albumId - The ID of the album to delete
     */
    const handleAlbumDelete = (albumId: string) => {
        const newSubAlbums = subAlbums.filter((album) => album.album_id !== albumId);
        setSubAlbums(newSubAlbums);
    };

    /**
     * Enter selection mode and select an asset
     * @param assetId - The ID of the asset to select
     */
    const enterSelectionModeAndSelect = useCallback((assetId: string) => {
        setIsSelectionMode(true);
        setSelectedAssets(new Set([assetId]));
        const selectedAsset = assets.find(asset => asset.id === assetId);
        if (selectedAsset) {
            onSelectionChange?.([selectedAsset]);
        }
    }, [assets, onSelectionChange]);

    /**
     * Exit selection mode
     * @returns void
     */
    const exitSelectionMode = useCallback(() => {
        setIsSelectionMode(false);
        setSelectedAssets(new Set());
        onSelectionChange?.([]);
    }, [onSelectionChange]);

    /**
     * Toggle asset selection
     */
    const toggleAssetSelection = useCallback((assetId: string) => {
        if (!isSelectionMode) return;

        setSelectedAssets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(assetId)) {
                newSet.delete(assetId);
            } else {
                newSet.add(assetId);
            }
            
            // Convert Set to Array for callback
            const selectedAssetsArray = assets.filter(asset => newSet.has(asset.id));
            onSelectionChange?.(selectedAssetsArray);
            
            return newSet;
        });
    }, [isSelectionMode, assets, onSelectionChange]);

    /**
     * Handle delete selected assets
     */
    const handleDeleteSelectedAssets = useCallback(() => {
        if (selectedAssets.size === 0) return;

        ActionSheetIOS.showActionSheetWithOptions({
            message: text.deletingAssetMessage,
            options: [text.delete, text.cancel],
            destructiveButtonIndex: 0,
            cancelButtonIndex: 1,
        }, (buttonIndex) => {
                         if (buttonIndex === 0) {
                 handleDeleteSelectedAssetsFromDb(Array.from(selectedAssets));
             }
        });
    }, [selectedAssets, text]);

        /**
     * Delete selected assets
     * @param assetIds - The asset IDs to delete
     */
    const handleDeleteSelectedAssetsFromDb = useCallback(async (assetIds: string[]) => {
        try {
            const deletedAssetIds = await deleteSelectedAssetsFromDb(assetIds);

            // Remove selected assets from the local state
            setAssets(prevAssets => prevAssets.filter(asset => !deletedAssetIds.includes(asset.id)));
            
            // Clear selection and exit selection mode
            setSelectedAssets(new Set());
            setIsSelectionMode(false);
            onSelectionChange?.([]);
            onAssetsUpdate?.(assets.filter(asset => !deletedAssetIds.includes(asset.id)));
        } catch (error) {
            console.error('Error deleting selected assets:', error);
        }
    }, [onSelectionChange, onAssetsUpdate, assets]);

    /**
     * Calculate grid position from screen coordinates (worklet compatible)
     */
    const getGridPositionWorklet = useCallback((x: number, y: number, itemListLength: number): number | null => {
        'worklet';
        const padding = gap;
        const adjustedX = x - padding;
        const adjustedY = y - padding;
        
        const col = Math.floor(adjustedX / (itemSize + gap));
        const row = Math.floor(adjustedY / (itemSize + gap));
        
        const index = row * numColumns + col;
        
        if (index >= 0 && index < itemListLength) {
            return index;
        }
        return null;
    }, [itemSize, gap, numColumns]);

    /**
     * Reorder assets array
     */
    const reorderAssets = useCallback((fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        
        setAssets(prevAssets => {
            const newAssets = [...prevAssets];
            const [draggedItem] = newAssets.splice(fromIndex, 1);
            newAssets.splice(toIndex, 0, draggedItem);
            return newAssets;
        });
        
        // Update the dragged index to the new position
        setDraggedItem(prev => prev ? { ...prev, index: toIndex } : null);
    }, []);

    /**
     * Reorder albums array
     */
    const reorderAlbums = useCallback((fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        
        setSubAlbums(prevAlbums => {
            const newAlbums = [...prevAlbums];
            const [draggedItem] = newAlbums.splice(fromIndex, 1);
            newAlbums.splice(toIndex, 0, draggedItem);
            return newAlbums;
        });
        
        // Update the dragged index to the new position
        setDraggedItem(prev => prev ? { ...prev, index: toIndex } : null);
    }, []);

    /**
     * Wrapper functions for runOnJS
     */
    const setDraggedItemJS = useCallback((item: { type: 'asset' | 'album', index: number } | null) => {
        setDraggedItem(item);
    }, []);

    const setDropTargetIndexJS = useCallback((index: number | null) => {
        setDropTargetIndex(index);
    }, []);

    const setIsDraggingJS = useCallback((dragging: boolean) => {
        setIsDragging(dragging);
    }, []);

    /**
     * Handle gesture events
     */
    const gestureHandler = Gesture.Pan()
        .onStart((event) => {
            'worklet';
            const touchX = event.x;
            const touchY = event.y;
            
            // More accurate album section detection
            // Check if touch is in the albums section (first 300px or so)
            const albumSectionHeight = subAlbums.length > 0 ? 300 : 0;
            const isInAlbumSection = touchY < albumSectionHeight;
            
            if (isInAlbumSection && subAlbums.length > 0) {
                // Touch is in album section - use simpler grid calculation for albums
                const albumIndex = Math.floor(touchY / 120) * 3 + Math.floor(touchX / (screenWidth / 3));
                if (albumIndex >= 0 && albumIndex < subAlbums.length) {
                    draggedItemType.value = 'album';
                    draggedItemIndex.value = albumIndex;
                    runOnJS(setDraggedItemJS)({ type: 'album', index: albumIndex });
                    runOnJS(setDropTargetIndexJS)(albumIndex);
                    runOnJS(setIsDraggingJS)(true);
                    
                    // Animate the dragged item
                    scale.value = withSpring(1.1);
                    zIndex.value = 1000;
                    draggedItemOpacity.value = withTiming(0.3);
                }
            } else {
                // Touch is in assets section
                const assetIndex = getGridPositionWorklet(touchX, touchY - albumSectionHeight, assets.length);
                if (assetIndex !== null) {
                    draggedItemType.value = 'asset';
                    draggedItemIndex.value = assetIndex;
                    runOnJS(setDraggedItemJS)({ type: 'asset', index: assetIndex });
                    runOnJS(setDropTargetIndexJS)(assetIndex);
                    runOnJS(setIsDraggingJS)(true);
                    
                    // Animate the dragged item
                    scale.value = withSpring(1.1);
                    zIndex.value = 1000;
                    draggedItemOpacity.value = withTiming(0.3);
                }
            }
        })
        .onUpdate((event) => {
            'worklet';
            translateX.value = event.translationX;
            translateY.value = event.translationY;
            
            const currentDraggedType = draggedItemType.value;
            const currentDraggedIndex = draggedItemIndex.value;
            
            if (currentDraggedType === null || currentDraggedIndex === -1) return;
            
            const currentX = event.x;
            const currentY = event.y;
            const albumSectionHeight = subAlbums.length > 0 ? 300 : 0;
            
            if (currentDraggedType === 'album') {
                // Dragging album - use simpler grid calculation
                const albumIndex = Math.floor(currentY / 120) * 3 + Math.floor(currentX / (screenWidth / 3));
                if (albumIndex >= 0 && albumIndex < subAlbums.length && albumIndex !== currentDraggedIndex) {
                    runOnJS(setDropTargetIndexJS)(albumIndex);
                    runOnJS(reorderAlbums)(currentDraggedIndex, albumIndex);
                    draggedItemIndex.value = albumIndex;
                }
            } else {
                // Dragging asset - only allow dropping in asset section
                const assetIndex = getGridPositionWorklet(currentX, currentY - albumSectionHeight, assets.length);
                if (assetIndex !== null && assetIndex !== currentDraggedIndex) {
                    runOnJS(setDropTargetIndexJS)(assetIndex);
                    runOnJS(reorderAssets)(currentDraggedIndex, assetIndex);
                    draggedItemIndex.value = assetIndex;
                }
            }
        })
        .onEnd(() => {
            'worklet';
            // Reset animations
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            scale.value = withSpring(1);
            zIndex.value = 0;
            draggedItemOpacity.value = withTiming(1);
            
            // Reset shared values
            draggedItemType.value = null;
            draggedItemIndex.value = -1;
            
            // Reset state
            runOnJS(setDraggedItemJS)(null);
            runOnJS(setDropTargetIndexJS)(null);
            runOnJS(setIsDraggingJS)(false);
        });

    // ============================================================================
    // ANIMATED STYLES
    // ============================================================================

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
            zIndex: zIndex.value,
        };
    });

    // ============================================================================
    // RENDERERS
    // ============================================================================

    /**
     * Render individual asset item
     * @param asset - The asset to render
     * @param index - The index of the asset
     * @returns The rendered asset item
     */
    const AssetItem = useCallback(({ asset, index }: { asset: Asset; index: number }) => {
        const isCurrentlyDragged = draggedItem?.type === 'asset' && draggedItem.index === index;
        const isDropTarget = dropTargetIndex === index && !isCurrentlyDragged && draggedItem?.type === 'asset';
        const isSelected = selectedAssets.has(asset.id);
        
        const itemStyle = {
            width: itemSize,
            height: itemSize,
            position: 'relative' as const,
            opacity: isCurrentlyDragged ? 0.3 : 1,
            borderWidth: isDropTarget ? 2 : 0,
            borderColor: isDropTarget ? '#3B82F6' : 'transparent',
            borderRadius: isDropTarget ? 8 : 0,
        };

        return (
            <Animated.View style={isCurrentlyDragged ? animatedStyle : undefined}>
                <TouchableOpacity
                    style={itemStyle}
                    onPress={() => {
                        if (isSelectionMode) {
                            toggleAssetSelection(asset.id);
                        } else {
                            onAssetPress?.(asset);
                        }
                    }}
                    onLongPress={() => {
                        if (!isSelectionMode) {
                            enterSelectionModeAndSelect(asset.id);
                        } else {
                            toggleAssetSelection(asset.id);
                        }
                    }}
                    activeOpacity={0.7}
                >
                    <Image 
                        source={{ uri: asset.uri }} 
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Video indicator */}
                    {asset.mediaType === 'video' && (
                        <View className="absolute top-1 right-1">
                            <View className="bg-black bg-opacity-50 rounded-full p-1">
                                <Feather name="play" size={12} color="white" />
                            </View>
                        </View>
                    )}

                    {/* Selection indicator - MediaLibrary style */}
                    {isSelected && (
                        <View className="absolute top-1 right-1">
                            <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white shadow-sm">
                                <Feather name="check" size={12} color="white" />
                            </View>
                        </View>
                    )}

                    {/* Drop target indicator */}
                    {isDropTarget && (
                        <View className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg items-center justify-center">
                            <View className="bg-blue-500 rounded-full p-2">
                                <Feather name="arrow-down" size={16} color="white" />
                            </View>
                        </View>
                    )}

                    {/* Drag indicator for dragged item */}
                    {isCurrentlyDragged && (
                        <View className="absolute bottom-2 left-2">
                            <View className="bg-blue-500 bg-opacity-80 rounded-full p-1">
                                <Feather name="move" size={12} color="white" />
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    }, [itemSize, onAssetPress, draggedItem, dropTargetIndex, animatedStyle, isSelectionMode, selectedAssets, toggleAssetSelection, enterSelectionModeAndSelect]);

    /**
     * Render asset item for FlatList
     * @param item - The item to render
     * @param index - The index of the item
     * @returns The rendered asset item
     */
    const renderAssetItem = useCallback(({ item, index }: { item: Asset; index: number }) => (
        <AssetItem asset={item} index={index} />
    ), [AssetItem]);

    /**
     * Key extractor for FlatList
     * @param item - The item to extract the key from
     * @returns The key of the item
     */
    const keyExtractor = useCallback((item: Asset) => item.id, []);

    /**
     * Render sub-album item
     * @param subAlbum - The sub-album to render
     * @param index - The index of the sub-album
     * @returns The rendered sub-album item
     */
    const SubAlbumItem = useCallback(({ subAlbum, index }: { subAlbum: Album; index: number }) => {
        const isCurrentlyDragged = draggedItem?.type === 'album' && draggedItem.index === index;
        const isDropTarget = dropTargetIndex === index && !isCurrentlyDragged && draggedItem?.type === 'album';
        
        return (
            <Animated.View 
                style={isCurrentlyDragged ? animatedStyle : undefined}
                className={`${isTablet ? 'w-1/5' : 'w-1/3'} px-1 mb-4`}
            >
                <View style={{
                    opacity: isCurrentlyDragged ? 0.3 : 1,
                    borderWidth: isDropTarget ? 2 : 0,
                    borderColor: isDropTarget ? '#3B82F6' : 'transparent',
                    borderRadius: isDropTarget ? 8 : 0,
                }}>
                    <AlbumCard
                        album={subAlbum}
                        onDelete={handleAlbumDelete}
                    />
                    
                    {/* Drop target indicator */}
                    {isDropTarget && (
                        <View className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg items-center justify-center">
                            <View className="bg-blue-500 rounded-full p-2">
                                <Feather name="arrow-down" size={16} color="white" />
                            </View>
                        </View>
                    )}

                    {/* Drag indicator for dragged item */}
                    {isCurrentlyDragged && (
                        <View className="absolute bottom-2 left-2">
                            <View className="bg-blue-500 bg-opacity-80 rounded-full p-1">
                                <Feather name="move" size={12} color="white" />
                            </View>
                        </View>
                    )}
                </View>
            </Animated.View>
        );
    }, [isTablet, draggedItem, dropTargetIndex, animatedStyle]);

    /**
     * Render sub-album item for FlatList
     * @param item - The item to render
     * @param index - The index of the item
     * @returns The rendered sub-album item
     */
    const renderSubAlbumItem = useCallback(({ item, index }: { item: Album; index: number }) => (
        <SubAlbumItem subAlbum={item} index={index} />
    ), [SubAlbumItem]);

    return (
        <GestureDetector gesture={gestureHandler}>
            <Animated.View className="flex-1">
                {/* Selection mode header - MediaLibrary style */}
                {isSelectionMode && (
                    <View className="px-4 py-3 bg-white border-b border-gray-200">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-gray-900 font-medium text-lg">
                                {selectedAssets.size} {selectedAssets.size === 1 ? text.item : text.items} {text.selected}
                            </Text>

                            {/* Button Group */}
                            <View className="flex-row items-center gap-2">
                                {/* Delete Button */}
                                <TouchableOpacity 
                                    onPress={handleDeleteSelectedAssets}
                                    className="px-4 py-2 bg-red-500 rounded-lg"
                                >
                                    <Text className="text-white font-medium">{text.delete}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    onPress={exitSelectionMode}
                                    className="px-4 py-2 bg-blue-500 rounded-lg"
                                >
                                    <Text className="text-white font-medium">{text.cancel}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Sub-albums */}
                {subAlbums && subAlbums.length > 0 && (
                    <View className="px-4 mb-4">
                        <Text className="text-lg font-semibold text-gray-900 mb-3">
                            {text.folders} ({subAlbums.length})
                        </Text>
                        <FlatList
                            ref={albumListRef}
                            data={subAlbums}
                            renderItem={renderSubAlbumItem}
                            keyExtractor={(item) => item.album_id || ''}
                            numColumns={numColumns}
                            columnWrapperStyle={{ 
                                justifyContent: 'flex-start',
                                gap: 2
                            }}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            removeClippedSubviews={false}
                            getItemLayout={(data, index) => ({
                                length: 200, // Approximate height of each item
                                offset: 200 * Math.floor(index / numColumns),
                                index,
                            })}
                            />
                    </View>
                )}

                {/* Assets Grid */}
                {assets && assets.length > 0 ? (
                    <>
                        <View className="px-4 mb-3">
                            <Text className="text-lg font-semibold text-gray-900">
                                {text.media} ({assets.length})
                            </Text>
                        </View>
                        <FlatList
                            ref={flatListRef}
                            className="flex-1"
                            data={assets}
                            numColumns={numColumns}
                            renderItem={renderAssetItem}
                            keyExtractor={keyExtractor}
                            showsVerticalScrollIndicator={false}
                            removeClippedSubviews={true}
                            maxToRenderPerBatch={20}
                            windowSize={10}
                            initialNumToRender={20}
                            columnWrapperStyle={{ gap: gap }}
                            contentContainerStyle={{ gap: gap, paddingHorizontal: gap }}
                        />
                    </>
                ) : (
                    <View className="flex-1 items-center justify-center px-4">
                        <Feather name="image" size={48} color="#D1D5DB" />
                        <Text className="text-gray-500 text-center mt-4">
                            {text.noMediaInAlbum}
                        </Text>
                        <Text className="text-gray-400 text-center text-sm mt-2">
                            {text.tapToAdd}
                        </Text>
                    </View>
                )}
            </Animated.View>
        </GestureDetector>
    );
};

export default AlbumWithAssets;