import { deleteSelectedAssets as deleteSelectedAssetsFromDb } from "@/lib/db";
import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionSheetIOS, Dimensions, FlatList, GestureResponderEvent, Image, PanResponder, PanResponderGestureState, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

// ============================================================================
// CONSTANTS
// ============================================================================
const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth >= 768;
const numColumns = isTablet ? 9 : 5;
const gap = 2;
const itemSize = (screenWidth - (gap * (numColumns + 1))) / numColumns;

// ============================================================================
// ASSET ITEM COMPONENT
// ============================================================================
const AssetItem = React.memo(({ 
    asset, 
    isSelected, 
    isCurrentlyDragged, 
    isDropTarget, 
    onPress, 
    onLongPress,
    isScrolling,
    isHovered
}: { 
    asset: Asset; 
    isSelected: boolean; 
    isCurrentlyDragged: boolean; 
    isDropTarget: boolean; 
    onPress: () => void; 
    onLongPress: () => void;
    isScrolling: boolean;
    isHovered: boolean;
}) => {
    const itemStyle = {
        width: itemSize,
        height: itemSize,
        position: 'relative' as const,
        opacity: isCurrentlyDragged ? 0.3 : 1,
        borderWidth: isDropTarget ? 2 : 0,
        borderColor: isDropTarget ? '#3B82F6' : 'transparent',
        borderRadius: isDropTarget ? 8 : 0,
        backgroundColor: isDropTarget ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    };

    return (
        <Animated.View>
            <TouchableOpacity
                style={itemStyle}
                onPress={isScrolling ? undefined : onPress}
                onLongPress={isScrolling ? undefined : onLongPress}
                activeOpacity={isScrolling ? 1 : 0.7}
                delayPressIn={150}
                delayLongPress={650}
                disabled={isScrolling}
            >
                <Image 
                    source={{ uri: asset.uri }} 
                    className="w-full h-full object-cover"
                />
                
                {isHovered && (
                    <View className="absolute inset-0 bg-opacity-30" />
                )}
                
                {asset.mediaType === 'video' && (
                    <View className="absolute top-1 right-1">
                        <View className="bg-black bg-opacity-50 rounded-full p-1">
                            <Feather name="play" size={12} color="white" />
                        </View>
                    </View>
                )}

                {isDropTarget && (
                    <View className="absolute inset-0 bg-opacity-30 rounded-lg items-center justify-center">
                        <View className="bg-blue-500 rounded-full p-2">
                            <Feather name="arrow-down" size={16} color="white" />
                        </View>
                    </View>
                )}

                {isSelected && (
                    <View className="absolute top-1 right-1">
                        <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white shadow-sm">
                            <Feather name="check" size={12} color="white" />
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
});



// ============================================================================
// SELECTION MODE BOTTOM BAR COMPONENT
// ============================================================================
const SelectionModeBottomBar = ({ 
    selectedAssets, 
    onDelete, 
    onShare, 
    onCancel, 
    onMore, 
    text, 
    theme 
}: {
    selectedAssets: Set<string>;
    onDelete: () => void;
    onShare: () => void;
    onCancel: () => void;
    onMore: () => void;
    text: any;
    theme: string;
}) => (
    <View className={`mb-3 px-4 py-3 ${theme === 'dark' ? 'bg-gray-900' : 'bg-black'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-800'}`}>
        <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={onShare} className="p-2">
                    <Feather name="share-2" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} className="p-2">
                    <Feather name="trash-2" size={24} color="white" />
                </TouchableOpacity>
            </View>
            
            <Text className="text-white font-medium text-base">
                {selectedAssets.size} {selectedAssets.size === 1 ? text.photo : text.photos} {text.selected}
            </Text>
            
            {/* Cancel Button */}
            <TouchableOpacity onPress={onCancel} className="p-2 px-8 bg-blue-500 rounded-full">
                <Text className="text-white font-medium text-base">
                    {text.cancel}
                </Text>
            </TouchableOpacity>
        </View>
    </View>
);

// ============================================================================
// SUB-ALBUMS SECTION COMPONENT
// ============================================================================
const SubAlbumsSection = ({ 
    subAlbums, 
    isExpanded, 
    onToggleExpand, 
    onAlbumDelete, 
    draggedItem, 
    dropTargetIndex, 
    renderSubAlbumItem, 
    text, 
    theme 
}: {
    subAlbums: Album[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onAlbumDelete: (albumId: string) => void;
    draggedItem: { type: 'asset' | 'album', index: number } | null;
    dropTargetIndex: number | null;
    renderSubAlbumItem: any;
    text: any;
    theme: string;
}) => {
    const albumListRef = useRef<FlatList>(null);

    if (!subAlbums || subAlbums.length === 0) return null;

    return (
        <View className="px-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
                <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} font-medium text-lg`}>
                    {text.folders} ({subAlbums.length}) 
                </Text>
                <TouchableOpacity onPress={onToggleExpand} className="p-2">
                    <Feather 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={theme === 'dark' ? '#cbd5e1' : '#64748b'} 
                    />
                </TouchableOpacity>
            </View>
            {isExpanded && (
                <FlatList
                    ref={albumListRef}
                    data={subAlbums}
                    renderItem={renderSubAlbumItem}
                    keyExtractor={(item) => item.album_id || ''}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                    removeClippedSubviews={false}
                    getItemLayout={(data, index) => ({
                        length: isTablet ? 160 : 140,
                        offset: (isTablet ? 160 : 140) * index,
                        index,
                    })}
                />
            )}
        </View>
    );
};

// ============================================================================
// ASSETS GRID COMPONENT
// ============================================================================
const AssetsGrid = ({ 
    assets, 
    renderAssetItem, 
    keyExtractor, 
    onScroll, 
    onScrollBeginDrag, 
    onScrollEndDrag, 
    onMomentumScrollBegin, 
    onMomentumScrollEnd, 
    swipeSelectionPanResponder, 
    text, 
    theme,
    isSelectionMode = false
}: {
    assets: Asset[];
    renderAssetItem: any;
    keyExtractor: (item: Asset) => string;
    onScroll: (event: any) => void;
    onScrollBeginDrag: () => void;
    onScrollEndDrag: () => void;
    onMomentumScrollBegin: () => void;
    onMomentumScrollEnd: () => void;
    swipeSelectionPanResponder: any;
    text: any;
    theme: string;
    isSelectionMode?: boolean;
}) => {
    const flatListRef = useRef<FlatList>(null);

    if (!assets || assets.length === 0) {
        return (
            <View className="flex-1 items-center justify-center px-4">
                <Feather name="image" size={48} color={theme === 'dark' ? '#cbd5e1' : '#64748b'} />
                <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-center mt-4`}>
                    {text.noMediaInAlbum}
                </Text>
                <Text className={`${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'} text-center text-sm mt-2`}>
                    {text.tapToAdd}
                </Text>
            </View>
        );
    }

    return (
        <>
            <View className="px-4 mb-3">
                <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} font-medium text-lg`}>
                    {text.media} ({assets.length})
                </Text>
            </View>
            <View 
                className="flex-1"
                {...(swipeSelectionPanResponder?.panHandlers || {})}
            >
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
                    contentContainerStyle={{ 
                        gap: gap, 
                        paddingHorizontal: gap,
                        paddingBottom: isSelectionMode ? 80 : 20
                    }}
                    scrollEventThrottle={16}
                    onScroll={onScroll}
                    onScrollBeginDrag={onScrollBeginDrag}
                    onScrollEndDrag={onScrollEndDrag}
                    onMomentumScrollBegin={onMomentumScrollBegin}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                />
            </View>
        </>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const AlbumWithAssets = ({ album, onAssetPress, onSelectionChange, onAssetsUpdate }: AlbumProps) => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [assets, setAssets] = useState<Asset[]>(album.assets || []);
    const [subAlbums, setSubAlbums] = useState<Album[]>(album.subAlbums || []);
    const [draggedItem, setDraggedItem] = useState<{ type: 'asset' | 'album', index: number } | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
    const [isExpanded, setIsExpanded] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isSwipeSelecting, setIsSwipeSelecting] = useState(false);
    const [currentHoverAssetId, setCurrentHoverAssetId] = useState<string | null>(null);
    const [initialAssetIndex, setInitialAssetIndex] = useState<number | null>(null);
    const [isDeselectGesture, setIsDeselectGesture] = useState<boolean | null>(null);
    const [lastProcessedIndex, setLastProcessedIndex] = useState<number | null>(null);
    const [gestureStartPosition, setGestureStartPosition] = useState<{ x: number; y: number } | null>(null);
    const [hasHorizontalMovement, setHasHorizontalMovement] = useState(false);
    const [hasVerticalMovement, setHasVerticalMovement] = useState(false);
    const [gestureLockedAsScroll, setGestureLockedAsScroll] = useState(false);
    const [scrollOffsetX, setScrollOffsetX] = useState(0);
    const [scrollOffsetY, setScrollOffsetY] = useState(0);
    const [toggledAssetIds, setToggledAssetIds] = useState<Set<string>>(new Set());
    
    const needsParentUpdate = useRef(false);
    const pendingAssetsUpdate = useRef<Asset[] | null>(null);
    const prevAssetsRef = useRef<Asset[]>([]);

    // ============================================================================
    // CONTEXT
    // ============================================================================
    const { language, theme } = useSetting();
    const text = getLanguageText(language as Language);
    const insets = useSafeAreaInsets();

    // ============================================================================
    // ANIMATED VALUES
    // ============================================================================
    const draggedItemType = useSharedValue<'asset' | 'album' | null>(null);
    const draggedItemIndex = useSharedValue(-1);

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    const getAssetIndicesBetween = useCallback((startIndex: number, endIndex: number) => {
        const indices: number[] = [];
        let actualStart = startIndex;
        let actualEnd = endIndex;
        if (startIndex > endIndex) {
            actualStart = endIndex;
            actualEnd = startIndex;
        }
        for (let i = actualStart; i <= actualEnd; i++) {
            indices.push(i);
        }
        return indices;
    }, []);

    const hasSufficientHorizontalMovement = useCallback((startPos: { x: number; y: number }, currentPos: { x: number; y: number }) => {
        const horizontalThreshold = 10;
        const dx = Math.abs(currentPos.x - startPos.x);
        const dy = Math.abs(currentPos.y - startPos.y);
        return dx >= horizontalThreshold && dx > dy * 0.5;
    }, []);

    /**
     * Check if there has been significant vertical movement (worklet) - used for the swipe selection functionality
     * @param startPos - The starting position
     * @param currentPos - The current position
     * @returns True if there has been significant vertical movement, false otherwise
     */
    const hasSignificantVerticalMovement = useCallback((startPos: { x: number; y: number }, currentPos: { x: number; y: number }) => {
        const verticalThreshold = 10;
        const dx = Math.abs(currentPos.x - startPos.x);
        const dy = Math.abs(currentPos.y - startPos.y);
        return dy >= verticalThreshold && dy > dx * 1.5;
    }, []);

    /**
     * Get the item at a position in the grid (worklet) - used for the swipe selection functionality
     * @param position - The position to get the item at
     * @returns The item at the position
     */
    const getItemAtPosition = useCallback((position: { x: number; y: number }) => {
        const adjustedX = position.x - gap + scrollOffsetX;
        const adjustedY = position.y - insets.top - (isExpanded ? 430 : 250) + scrollOffsetY;
        
        if (adjustedX < 0 || adjustedY < 0) return null;

        const column = Math.floor(adjustedX / (itemSize + gap));
        const row = Math.floor(adjustedY / (itemSize + gap));
        
        if (column < 0 || column >= numColumns || row < 0) return null;

        const index = row * numColumns + column;
        return assets[index] || null;
    }, [assets, scrollOffsetX, scrollOffsetY, insets.top]);

    const processDeterministicSelection = useCallback((currentIndex: number) => {
        if (initialAssetIndex === null || isDeselectGesture === null) return;
        
        const indicesToProcess = getAssetIndicesBetween(initialAssetIndex, currentIndex);
        
        indicesToProcess.forEach(index => {
            if (index >= 0 && index < assets.length) {
                const asset = assets[index];
                const assetId = asset.id;
                
                if (!toggledAssetIds.has(assetId)) {
                    const isCurrentlySelected = selectedAssets.has(assetId);
                    
                    if (isDeselectGesture) {
                        if (isCurrentlySelected) {
                            setSelectedAssets(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(assetId);
                                return newSet;
                            });
                        }
                    } else {
                        if (!isCurrentlySelected) {
                            setSelectedAssets(prev => new Set([...prev, assetId]));
                        }
                    }
                    
                    setToggledAssetIds(prev => new Set([...prev, assetId]));
                }
            }
        });
        
        setLastProcessedIndex(currentIndex);
    }, [initialAssetIndex, isDeselectGesture, assets, selectedAssets, toggledAssetIds, getAssetIndicesBetween]);

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================
    /**
     * Handle the scrolling of the grid
     * @param event - The event object
     */
    const handleScroll = useCallback((event: any) => {
        const { contentOffset } = event.nativeEvent;
        setScrollOffsetY(contentOffset.y);
        setScrollOffsetX(contentOffset.x || 0);
    }, []);

    /**
     * Handle the deletion of an album
     * @param albumId - The ID of the album to delete
     */
    const handleAlbumDelete = async (albumId: string) => {
        const newSubAlbums = subAlbums.filter((album) => album.album_id !== albumId);
        setSubAlbums(newSubAlbums);
        
        try {
            const key = `album_expand_${albumId}`;
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing expand state:', error);
        }
    };

    /**
     * Handle the sharing of selected assets
     */
    const handleShareSelectedAssets = useCallback(() => {
        // Placeholder for share functionality
        console.log('Share selected assets:', Array.from(selectedAssets));
    }, [selectedAssets]);

    /**
     * Handle the more options of selected assets
     */
    const handleMoreOptions = useCallback(() => {
        // Placeholder for more options
        console.log('More options for selected assets:', Array.from(selectedAssets));
    }, [selectedAssets]);

    /**
     * Enter selection mode and select the asset
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
     */
    const exitSelectionMode = useCallback(() => {
        setIsSelectionMode(false);
        setSelectedAssets(new Set());
        onSelectionChange?.([]);
    }, [onSelectionChange]);

    /**
     * Toggle the selection of an asset
     * @param assetId - The ID of the asset to toggle
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
            
            const selectedAssetsArray = assets.filter(asset => newSet.has(asset.id));
            onSelectionChange?.(selectedAssetsArray);
            
            return newSet;
        });
    }, [isSelectionMode, assets, onSelectionChange]);

    /**
     * Handle the deletion of selected assets
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
     * Handle the deletion of selected assets from the database
     * @param assetIds - The IDs of the assets to delete
     */
    const handleDeleteSelectedAssetsFromDb = useCallback(async (assetIds: string[]) => {
        try {
            const deletedAssetIds = await deleteSelectedAssetsFromDb(assetIds);

            setAssets(prevAssets => {
                const updatedAssets = prevAssets.filter(asset => !deletedAssetIds.includes(asset.id));
                onAssetsUpdate?.(updatedAssets);
                return updatedAssets;
            });
            
            setSelectedAssets(new Set());
            setIsSelectionMode(false);
            onSelectionChange?.([]);
        } catch (error) {
            console.error('Error deleting selected assets:', error);
        }
    }, [onSelectionChange, onAssetsUpdate]);

    /**
     * Handle the expansion and collapse of sub-albums
     */
    const handleSubAlbumExpandCollapse = useCallback(async () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);
        
        try {
            const key = `album_expand_${album.album_id}`;
            await AsyncStorage.setItem(key, JSON.stringify(newExpandedState));
        } catch (error) {
            console.error('Error saving expand state:', error);
        }
    }, [isExpanded, album.album_id]);

    /**
     * Reorder the assets in the grid
     * @param fromIndex - The index of the asset to move
     * @param toIndex - The index to move the asset to
     */
    const reorderAssets = useCallback((fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        
        setAssets(prevAssets => {
            const newAssets = [...prevAssets];
            const [draggedAsset] = newAssets.splice(fromIndex, 1);
            newAssets.splice(toIndex, 0, draggedAsset);
            
            pendingAssetsUpdate.current = newAssets;
            needsParentUpdate.current = true;
            
            return newAssets;
        });
        
        setDraggedItem(prev => prev ? { ...prev, index: toIndex } : null);
    }, []);

    /**
     * Reorder the albums in the sub-albums section
     * @param fromIndex - The index of the album to move
     * @param toIndex - The index to move the album to
     */
    const reorderAlbums = useCallback((fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        
        setSubAlbums(prevAlbums => {
            const newAlbums = [...prevAlbums];
            const [draggedItem] = newAlbums.splice(fromIndex, 1);
            newAlbums.splice(toIndex, 0, draggedItem);
            return newAlbums;
        });
        
        setDraggedItem(prev => prev ? { ...prev, index: toIndex } : null);
    }, []);

    // ============================================================================
    // GESTURE HANDLERS
    // ============================================================================
    /**
     * Get the position of an item in the grid (worklet) - used for the drag and drop functionality
     * @param x - The x coordinate of the item
     * @param y - The y coordinate of the item
     * @param itemListLength - The length of the item list
     * @returns The index of the item in the grid
     */
    const getGridPositionWorklet = useCallback((x: number, y: number, itemListLength: number): number | null => {
        'worklet';
        const adjustedX = x - gap + scrollOffsetX;
        const adjustedY = y + (isExpanded ? -70 : 120) + scrollOffsetY;
        
        if (adjustedX < 0 || adjustedY < 0) return null;

        const column = Math.floor(adjustedX / (itemSize + gap));
        const row = Math.floor(adjustedY / (itemSize + gap));
        
        if (column < 0 || column >= numColumns || row < 0) return null;

        const index = row * numColumns + column;
        
        if (index >= 0 && index < itemListLength) {
            return index;
        }
        return null;
    }, [scrollOffsetX, scrollOffsetY]);

    /**
     * Set the dragged item (worklet)
     * @param item - The item to set
     */
    const setDraggedItemJS = useCallback((item: { type: 'asset' | 'album', index: number } | null) => {
        setDraggedItem(item);
    }, []);

    /**
     * Set the drop target index (worklet)
     * @param index - The index to set
     */
    const setDropTargetIndexJS = useCallback((index: number | null) => {
        setDropTargetIndex(index);
    }, []);

    /**
     * The gesture handler for the grid
     */
    const gestureHandler = useMemo(() => Gesture.Pan()
        .onStart((event) => {
            'worklet';
            if (isSelectionMode) return;
            
            const touchX = event.x;
            const touchY = event.y;
            
            const albumSectionHeight = subAlbums.length > 0 ? 100 : 0;
            const isInAlbumSection = touchY < albumSectionHeight;
            
            if (isInAlbumSection && subAlbums.length > 0) {
                const albumIndex = Math.floor(touchY / 120) * 3 + Math.floor(touchX / (screenWidth / 3));
                if (albumIndex >= 0 && albumIndex < subAlbums.length) {
                    draggedItemType.value = 'album';
                    draggedItemIndex.value = albumIndex;
                    runOnJS(setDraggedItemJS)({ type: 'album', index: albumIndex });
                }
            } else {
                const assetIndex = getGridPositionWorklet(touchX, touchY - 200, assets.length);
                if (assetIndex !== null && assetIndex >= 0 && assetIndex < assets.length) {
                    draggedItemType.value = 'asset';
                    draggedItemIndex.value = assetIndex;
                    runOnJS(setDraggedItemJS)({ type: 'asset', index: assetIndex });
                }
            }
        })
        .onUpdate((event) => {
            'worklet';
            if (isSelectionMode) return;
            
            const currentDraggedType = draggedItemType.value;
            const currentDraggedIndex = draggedItemIndex.value;
            
            if (currentDraggedType === null || currentDraggedIndex === -1) return;
            
            const currentX = event.x;
            const currentY = event.y;
            
            if (currentDraggedType === 'album') {
                const albumIndex = Math.floor(currentY / 120) * 3 + Math.floor(currentX / (screenWidth / 3));
                if (albumIndex >= 0 && albumIndex < subAlbums.length && albumIndex !== currentDraggedIndex) {
                    runOnJS(setDropTargetIndexJS)(albumIndex);
                } else {
                    runOnJS(setDropTargetIndexJS)(null);
                }
            } else {
                const assetIndex = getGridPositionWorklet(currentX, currentY - 200, assets.length);
                if (assetIndex !== null && assetIndex >= 0 && assetIndex < assets.length && assetIndex !== currentDraggedIndex) {
                    runOnJS(setDropTargetIndexJS)(assetIndex);
                } else {
                    runOnJS(setDropTargetIndexJS)(null);
                }
            }
        })
        .onEnd((event) => {
            'worklet';
            if (isSelectionMode) return;
            
            const currentDraggedType = draggedItemType.value;
            const currentDraggedIndex = draggedItemIndex.value;
            
            if (currentDraggedType === null || currentDraggedIndex === -1) return;
            
            const dropX = event.x;
            const dropY = event.y;
            
            if (currentDraggedType === 'album') {
                const albumIndex = Math.floor(dropY / 120) * 3 + Math.floor(dropX / (screenWidth / 3));
                if (albumIndex >= 0 && albumIndex < subAlbums.length && albumIndex !== currentDraggedIndex) {
                    runOnJS(reorderAlbums)(currentDraggedIndex, albumIndex);
                }
            } else {
                const assetIndex = getGridPositionWorklet(dropX, dropY - 200, assets.length);
                if (assetIndex !== null && assetIndex >= 0 && assetIndex < assets.length && assetIndex !== currentDraggedIndex) {
                    runOnJS(reorderAssets)(currentDraggedIndex, assetIndex);
                }
            }
            
            draggedItemType.value = null;
            draggedItemIndex.value = -1;
            runOnJS(setDraggedItemJS)(null);
            runOnJS(setDropTargetIndexJS)(null);
        }), [isSelectionMode, subAlbums.length, assets.length, setDraggedItemJS, setDropTargetIndexJS, getGridPositionWorklet, reorderAlbums, reorderAssets]);

    /**
     * The pan responder for the swipe selection
     */
    const swipeSelectionPanResponder = useMemo(() => {
        if (!isSelectionMode) return null;

        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                return !isScrolling && (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10);
            },
            onPanResponderGrant: (evt: GestureResponderEvent) => {
                const startPosition = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
                setGestureStartPosition(startPosition);
                
                setToggledAssetIds(new Set());
                setInitialAssetIndex(null);
                setIsDeselectGesture(null);
                setLastProcessedIndex(null);
                setHasHorizontalMovement(false);
                setHasVerticalMovement(false);
                setGestureLockedAsScroll(false);
                
                setIsSwipeSelecting(false);
            },
            onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                if (!gestureStartPosition) return;

                const currentPosition = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
                
                if (gestureLockedAsScroll) return;
                
                if (!hasVerticalMovement) {
                    const hasVertical = hasSignificantVerticalMovement(gestureStartPosition, currentPosition);
                    setHasVerticalMovement(hasVertical);
                    
                    if (hasVertical) {
                        setGestureLockedAsScroll(true);
                        setIsSwipeSelecting(false);
                        return;
                    }
                }
                
                if (!hasHorizontalMovement) {
                    const hasHorizontal = hasSufficientHorizontalMovement(gestureStartPosition, currentPosition);
                    setHasHorizontalMovement(hasHorizontal);
                    
                    if (hasHorizontal) {
                        setIsSwipeSelecting(true);
                        
                        const initialAsset = getItemAtPosition(gestureStartPosition);
                        if (initialAsset) {
                            const initialIndex = assets.indexOf(initialAsset);
                            setInitialAssetIndex(initialIndex);
                            
                            const isCurrentlySelected = selectedAssets.has(initialAsset.id);
                            setIsDeselectGesture(isCurrentlySelected);
                            
                            processDeterministicSelection(initialIndex);
                        }
                    }
                    return;
                }
                
                if (!isSwipeSelecting) return;
                
                const currentAsset = getItemAtPosition(currentPosition);
                setCurrentHoverAssetId(currentAsset?.id || null);
                
                if (currentAsset) {
                    const currentIndex = assets.indexOf(currentAsset);
                    processDeterministicSelection(currentIndex);
                }
            },
            onPanResponderRelease: () => {
                setIsSwipeSelecting(false);
                setToggledAssetIds(new Set());
                setInitialAssetIndex(null);
                setIsDeselectGesture(null);
                setLastProcessedIndex(null);
                setHasHorizontalMovement(false);
                setHasVerticalMovement(false);
                setGestureLockedAsScroll(false);
                setGestureStartPosition(null);
                setCurrentHoverAssetId(null);
            },
            onPanResponderTerminate: () => {
                setIsSwipeSelecting(false);
                setToggledAssetIds(new Set());
                setInitialAssetIndex(null);
                setIsDeselectGesture(null);
                setLastProcessedIndex(null);
                setHasHorizontalMovement(false);
                setHasVerticalMovement(false);
                setGestureLockedAsScroll(false);
                setGestureStartPosition(null);
                setCurrentHoverAssetId(null);
            },
        });
    }, [isSelectionMode, isScrolling, selectedAssets, assets, hasSufficientHorizontalMovement, hasSignificantVerticalMovement, getItemAtPosition, processDeterministicSelection, gestureStartPosition, gestureLockedAsScroll, hasHorizontalMovement, hasVerticalMovement, isSwipeSelecting]);

    // ============================================================================
    // RENDERERS
    // ============================================================================
    /**
     * Render an asset item
     * @param item - The asset to render
     * @param index - The index of the asset
     * @returns The rendered asset item
     */
    const renderAssetItem = useCallback(({ item, index }: { item: Asset; index: number }) => {
        const isCurrentlyDragged = draggedItem?.type === 'asset' && draggedItem.index === index;
        const isDropTarget = dropTargetIndex === index && !isCurrentlyDragged && draggedItem?.type === 'asset';
        const isSelected = selectedAssets.has(item.id);
        const isHovered = currentHoverAssetId === item.id;
        
        return (
            <AssetItem 
                asset={item} 
                isSelected={isSelected}
                isCurrentlyDragged={isCurrentlyDragged}
                isDropTarget={isDropTarget}
                onPress={() => {
                    if (isSelectionMode) {
                        toggleAssetSelection(item.id);
                    } else {
                        onAssetPress?.(item);
                    }
                }}
                onLongPress={() => {
                    if (!isSelectionMode) {
                        enterSelectionModeAndSelect(item.id);
                    } else {
                        toggleAssetSelection(item.id);
                    }
                }}
                isScrolling={isScrolling}
                isHovered={isHovered}
            />
        );
    }, [draggedItem, dropTargetIndex, selectedAssets, isSelectionMode, toggleAssetSelection, onAssetPress, enterSelectionModeAndSelect, isScrolling, currentHoverAssetId]);

    const keyExtractor = useCallback((item: Asset) => item.id, []);

    const SubAlbumItem = useMemo(() => {
        return ({ subAlbum, index }: { subAlbum: Album; index: number }) => {
            const isCurrentlyDragged = draggedItem?.type === 'album' && draggedItem.index === index;
            const isDropTarget = dropTargetIndex === index && !isCurrentlyDragged && draggedItem?.type === 'album';
            
            return (
                <View className="px-1" style={{ width: isTablet ? 140 : 120 }}>
                    <Animated.View style={{ height: 'auto' }}>
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

                            {isDropTarget && (
                                <View className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg items-center justify-center">
                                    <View className="bg-blue-500 rounded-full p-2">
                                        <Feather name="arrow-down" size={16} color="white" />
                                    </View>
                                </View>
                            )}

                            {isCurrentlyDragged && (
                                <View className="absolute bottom-2 left-2">
                                    <View className="bg-blue-500 bg-opacity-80 rounded-full p-1">
                                        <Feather name="move" size={12} color="white" />
                                    </View>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </View>
            );
        };
    }, [isTablet, draggedItem, dropTargetIndex, handleAlbumDelete]);

    const renderSubAlbumItem = useMemo(() => {
        return ({ item, index }: { item: Album; index: number }) => (
            <SubAlbumItem subAlbum={item} index={index} />
        );
    }, [SubAlbumItem]);

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useEffect(() => {
        const currentAssets = album.assets || [];
        const prevAssets = prevAssetsRef.current;
        
        const assetsChanged = currentAssets.length !== prevAssets.length || 
            currentAssets.some((asset, index) => asset.id !== prevAssets[index]?.id);
        
        if (assetsChanged) {
            setAssets(currentAssets);
            prevAssetsRef.current = currentAssets;
            
            setSelectedAssets(prev => {
                const newSet = new Set(prev);
                let hasChanges = false;
                
                for (const assetId of prev) {
                    if (!currentAssets.some(asset => asset.id === assetId)) {
                        newSet.delete(assetId);
                        hasChanges = true;
                    }
                }
                
                if (hasChanges) {
                    const selectedAssetsArray = currentAssets.filter(asset => newSet.has(asset.id));
                    onSelectionChange?.(selectedAssetsArray);
                    
                    if (newSet.size === 0) {
                        setIsSelectionMode(false);
                    }
                }
                
                return newSet;
            });
        }
        
        setSubAlbums(album.subAlbums || []);
    }, [album.album_id, album.assets, album.subAlbums, onSelectionChange]);
    
    useEffect(() => {
        if (needsParentUpdate.current && pendingAssetsUpdate.current) {
            onAssetsUpdate?.(pendingAssetsUpdate.current);
            needsParentUpdate.current = false;
            pendingAssetsUpdate.current = null;
        }
    });
    
    useEffect(() => {
        const loadExpandState = async () => {
            try {
                const key = `album_expand_${album.album_id}`;
                const savedState = await AsyncStorage.getItem(key);
                if (savedState !== null) {
                    setIsExpanded(JSON.parse(savedState));
                }
            } catch (error) {
                console.error('Error loading expand state:', error);
            }
        };
        
        loadExpandState();
    }, [album.album_id]);
    
    useEffect(() => {
        draggedItemType.value = null;
        draggedItemIndex.value = -1;
    }, [album.album_id]);
    
    useEffect(() => {
        return () => {
            draggedItemType.value = null;
            draggedItemIndex.value = -1;
        };
    }, []);

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <>
            {isSelectionMode ? (
                <Animated.View className="flex-1">
                    <View className="flex-1">
                        <SubAlbumsSection 
                            subAlbums={subAlbums}
                            isExpanded={isExpanded}
                            onToggleExpand={handleSubAlbumExpandCollapse}
                            onAlbumDelete={handleAlbumDelete}
                            draggedItem={draggedItem}
                            dropTargetIndex={dropTargetIndex}
                            renderSubAlbumItem={renderSubAlbumItem}
                            text={text}
                            theme={theme}
                        />
                        
                        <AssetsGrid 
                            assets={assets}
                            renderAssetItem={renderAssetItem}
                            keyExtractor={keyExtractor}
                            onScroll={handleScroll}
                            onScrollBeginDrag={() => setIsScrolling(true)}
                            onScrollEndDrag={() => setIsScrolling(false)}
                            onMomentumScrollBegin={() => setIsScrolling(true)}
                            onMomentumScrollEnd={() => setIsScrolling(false)}
                            swipeSelectionPanResponder={swipeSelectionPanResponder}
                            text={text}
                            theme={theme}
                            isSelectionMode={true}
                        />
                    </View>

                    <SelectionModeBottomBar 
                        selectedAssets={selectedAssets}
                        onDelete={handleDeleteSelectedAssets}
                        onShare={handleShareSelectedAssets}
                        onCancel={exitSelectionMode}
                        onMore={handleMoreOptions}
                        text={text}
                        theme={theme}
                    />
                </Animated.View>
            ) : (
                <GestureDetector gesture={gestureHandler}>
                    <Animated.View className="flex-1 pb-5">
                        <SubAlbumsSection 
                            subAlbums={subAlbums}
                            isExpanded={isExpanded}
                            onToggleExpand={handleSubAlbumExpandCollapse}
                            onAlbumDelete={handleAlbumDelete}
                            draggedItem={draggedItem}
                            dropTargetIndex={dropTargetIndex}
                            renderSubAlbumItem={renderSubAlbumItem}
                            text={text}
                            theme={theme}
                        />
                        
                        <AssetsGrid 
                            assets={assets}
                            renderAssetItem={renderAssetItem}
                            keyExtractor={keyExtractor}
                            onScroll={handleScroll}
                            onScrollBeginDrag={() => setIsScrolling(true)}
                            onScrollEndDrag={() => setIsScrolling(false)}
                            onMomentumScrollBegin={() => setIsScrolling(true)}
                            onMomentumScrollEnd={() => setIsScrolling(false)}
                            swipeSelectionPanResponder={null}
                            text={text}
                            theme={theme}
                            isSelectionMode={false}
                        />
                    </Animated.View>
                </GestureDetector>
            )}
        </>
    );
};

export default AlbumWithAssets;