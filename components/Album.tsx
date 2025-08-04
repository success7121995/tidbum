import { deleteSelectedAssets as deleteSelectedAssetsFromDb } from "@/lib/db";
import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionSheetIOS, Dimensions, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGesture } from "../constant/GestureProvider";
import { useSetting } from "../constant/SettingProvider";
import { getLanguageText, Language } from "../lib/lang";
import { type Album } from "../types/album";
import AlbumCard from "./AlbumCard";
import AssetGrid from "./AssetGrid";
import AssetItem from "./AssetItem";
import SelectionModeBottomBar from "./SelectionModeBottomBar";
import SubAlbumsSection from "./SubAlbumsSection";

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
// MAIN COMPONENT
// ============================================================================
const AlbumWithAssets = ({ album, onAssetPress, onSelectionChange, onAssetsUpdate }: AlbumProps) => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [assets, setAssets] = useState<Asset[]>(album.assets || []);
    const [subAlbums, setSubAlbums] = useState<Album[]>(album.subAlbums || []);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollOffsetX, setScrollOffsetX] = useState(0);
    const [scrollOffsetY, setScrollOffsetY] = useState(0);
    
    // Selection state
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    
    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<{ type: 'asset' | 'album', index: number } | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
    
    const needsParentUpdate = useRef(false);
    const pendingAssetsUpdate = useRef<Asset[] | null>(null);
    const prevAssetsRef = useRef<Asset[]>([]);

    // ============================================================================
    // CONTEXT
    // ============================================================================
    const { language, theme } = useSetting();
    const text = getLanguageText(language as Language);
    const insets = useSafeAreaInsets();
    const { 
        createSwipeSelectionPanResponder, 
        createDragAndDropGesture
    } = useGesture();

    // ============================================================================
    // ANIMATED VALUES
    // ============================================================================
    const draggedItemType = useSharedValue<'asset' | 'album' | null>(null);
    const draggedItemIndex = useSharedValue(-1);

    // ============================================================================
    // SELECTION MANAGEMENT FUNCTIONS
    // ============================================================================
    const enterSelectionMode = useCallback((assetId: string) => {
        setIsSelectionMode(true);
        setSelectedAssetIds(new Set([assetId]));
        const selectedAsset = assets.find(asset => asset.id === assetId);
        if (selectedAsset) {
            onSelectionChange?.([selectedAsset]);
        }
    }, [assets, onSelectionChange]);

    const exitSelectionMode = useCallback(() => {
        setIsSelectionMode(false);
        setSelectedAssetIds(new Set());
        onSelectionChange?.([]);
    }, [onSelectionChange]);

    const toggleAssetSelection = useCallback((assetId: string) => {
        if (!isSelectionMode) return;

        setSelectedAssetIds(prev => {
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

    const clearSelection = useCallback(() => {
        setSelectedAssetIds(new Set());
        setIsSelectionMode(false);
        onSelectionChange?.([]);
    }, [onSelectionChange]);

    // ============================================================================
    // DRAG AND DROP MANAGEMENT FUNCTIONS
    // ============================================================================
    const resetDragState = useCallback(() => {
        setDraggedItem(null);
        setDropTargetIndex(null);
    }, []);

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
        console.log('Share selected assets:', Array.from(selectedAssetIds));
    }, [selectedAssetIds]);

    /**
     * Handle the more options of selected assets
     */
    const handleMoreOptions = useCallback(() => {
        // Placeholder for more options
        console.log('More options for selected assets:', Array.from(selectedAssetIds));
    }, [selectedAssetIds]);

    /**
     * Handle the deletion of selected assets
     */
    const handleDeleteSelectedAssets = useCallback(() => {
        if (selectedAssetIds.size === 0) return;

        ActionSheetIOS.showActionSheetWithOptions({
            message: text.deletingAssetMessage,
            options: [text.delete, text.cancel],
            destructiveButtonIndex: 0,
            cancelButtonIndex: 1,
        }, (buttonIndex) => {
            if (buttonIndex === 0) {
                handleDeleteSelectedAssetsFromDb(Array.from(selectedAssetIds));
            }
        });
    }, [selectedAssetIds, text]);

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
            
            clearSelection();
        } catch (error) {
            console.error('Error deleting selected assets:', error);
        }
    }, [onAssetsUpdate, clearSelection]);

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
     * The gesture handler for the grid
     */
    const gestureHandler = useMemo(() => {
        const gestureConfig = {
            numColumns,
            itemSize,
            gap,
            offsetY: insets.top + (isExpanded ? 430 : 250),
            offsetX: gap,
            scrollOffsetX,
            scrollOffsetY,
            componentType: 'album' as const,
            isExpanded,
            screenWidth,
            albumSectionHeight: subAlbums.length > 0 ? 100 : 0,
            albumItemHeight: 120,
            albumItemsPerRow: 3,
        };

        return createDragAndDropGesture(
            gestureConfig,
            assets,
            subAlbums,
            isSelectionMode,
            {
                onDragStart: (type: 'asset' | 'album', index: number) => {
                    draggedItemType.value = type;
                    draggedItemIndex.value = index;
                    setDraggedItem({ type, index });
                },
                onDragUpdate: (type: 'asset' | 'album', index: number | null) => {
                    setDropTargetIndex(index);
                },
                onDragEnd: (fromIndex: number, toIndex: number, type: 'asset' | 'album') => {
                    if (type === 'album') {
                        reorderAlbums(fromIndex, toIndex);
                    } else {
                        reorderAssets(fromIndex, toIndex);
                    }
                    
                    draggedItemType.value = null;
                    draggedItemIndex.value = -1;
                    resetDragState();
                },
            }
        );
    }, [
        isSelectionMode, 
        subAlbums.length, 
        assets.length, 
        isExpanded, 
        scrollOffsetX, 
        scrollOffsetY, 
        createDragAndDropGesture, 
        reorderAlbums, 
        reorderAssets,
        resetDragState
    ]);

    /**
     * The pan responder for the swipe selection
     */
    const swipeSelectionPanResponder = useMemo(() => {
        const gestureConfig = {
            numColumns,
            itemSize,
            gap,
            offsetY: insets.top + (isExpanded ? 350 : 250),
            offsetX: gap,
            scrollOffsetX,
            scrollOffsetY,
            componentType: 'album' as const,
            isExpanded,
        };

        return createSwipeSelectionPanResponder(
            gestureConfig,
            assets,
            selectedAssetIds,
            isScrolling,
            isSelectionMode,
            {
                onAssetToggle: (assetId: string, shouldSelect: boolean) => {
                    if (shouldSelect) {
                        if (!selectedAssetIds.has(assetId)) {
                            setSelectedAssetIds(prev => {
                                const newSet = new Set(prev);
                                newSet.add(assetId);
                                const selectedAssetsArray = assets.filter(asset => newSet.has(asset.id));
                                onSelectionChange?.(selectedAssetsArray);
                                return newSet;
                            });
                        }
                    } else {
                        if (selectedAssetIds.has(assetId)) {
                            setSelectedAssetIds(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(assetId);
                                const selectedAssetsArray = assets.filter(asset => newSet.has(asset.id));
                                onSelectionChange?.(selectedAssetsArray);
                                return newSet;
                            });
                        }
                    }
                },
                onHoverChange: (assetId: string | null) => {
                    // Hover state is handled by the gesture provider
                },
                onSwipeSelectingChange: (isSelecting: boolean) => {
                    // Swipe selecting state is handled by the gesture provider
                },
            }
        );
    }, [
        isSelectionMode, 
        selectedAssetIds, 
        assets, 
        isScrolling, 
        isExpanded, 
        scrollOffsetX, 
        scrollOffsetY, 
        createSwipeSelectionPanResponder, 
        onSelectionChange
    ]);

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
        const isSelected = selectedAssetIds.has(item.id);
        
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
                        enterSelectionMode(item.id);
                    } else {
                        toggleAssetSelection(item.id);
                    }
                }}
                isScrolling={isScrolling}
                isHovered={false} // Hover state is handled by gesture provider
            />
        );
    }, [
        draggedItem, 
        dropTargetIndex, 
        selectedAssetIds, 
        isSelectionMode, 
        toggleAssetSelection, 
        onAssetPress, 
        enterSelectionMode, 
        isScrolling
    ]);

    const keyExtractor = useCallback((item: Asset) => item.id, []);

    /**
     * Render a sub-album item
     * @param subAlbum - The sub-album to render
     * @param index - The index of the sub-album
     * @returns The rendered sub-album item
     */
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
            
            // Update selection state when assets change
            const newSelectedIds = new Set(selectedAssetIds);
            let hasChanges = false;
            
            for (const assetId of selectedAssetIds) {
                if (!currentAssets.some(asset => asset.id === assetId)) {
                    newSelectedIds.delete(assetId);
                    hasChanges = true;
                }
            }
            
            if (hasChanges) {
                const selectedAssetsArray = currentAssets.filter(asset => newSelectedIds.has(asset.id));
                onSelectionChange?.(selectedAssetsArray);
                
                if (newSelectedIds.size === 0) {
                    exitSelectionMode();
                }
            }
        }
        
        setSubAlbums(album.subAlbums || []);
    }, [album.album_id, album.assets, album.subAlbums, onSelectionChange, selectedAssetIds, exitSelectionMode]);
    
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

                        {/* Sub Albums Section */}
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
                        
                        {/* Asset Grid */}
                        <AssetGrid 
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
                            numColumns={numColumns}
                            gap={gap}
                        />
                    </View>

                    {/* Selection Mode Bottom Bar */}
                    <SelectionModeBottomBar 
                        selectedAssets={selectedAssetIds}
                        onDelete={handleDeleteSelectedAssets}
                        onMove={handleShareSelectedAssets}
                        onCancel={exitSelectionMode}
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
                        
                        <AssetGrid 
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
                            numColumns={numColumns}
                            gap={gap}
                        />
                    </Animated.View>
                </GestureDetector>
            )}
        </>
    );
};

export default AlbumWithAssets;