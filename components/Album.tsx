import { deleteSelectedAssets as deleteSelectedAssetsFromDb } from "@/lib/db";
import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionSheetIOS, Dimensions, FlatList, GestureResponderEvent, Image, PanResponder, PanResponderGestureState, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from "react-native-reanimated";
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

/**
 * Asset item component - moved outside to prevent recreation
 */
const AssetItem = React.memo(({ 
    asset, 
    index, 
    isSelected, 
    isCurrentlyDragged, 
    isDropTarget, 
    onPress, 
    onLongPress,
    itemSize,
    animatedStyle,
    isScrolling,
    isHovered
}: { 
    asset: Asset; 
    index: number; 
    isSelected: boolean; 
    isCurrentlyDragged: boolean; 
    isDropTarget: boolean; 
    onPress: () => void; 
    onLongPress: () => void;
    itemSize: number;
    animatedStyle: any;
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
    };

    return (
        <Animated.View style={isCurrentlyDragged ? animatedStyle : undefined}>
            <TouchableOpacity
                style={itemStyle}
                onPress={isScrolling ? undefined : onPress}
                onLongPress={isScrolling ? undefined : onLongPress}
                activeOpacity={isScrolling ? 1 : 0.7}
                delayPressIn={150}
                delayLongPress={500}
                disabled={isScrolling}
            >
                <Image 
                    source={{ uri: asset.uri }} 
                    className="w-full h-full object-cover"
                />
                
                {/* Hover overlay for visual feedback */}
                {isHovered && (
                    <View className="absolute inset-0 bg-blue-500 bg-opacity-30" />
                )}
                
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
});

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
    const [isExpanded, setIsExpanded] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isSwipeSelecting, setIsSwipeSelecting] = useState(false);
    const [lastSwipePosition, setLastSwipePosition] = useState<{ x: number; y: number } | null>(null);
    const [toggledAssetIds, setToggledAssetIds] = useState<Set<string>>(new Set());
    const [lastProcessedAssetId, setLastProcessedAssetId] = useState<string | null>(null);
    const [currentHoverAssetId, setCurrentHoverAssetId] = useState<string | null>(null);
    const [initialAssetIndex, setInitialAssetIndex] = useState<number | null>(null);
    const [isDeselectGesture, setIsDeselectGesture] = useState<boolean | null>(null);
    const [lastProcessedIndex, setLastProcessedIndex] = useState<number | null>(null);
    const [gestureStartPosition, setGestureStartPosition] = useState<{ x: number; y: number } | null>(null);
    const [hasHorizontalMovement, setHasHorizontalMovement] = useState(false);
    const [hasVerticalMovement, setHasVerticalMovement] = useState(false);
    const [gestureLockedAsScroll, setGestureLockedAsScroll] = useState(false);
    const [scrollOffset, setScrollOffset] = useState(0);

    // ============================================================================
    // CONTEXT
    // ============================================================================
    const { language, theme } = useSetting();
    const text = getLanguageText(language as Language);
    const insets = useSafeAreaInsets();

    // ============================================================================
    // EFFECTS
    // ============================================================================
    
    // Sync local state with album prop changes
    useEffect(() => {
        const currentAssets = album.assets || [];
        const prevAssets = prevAssetsRef.current;
        
        // Check if assets have actually changed
        const assetsChanged = currentAssets.length !== prevAssets.length || 
            currentAssets.some((asset, index) => asset.id !== prevAssets[index]?.id);
        
        if (assetsChanged) {
            setAssets(currentAssets);
            prevAssetsRef.current = currentAssets;
            
            // Clear selection if selected assets are no longer in the list
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
                    // Update selection callback
                    const selectedAssetsArray = currentAssets.filter(asset => newSet.has(asset.id));
                    onSelectionChange?.(selectedAssetsArray);
                    
                    // Exit selection mode if no assets are selected
                    if (newSet.size === 0) {
                        setIsSelectionMode(false);
                    }
                }
                
                return newSet;
            });
        }
        
        setSubAlbums(album.subAlbums || []);
    }, [album.album_id, album.assets, album.subAlbums, onSelectionChange]); // Added onSelectionChange to dependencies
    
    // Load expand state from AsyncStorage when album changes
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
    
    // Reset animated values when album changes
    useEffect(() => {
        translateX.value = 0;
        translateY.value = 0;
        scale.value = 1;
        zIndex.value = 0;
        draggedItemOpacity.value = 1;
        draggedItemType.value = null;
        draggedItemIndex.value = -1;
    }, [album.album_id]);
    
    // Cleanup animated values on unmount
    useEffect(() => {
        return () => {
            translateX.value = 0;
            translateY.value = 0;
            scale.value = 1;
            zIndex.value = 0;
            draggedItemOpacity.value = 1;
            draggedItemType.value = null;
            draggedItemIndex.value = -1;
        };
    }, []);

    // ============================================================================
    // REFS
    // ============================================================================
    const flatListRef = useRef<FlatList>(null);
    const albumListRef = useRef<FlatList>(null);
    const prevAssetsRef = useRef<Asset[]>([]);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    /**
     * Get row and column from asset index
     */
    const getRowAndColumn = useCallback((index: number) => {
        return {
            row: Math.floor(index / numColumns),
            col: index % numColumns
        };
    }, [numColumns]);

    /**
     * Get asset index from row and column
     */
    const getAssetIndex = useCallback((row: number, col: number) => {
        return row * numColumns + col;
    }, [numColumns]);

    /**
     * Get all asset indices between two positions (inclusive)
     */
    const getAssetIndicesBetween = useCallback((startIndex: number, endIndex: number) => {
        const indices: number[] = [];
        const startPos = getRowAndColumn(startIndex);
        const endPos = getRowAndColumn(endIndex);
        
        // Ensure start is always the "earlier" position
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
    }, [getRowAndColumn]);

    /**
     * Check if there's sufficient horizontal movement to trigger selection
     */
    const hasSufficientHorizontalMovement = useCallback((startPos: { x: number; y: number }, currentPos: { x: number; y: number }) => {
        const horizontalThreshold = 10; // Increased to 15px for better scroll detection
        const dx = Math.abs(currentPos.x - startPos.x);
        const dy = Math.abs(currentPos.y - startPos.y);
        
        // Require significant horizontal movement AND horizontal movement should be greater than vertical
        return dx >= horizontalThreshold && dx > dy * 0.5;
    }, []);

    /**
     * Check if there's significant vertical movement (scrolling)
     */
    const hasSignificantVerticalMovement = useCallback((startPos: { x: number; y: number }, currentPos: { x: number; y: number }) => {
        const verticalThreshold = 10; // 10px vertical movement threshold
        const dx = Math.abs(currentPos.x - startPos.x);
        const dy = Math.abs(currentPos.y - startPos.y);
        
        // Check if vertical movement is significant and greater than horizontal
        return dy >= verticalThreshold && dy > dx * 1.5;
    }, []);

    /**
     * Get item at specific screen position
     */
    const getItemAtPosition = useCallback((position: { x: number; y: number }) => {
        // Calculate which item is at this position
        const adjustedX = position.x - gap;
        
        // Use a simpler approach - just account for safe area and a fixed offset
        const adjustedY = position.y - insets.top - 300; // Reduced offset to 60px
        
        if (adjustedX < 0 || adjustedY < 0) return null;

        const column = Math.floor(adjustedX / (itemSize + gap));
        const row = Math.floor(adjustedY / (itemSize + gap));
        
        if (column < 0 || column >= numColumns || row < 0) return null;

        const index = row * numColumns + column;
        
        return assets[index] || null;
    }, [assets, itemSize, gap, numColumns, insets.top]);

    /**
     * Process deterministic selection based on gesture type
     */
    const processDeterministicSelection = useCallback((currentIndex: number) => {
        if (initialAssetIndex === null || isDeselectGesture === null) return;
        
        // Get all indices between initial and current position
        const indicesToProcess = getAssetIndicesBetween(initialAssetIndex, currentIndex);
        
        indicesToProcess.forEach(index => {
            if (index >= 0 && index < assets.length) {
                const asset = assets[index];
                const assetId = asset.id;
                
                // Only process if not already toggled in this gesture
                if (!toggledAssetIds.has(assetId)) {
                    const isCurrentlySelected = selectedAssets.has(assetId);
                    
                    if (isDeselectGesture) {
                        // Deselect gesture: unselect if currently selected
                        if (isCurrentlySelected) {
                            setSelectedAssets(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(assetId);
                                return newSet;
                            });
                        }
                    } else {
                        // Select gesture: select if currently unselected
                        if (!isCurrentlySelected) {
                            setSelectedAssets(prev => new Set([...prev, assetId]));
                        }
                    }
                    
                    // Track this asset as toggled
                    setToggledAssetIds(prev => new Set([...prev, assetId]));
                }
            }
        });
        
        setLastProcessedIndex(currentIndex);
    }, [initialAssetIndex, isDeselectGesture, assets, selectedAssets, toggledAssetIds, getAssetIndicesBetween]);

    /**
     * Handle album delete
     * @param albumId - The ID of the album to delete
     */
    const handleAlbumDelete = async (albumId: string) => {
        const newSubAlbums = subAlbums.filter((album) => album.album_id !== albumId);
        setSubAlbums(newSubAlbums);
        
        // Clean up expand state from AsyncStorage
        try {
            const key = `album_expand_${albumId}`;
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing expand state:', error);
        }
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

            // Remove selected assets from the local state and get the updated assets
            setAssets(prevAssets => {
                const updatedAssets = prevAssets.filter(asset => !deletedAssetIds.includes(asset.id));
                // Call onAssetsUpdate with the updated assets
                onAssetsUpdate?.(updatedAssets);
                return updatedAssets;
            });
            
            // Clear selection and exit selection mode
            setSelectedAssets(new Set());
            setIsSelectionMode(false);
            onSelectionChange?.([]);
        } catch (error) {
            console.error('Error deleting selected assets:', error);
        }
    }, [onSelectionChange, onAssetsUpdate]);

    /**
     * Handle sub-album expand / collapse   
     */
    const handleSubAlbumExpandCollapse = useCallback(async () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);
        
        // Save expand state to AsyncStorage
        try {
            const key = `album_expand_${album.album_id}`;
            await AsyncStorage.setItem(key, JSON.stringify(newExpandedState));
        } catch (error) {
            console.error('Error saving expand state:', error);
        }
    }, [isExpanded, album.album_id]);

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
    const gestureHandler = useMemo(() => Gesture.Pan()
        .onStart((event) => {
            'worklet';
            // Don't start drag-and-drop if in selection mode
            if (isSelectionMode) return;
            
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
            // Don't update drag-and-drop if in selection mode
            if (isSelectionMode) return;
            
            const currentDraggedType = draggedItemType.value;
            const currentDraggedIndex = draggedItemIndex.value;
            
            if (currentDraggedType === null || currentDraggedIndex === -1) return;
            
            translateX.value = event.translationX;
            translateY.value = event.translationY;
            
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
            // Don't end drag-and-drop if in selection mode
            if (isSelectionMode) return;
            
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
        }), [isSelectionMode, subAlbums.length, assets.length, screenWidth, setDraggedItemJS, setDropTargetIndexJS, setIsDraggingJS, getGridPositionWorklet, reorderAlbums, reorderAssets]);

    // ============================================================================
    // PAN RESPONDER FOR SWIPE SELECTION (ONLY IN SELECTION MODE)
    // ============================================================================
    const swipeSelectionPanResponder = useMemo(() => {
        if (!isSelectionMode) return null;

        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                // Only start pan responder if we're not scrolling and there's significant movement
                return !isScrolling && (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10);
            },
            onPanResponderGrant: (evt: GestureResponderEvent) => {
                const startPosition = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
                setGestureStartPosition(startPosition);
                setLastSwipePosition(startPosition);
                
                // Reset all gesture state
                setToggledAssetIds(new Set());
                setLastProcessedAssetId(null);
                setCurrentHoverAssetId(null);
                setInitialAssetIndex(null);
                setIsDeselectGesture(null);
                setLastProcessedIndex(null);
                setHasHorizontalMovement(false);
                setHasVerticalMovement(false);
                setGestureLockedAsScroll(false);
                
                // Don't start selection mode immediately - wait for horizontal movement
                setIsSwipeSelecting(false);
            },
            onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                if (!gestureStartPosition) return;

                const currentPosition = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
                
                // If gesture is locked as scroll, don't process selection
                if (gestureLockedAsScroll) {
                    setLastSwipePosition(currentPosition);
                    return;
                }
                
                // Check for vertical movement first
                if (!hasVerticalMovement) {
                    const hasVertical = hasSignificantVerticalMovement(gestureStartPosition, currentPosition);
                    setHasVerticalMovement(hasVertical);
                    
                    // If there's significant vertical movement, lock the gesture as scroll
                    if (hasVertical) {
                        setGestureLockedAsScroll(true);
                        setIsSwipeSelecting(false); // Ensure selection mode is off
                        setLastSwipePosition(currentPosition);
                        return;
                    }
                }
                
                // Check for horizontal movement threshold
                if (!hasHorizontalMovement) {
                    const hasHorizontal = hasSufficientHorizontalMovement(gestureStartPosition, currentPosition);
                    setHasHorizontalMovement(hasHorizontal);
                    
                    // Only start selection mode if there's horizontal movement
                    if (hasHorizontal) {
                        setIsSwipeSelecting(true);
                        
                        // Process the initial asset if we started on one
                        const initialAsset = getItemAtPosition(gestureStartPosition);
                        if (initialAsset) {
                            const initialIndex = assets.indexOf(initialAsset);
                            setInitialAssetIndex(initialIndex);
                            
                            // Determine gesture type based on initial asset's selection state
                            const isCurrentlySelected = selectedAssets.has(initialAsset.id);
                            setIsDeselectGesture(isCurrentlySelected);
                            
                            // Process the initial asset
                            processDeterministicSelection(initialIndex);
                            setLastProcessedAssetId(initialAsset.id);
                            setCurrentHoverAssetId(initialAsset.id);
                        }
                    }
                    
                    setLastSwipePosition(currentPosition);
                    return;
                }
                
                // Only process selection if we have horizontal movement and are in selection mode
                if (!isSwipeSelecting) {
                    setLastSwipePosition(currentPosition);
                    return;
                }
                
                // Get the asset at the current position
                const currentAsset = getItemAtPosition(currentPosition);
                
                // Update hover state for visual feedback
                setCurrentHoverAssetId(currentAsset?.id || null);
                
                if (currentAsset) {
                    const currentIndex = assets.indexOf(currentAsset);
                    
                    // Process deterministic selection
                    processDeterministicSelection(currentIndex);
                    setLastProcessedAssetId(currentAsset.id);
                }

                setLastSwipePosition(currentPosition);
            },
            onPanResponderRelease: () => {
                setIsSwipeSelecting(false);
                setLastSwipePosition(null);
                setToggledAssetIds(new Set());
                setLastProcessedAssetId(null);
                setCurrentHoverAssetId(null);
                setInitialAssetIndex(null);
                setIsDeselectGesture(null);
                setLastProcessedIndex(null);
                setHasHorizontalMovement(false);
                setHasVerticalMovement(false);
                setGestureLockedAsScroll(false);
                setGestureStartPosition(null);
            },
            onPanResponderTerminate: () => {
                setIsSwipeSelecting(false);
                setLastSwipePosition(null);
                setToggledAssetIds(new Set());
                setLastProcessedAssetId(null);
                setCurrentHoverAssetId(null);
                setInitialAssetIndex(null);
                setIsDeselectGesture(null);
                setLastProcessedIndex(null);
                setHasHorizontalMovement(false);
                setHasVerticalMovement(false);
                setGestureLockedAsScroll(false);
                setGestureStartPosition(null);
            },
        });
    }, [isSelectionMode, isScrolling, selectedAssets, assets, hasSufficientHorizontalMovement, hasSignificantVerticalMovement, getItemAtPosition, processDeterministicSelection, gestureStartPosition, gestureLockedAsScroll, hasHorizontalMovement, hasVerticalMovement, isSwipeSelecting]);

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
    }, []); // Add empty dependency array to prevent unnecessary updates

    // ============================================================================
    // RENDERERS
    // ============================================================================

    /**
     * Render asset item for FlatList
     * @param item - The item to render
     * @param index - The index of the item
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
                index={index}
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
                itemSize={itemSize}
                animatedStyle={animatedStyle}
                isScrolling={isScrolling}
                isHovered={isHovered}
            />
        );
    }, [draggedItem, dropTargetIndex, selectedAssets, isSelectionMode, toggleAssetSelection, onAssetPress, enterSelectionModeAndSelect, itemSize, animatedStyle, isScrolling, currentHoverAssetId]);

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
    const SubAlbumItem = useMemo(() => {
        return ({ subAlbum, index }: { subAlbum: Album; index: number }) => {
            const isCurrentlyDragged = draggedItem?.type === 'album' && draggedItem.index === index;
            const isDropTarget = dropTargetIndex === index && !isCurrentlyDragged && draggedItem?.type === 'album';
            
            return (
                <View className={`${isTablet ? 'w-1/5' : 'w-1/3'} px-1 mb-4`}>
                    <Animated.View 
                        style={isCurrentlyDragged ? animatedStyle : undefined}
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
                </View>
            );
        };
    }, [isTablet, draggedItem, dropTargetIndex, animatedStyle]);

    /**
     * Render sub-album item for FlatList
     * @param item - The item to render
     * @param index - The index of the item
     * @returns The rendered sub-album item
     */
    const renderSubAlbumItem = useMemo(() => {
        return ({ item, index }: { item: Album; index: number }) => (
            <SubAlbumItem subAlbum={item} index={index} />
        );
    }, [SubAlbumItem]);

    return (
        <>
            {isSelectionMode ? (
                // When in selection mode, don't use GestureDetector to allow PanResponder to work
                <Animated.View className="flex-1">
                    {/* Selection mode header - MediaLibrary style */}
                    {isSelectionMode && (
                        <View className={`px-4 py-3 ${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} border-b ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'}`}>
                            <View className="flex-row items-center justify-between">
                                <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} font-medium text-lg`}>
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

                            {/* Header */}
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} font-medium text-lg`}>
                                    {text.folders} ({subAlbums.length}) 
                                </Text>

                                {/* Expand/Collapse button */}
                                <TouchableOpacity 
                                    onPress={handleSubAlbumExpandCollapse}
                                    className="p-2"
                                >
                                    <Feather 
                                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                                        size={20} 
                                        color={theme === 'dark' ? '#cbd5e1' : '#64748b'} 
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* List - only show when expanded */}
                            {isExpanded && (
                                <FlatList
                                    ref={albumListRef}
                                    data={subAlbums}
                                    renderItem={renderSubAlbumItem}
                                    keyExtractor={(item) => item.album_id || ''}
                                    numColumns={isTablet ? 5 : 3}
                                    columnWrapperStyle={{ 
                                        justifyContent: 'flex-start',
                                        gap: 2
                                    }}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    removeClippedSubviews={false}
                                    getItemLayout={(data, index) => ({
                                        length: 200, // Approximate height of each item
                                        offset: 200 * Math.floor(index / (isTablet ? 5 : 3)),
                                        index,
                                    })}
                                />
                            )}
                        </View>
                    )}

                    {/* Assets Grid */}
                    {assets && assets.length > 0 ? (
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
                                    contentContainerStyle={{ gap: gap, paddingHorizontal: gap }}
                                    scrollEventThrottle={16}
                                    onScroll={(event) => {
                                        setScrollOffset(event.nativeEvent.contentOffset.y);
                                    }}
                                    onScrollBeginDrag={() => setIsScrolling(true)}
                                    onScrollEndDrag={() => setIsScrolling(false)}
                                    onMomentumScrollBegin={() => setIsScrolling(true)}
                                    onMomentumScrollEnd={() => setIsScrolling(false)}
                                />
                            </View>
                        </>
                    ) : (
                        <View className="flex-1 items-center justify-center px-4">
                            <Feather name="image" size={48} color={theme === 'dark' ? '#cbd5e1' : '#64748b'} />
                            <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-center mt-4`}>
                                {text.noMediaInAlbum}
                            </Text>
                            <Text className={`${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'} text-center text-sm mt-2`}>
                                {text.tapToAdd}
                            </Text>
                        </View>
                    )}
                </Animated.View>
            ) : (
                // When NOT in selection mode, use GestureDetector for drag-and-drop
                <GestureDetector gesture={gestureHandler}>
                    <Animated.View className="flex-1">
                        {/* Sub-albums */}
                        {subAlbums && subAlbums.length > 0 && (
                            <View className="px-4 mb-4">

                                {/* Header */}
                                <View className="flex-row items-center justify-between mb-3">
                                    <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} font-medium text-lg`}>
                                        {text.folders} ({subAlbums.length}) 
                                    </Text>

                                    {/* Expand/Collapse button */}
                                    <TouchableOpacity 
                                        onPress={handleSubAlbumExpandCollapse}
                                        className="p-2"
                                    >
                                        <Feather 
                                            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                                            size={20} 
                                            color={theme === 'dark' ? '#cbd5e1' : '#64748b'} 
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* List - only show when expanded */}
                                {isExpanded && (
                                    <FlatList
                                        ref={albumListRef}
                                        data={subAlbums}
                                        renderItem={renderSubAlbumItem}
                                        keyExtractor={(item) => item.album_id || ''}
                                        numColumns={isTablet ? 5 : 3}
                                        columnWrapperStyle={{ 
                                            justifyContent: 'flex-start',
                                            gap: 2
                                        }}
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={{ paddingBottom: 20 }}
                                        removeClippedSubviews={false}
                                        getItemLayout={(data, index) => ({
                                            length: 200, // Approximate height of each item
                                            offset: 200 * Math.floor(index / (isTablet ? 5 : 3)),
                                            index,
                                        })}
                                    />
                                )}
                            </View>
                        )}

                        {/* Assets Grid */}
                        {assets && assets.length > 0 ? (
                            <>
                                <View className="px-4 mb-3">
                                    <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} font-medium text-lg`}>
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
                                    scrollEventThrottle={16}
                                    onScroll={(event) => {
                                        setScrollOffset(event.nativeEvent.contentOffset.y);
                                    }}
                                    onScrollBeginDrag={() => setIsScrolling(true)}
                                    onScrollEndDrag={() => setIsScrolling(false)}
                                    onMomentumScrollBegin={() => setIsScrolling(true)}
                                    onMomentumScrollEnd={() => setIsScrolling(false)}
                                />
                            </>
                        ) : (
                            <View className="flex-1 items-center justify-center px-4">
                                <Feather name="image" size={48} color={theme === 'dark' ? '#cbd5e1' : '#64748b'} />
                                <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-center mt-4`}>
                                    {text.noMediaInAlbum}
                                </Text>
                                <Text className={`${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'} text-center text-sm mt-2`}>
                                    {text.tapToAdd}
                                </Text>
                            </View>
                        )}
                    </Animated.View>
                </GestureDetector>
            )}
        </>
    );
};

export default AlbumWithAssets;