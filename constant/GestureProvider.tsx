import { Asset } from "@/types/asset";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { GestureResponderEvent, PanResponder, PanResponderGestureState } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS, withSpring } from "react-native-reanimated";

// ============================================================================
// TYPES
// ============================================================================
interface GestureConfig {
    // Grid configuration
    numColumns: number;
    itemSize: number;
    gap: number;
    
    // Offset configuration for different components
    offsetY: number; // Vertical offset (e.g., header height, sub-albums section)
    offsetX: number; // Horizontal offset
    
    // Scroll offset tracking
    scrollOffsetX: number;
    scrollOffsetY: number;
    
    // Component-specific adjustments
    componentType: 'album' | 'mediaLibrary' | 'subAlbum' | 'slider';
    isExpanded?: boolean; // For album component
    
    // Drag and drop configuration
    screenWidth?: number;
    albumSectionHeight?: number;
    albumItemHeight?: number;
    albumItemsPerRow?: number;
    
    // Slider configuration
    itemWidth?: number;
    maxScale?: number;
    minScale?: number;
}

interface GestureState {
    // Gesture tracking
    isSwipeSelecting: boolean;
    gestureStartPosition: { x: number; y: number } | null;
    hasHorizontalMovement: boolean;
    hasVerticalMovement: boolean;
    gestureLockedAsScroll: boolean;
    
    // Selection tracking
    initialAssetIndex: number | null;
    isDeselectGesture: boolean | null;
    lastProcessedIndex: number | null;
    toggledAssetIds: Set<string>;
    currentHoverAssetId: string | null;
    
    // Row-based selection (for MediaLibrary)
    visitedRows: Set<number>;
    rowToggleStates: Map<number, boolean>;
    currentRow: number | null;
}

interface GestureContextType {
    // Core gesture functions
    createSwipeSelectionPanResponder: (
        config: GestureConfig,
        assets: Asset[],
        selectedAssetIds: Set<string>,
        isScrolling: boolean,
        isSelectionMode: boolean,
        callbacks: {
            onAssetToggle: (assetId: string, shouldSelect: boolean) => void;
            onHoverChange: (assetId: string | null) => void;
            onSwipeSelectingChange: (isSelecting: boolean) => void;
        }
    ) => any;
    
    // Drag and drop gesture functions
    createDragAndDropGesture: (
        config: GestureConfig,
        assets: Asset[],
        subAlbums: any[],
        isSelectionMode: boolean,
        callbacks: {
            onDragStart: (type: 'asset' | 'album', index: number) => void;
            onDragUpdate: (type: 'asset' | 'album', index: number | null) => void;
            onDragEnd: (fromIndex: number, toIndex: number, type: 'asset' | 'album') => void;
        }
    ) => any;
    
    // Slider gesture functions
    createSliderGestures: (
        config: GestureConfig,
        assets: Asset[],
        callbacks: {
            onPanUpdate: (translationX: number, translationY: number, scale: number) => void;
            onPanEnd: (velocityX: number, translationX: number, scale: number) => void;
            onPinchUpdate: (scale: number) => void;
            onPinchEnd: (scale: number) => void;
            onDoubleTap: (scale: number) => void;
        }
    ) => any;
    
    // Advanced slider gesture functions with internal state management
    createAdvancedSliderGestures: (
        config: GestureConfig,
        assets: Asset[],
        sharedValues: {
            translateX: any;
            translateY: any;
            scale: any;
            currentIndex: any;
            savedScale: any;
            savedTranslateY: any;
        },
        callbacks: {
            onIndexChange: (index: number) => void;
            onAssetChange?: (index: number) => void;
        }
    ) => any;
    
    // Utility functions for selection management
    createSelectionManager: () => {
        selectedAssetIds: Set<string>;
        isSelectionMode: boolean;
        enterSelectionMode: (assetId: string, assets: Asset[], onSelectionChange?: (assets: Asset[]) => void) => void;
        exitSelectionMode: (onSelectionChange?: (assets: Asset[]) => void) => void;
        toggleAssetSelection: (assetId: string, assets: Asset[], onSelectionChange?: (assets: Asset[]) => void) => void;
        clearSelection: (onSelectionChange?: (assets: Asset[]) => void) => void;
    };
    
    // Utility functions for drag and drop management
    createDragAndDropManager: () => {
        draggedItem: { type: 'asset' | 'album', index: number } | null;
        dropTargetIndex: number | null;
        setDraggedItem: (item: { type: 'asset' | 'album', index: number } | null) => void;
        setDropTargetIndex: (index: number | null) => void;
        resetDragState: () => void;
    };
    
    // Utility functions
    getItemAtPosition: (position: { x: number; y: number }, config: GestureConfig, assets: Asset[]) => Asset | null;
    getGridPositionWorklet: (x: number, y: number, config: GestureConfig, itemListLength: number) => number | null;
    getAssetIndicesBetween: (startIndex: number, endIndex: number, numColumns: number) => number[];
    hasSufficientHorizontalMovement: (startPos: { x: number; y: number }, currentPos: { x: number; y: number }) => boolean;
    hasSignificantVerticalMovement: (startPos: { x: number; y: number }, currentPos: { x: number; y: number }) => boolean;
    
    // State management
    resetGestureState: () => void;
    getGestureState: () => GestureState;
}

// ============================================================================
// CONTEXT
// ============================================================================
const GestureContext = createContext<GestureContextType | undefined>(undefined);

export const useGesture = () => {
    const context = useContext(GestureContext);
    if (!context) {
        throw new Error('useGesture must be used within a GestureProvider');
    }
    return context;
};

// ============================================================================
// PROVIDER
// ============================================================================
const GestureProvider = ({ children }: { children: React.ReactNode }) => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [gestureState, setGestureState] = useState<GestureState>({
        isSwipeSelecting: false,
        gestureStartPosition: null,
        hasHorizontalMovement: false,
        hasVerticalMovement: false,
        gestureLockedAsScroll: false,
        initialAssetIndex: null,
        isDeselectGesture: null,
        lastProcessedIndex: null,
        toggledAssetIds: new Set(),
        currentHoverAssetId: null,
        visitedRows: new Set(),
        rowToggleStates: new Map(),
        currentRow: null,
    });

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    
    /**
     * Get item at specific screen position
     * @param position - The position to get the item at
     * @param config - The configuration for the gesture
     * @param assets - The assets to get the item from
     * @returns The item at the position
     */
    const getItemAtPosition = useCallback((position: { x: number; y: number }, config: GestureConfig, assets: Asset[]): Asset | null => {
        const { numColumns, itemSize, gap, offsetY, offsetX, scrollOffsetX, scrollOffsetY } = config;
        
        // Calculate adjusted position based on component type and offsets
        let adjustedX = position.x - gap + scrollOffsetX - offsetX;
        let adjustedY = position.y - offsetY + scrollOffsetY;
        
        // Component-specific adjustments
        if (config.componentType === 'album' && config.isExpanded) {
            adjustedY -= 70; // Additional offset for expanded album
        }
        
        if (adjustedX < 0 || adjustedY < 0) return null;

        const column = Math.floor(adjustedX / (itemSize + gap));
        const row = Math.floor(adjustedY / (itemSize + gap));
        
        if (column < 0 || column >= numColumns || row < 0) return null;

        const index = row * numColumns + column;
        return assets[index] || null;
    }, []);

    /**
     * Get grid position worklet for drag and drop functionality
     */
    const getGridPositionWorklet = useCallback((x: number, y: number, config: GestureConfig, itemListLength: number): number | null => {
        'worklet';
        const { numColumns, itemSize, gap, scrollOffsetX, scrollOffsetY, isExpanded } = config;
        
        const adjustedX = x - gap + scrollOffsetX;
        let adjustedY = y + (isExpanded ? -70 : 120) + scrollOffsetY;
        
        if (adjustedX < 0 || adjustedY < 0) return null;

        const column = Math.floor(adjustedX / (itemSize + gap));
        const row = Math.floor(adjustedY / (itemSize + gap));
        
        if (column < 0 || column >= numColumns || row < 0) return null;

        const index = row * numColumns + column;
        
        if (index >= 0 && index < itemListLength) {
            return index;
        }
        return null;
    }, []);

    /**
     * Get all asset indices between two positions (inclusive)
     */
    const getAssetIndicesBetween = useCallback((startIndex: number, endIndex: number, numColumns: number): number[] => {
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

    /**
     * Check if there's sufficient horizontal movement to trigger selection
     */
    const hasSufficientHorizontalMovement = useCallback((startPos: { x: number; y: number }, currentPos: { x: number; y: number }): boolean => {
        const horizontalThreshold = 15; // Increased to 15px for better scroll detection
        const dx = Math.abs(currentPos.x - startPos.x);
        const dy = Math.abs(currentPos.y - startPos.y);
        
        // Require significant horizontal movement AND horizontal movement should be greater than vertical
        return dx >= horizontalThreshold && dx > dy * 0.5;
    }, []);

    /**
     * Check if there's significant vertical movement (scrolling)
     */
    const hasSignificantVerticalMovement = useCallback((startPos: { x: number; y: number }, currentPos: { x: number; y: number }): boolean => {
        const verticalThreshold = 10; // 10px vertical movement threshold
        const dx = Math.abs(currentPos.x - startPos.x);
        const dy = Math.abs(currentPos.y - startPos.y);
        
        // Check if vertical movement is significant and greater than horizontal
        return dy >= verticalThreshold && dy > dx * 1.5;
    }, []);

    /**
     * Reset gesture state
     */
    const resetGestureState = useCallback(() => {
        setGestureState({
            isSwipeSelecting: false,
            gestureStartPosition: null,
            hasHorizontalMovement: false,
            hasVerticalMovement: false,
            gestureLockedAsScroll: false,
            initialAssetIndex: null,
            isDeselectGesture: null,
            lastProcessedIndex: null,
            toggledAssetIds: new Set(),
            currentHoverAssetId: null,
            visitedRows: new Set(),
            rowToggleStates: new Map(),
            currentRow: null,
        });
    }, []);

    /**
     * Get current gesture state
     */
    const getGestureState = useCallback(() => gestureState, [gestureState]);

    /**
     * Process deterministic selection based on gesture type
     */
    const processDeterministicSelection = useCallback((
        currentIndex: number,
        assets: Asset[],
        selectedAssetIds: Set<string>,
        onAssetToggle: (assetId: string, shouldSelect: boolean) => void
    ) => {
        const { initialAssetIndex, isDeselectGesture, toggledAssetIds, lastProcessedIndex } = gestureState;
        
        if (initialAssetIndex === null || isDeselectGesture === null) return;
        
        // Get all indices between initial and current position
        const indicesToProcess = getAssetIndicesBetween(initialAssetIndex, currentIndex, 5); // Default numColumns
        
        indicesToProcess.forEach(index => {
            if (index >= 0 && index < assets.length) {
                const asset = assets[index];
                const assetId = asset.id;
                
                // Only process if not already toggled in this gesture
                if (!toggledAssetIds.has(assetId)) {
                    const isCurrentlySelected = selectedAssetIds.has(assetId);
                    
                    if (isDeselectGesture) {
                        // Deselect gesture: unselect if currently selected
                        if (isCurrentlySelected) {
                            onAssetToggle(assetId, false);
                        }
                    } else {
                        // Select gesture: select if currently unselected
                        if (!isCurrentlySelected) {
                            onAssetToggle(assetId, true);
                        }
                    }
                    
                    // Track this asset as toggled
                    setGestureState(prev => ({
                        ...prev,
                        toggledAssetIds: new Set([...prev.toggledAssetIds, assetId])
                    }));
                }
            }
        });
        
        setGestureState(prev => ({
            ...prev,
            lastProcessedIndex: currentIndex
        }));
    }, [gestureState, getAssetIndicesBetween]);

    // ============================================================================
    // PAN RESPONDER CREATION
    // ============================================================================

    /**
     * Create swipe selection pan responder
     * @param config - The configuration for the gesture
     * @param assets - The assets to get the item from
     * @param selectedAssetIds - The selected asset ids
     * @param isScrolling - Whether the user is scrolling
     * @param isSelectionMode - Whether the user is in selection mode
     * @param callbacks - The callbacks to call when the gesture is triggered
     */
    const createSwipeSelectionPanResponder = useCallback((
        config: GestureConfig,
        assets: Asset[],
        selectedAssetIds: Set<string>,
        isScrolling: boolean,
        isSelectionMode: boolean,
        callbacks: {
            onAssetToggle: (assetId: string, shouldSelect: boolean) => void;
            onHoverChange: (assetId: string | null) => void;
            onSwipeSelectingChange: (isSelecting: boolean) => void;
        }
    ) => {
        if (!isSelectionMode) return null;

        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                return !isScrolling && (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10);
            },
            onPanResponderGrant: (evt: GestureResponderEvent) => {
                const startPosition = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
                
                // Reset all gesture state
                setGestureState({
                    isSwipeSelecting: false,
                    gestureStartPosition: startPosition,
                    hasHorizontalMovement: false,
                    hasVerticalMovement: false,
                    gestureLockedAsScroll: false,
                    initialAssetIndex: null,
                    isDeselectGesture: null,
                    lastProcessedIndex: null,
                    toggledAssetIds: new Set(),
                    currentHoverAssetId: null,
                    visitedRows: new Set(),
                    rowToggleStates: new Map(),
                    currentRow: null,
                });
            },

            /**
             * On pan responder move
             * @param evt - The event
             * @param gestureState - The gesture state
             * @returns void
             */
            onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                const currentState = getGestureState();
                if (!currentState.gestureStartPosition) return;

                const currentPosition = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
                
                // If gesture is locked as scroll, don't process selection
                if (currentState.gestureLockedAsScroll) {
                    return;
                }
                
                // Check for vertical movement first
                if (!currentState.hasVerticalMovement) {
                    const hasVertical = hasSignificantVerticalMovement(currentState.gestureStartPosition, currentPosition);
                    
                    if (hasVertical) {
                        setGestureState(prev => ({
                            ...prev,
                            hasVerticalMovement: true,
                            gestureLockedAsScroll: true,
                            isSwipeSelecting: false
                        }));
                        callbacks.onSwipeSelectingChange(false);
                        return;
                    }
                }
                
                // Check for horizontal movement threshold
                if (!currentState.hasHorizontalMovement) {
                    const hasHorizontal = hasSufficientHorizontalMovement(currentState.gestureStartPosition, currentPosition);
                    
                    if (hasHorizontal) {
                        setGestureState(prev => ({
                            ...prev,
                            hasHorizontalMovement: true,
                            isSwipeSelecting: true
                        }));
                        callbacks.onSwipeSelectingChange(true);
                        
                        // Process the initial asset if we started on one
                        const initialAsset = getItemAtPosition(currentState.gestureStartPosition, config, assets);
                        if (initialAsset) {
                            const initialIndex = assets.indexOf(initialAsset);
                            const isCurrentlySelected = selectedAssetIds.has(initialAsset.id);
                            
                            setGestureState(prev => ({
                                ...prev,
                                initialAssetIndex: initialIndex,
                                isDeselectGesture: isCurrentlySelected,
                                currentHoverAssetId: initialAsset.id
                            }));
                            
                            callbacks.onHoverChange(initialAsset.id);
                            
                            // Process the initial asset
                            processDeterministicSelection(initialIndex, assets, selectedAssetIds, callbacks.onAssetToggle);
                        }
                        return;
                    }
                }
                
                // Only process selection if we have horizontal movement and are in selection mode
                if (!currentState.isSwipeSelecting) {
                    return;
                }
                
                // Get the asset at the current position
                const currentAsset = getItemAtPosition(currentPosition, config, assets);
                
                // Update hover state for visual feedback
                callbacks.onHoverChange(currentAsset?.id || null);
                setGestureState(prev => ({
                    ...prev,
                    currentHoverAssetId: currentAsset?.id || null
                }));
                
                if (currentAsset) {
                    const currentIndex = assets.indexOf(currentAsset);
                    processDeterministicSelection(currentIndex, assets, selectedAssetIds, callbacks.onAssetToggle);
                }
            },

            /**
             * On pan responder release
             * @returns void
             */
            onPanResponderRelease: () => {
                callbacks.onSwipeSelectingChange(false);
                callbacks.onHoverChange(null);
                resetGestureState();
            },

            /**
             * On pan responder terminate
             * @returns void
             */
            onPanResponderTerminate: () => {
                callbacks.onSwipeSelectingChange(false);
                callbacks.onHoverChange(null);
                resetGestureState();
            },
        });
    }, [getGestureState, hasSignificantVerticalMovement, hasSufficientHorizontalMovement, getItemAtPosition, processDeterministicSelection, resetGestureState]);

    // ============================================================================
    // DRAG AND DROP GESTURE CREATION
    // ============================================================================
    /**
     * Create drag and drop gesture
     * @param config - The configuration for the gesture
     * @param assets - The assets to get the item from
     * @param subAlbums - The sub albums to get the item from
     * @param isSelectionMode - Whether the user is in selection mode
     * @param callbacks - The callbacks to call when the gesture is triggered
     */
    const createDragAndDropGesture = useCallback((
        config: GestureConfig,
        assets: Asset[],
        subAlbums: any[],
        isSelectionMode: boolean,
        callbacks: {
            onDragStart: (type: 'asset' | 'album', index: number) => void;
            onDragUpdate: (type: 'asset' | 'album', index: number | null) => void;
            onDragEnd: (fromIndex: number, toIndex: number, type: 'asset' | 'album') => void;
        }
    ) => {
        if (isSelectionMode) return null;

        return Gesture.Pan()
            /**
             * On pan start
             * @param event - The event
             * @returns void
             */
            .onStart((event) => {
                'worklet';
                const touchX = event.x;
                const touchY = event.y;
                
                const albumSectionHeight = config.albumSectionHeight || (subAlbums.length > 0 ? 100 : 0);
                const isInAlbumSection = touchY < albumSectionHeight;
                
                if (isInAlbumSection && subAlbums.length > 0) {
                    const albumItemHeight = config.albumItemHeight || 120;
                    const albumItemsPerRow = config.albumItemsPerRow || 3;
                    const screenWidth = config.screenWidth || 375;
                    
                    const albumIndex = Math.floor(touchY / albumItemHeight) * albumItemsPerRow + Math.floor(touchX / (screenWidth / albumItemsPerRow));
                    if (albumIndex >= 0 && albumIndex < subAlbums.length) {
                        runOnJS(callbacks.onDragStart)('album', albumIndex);
                    }
                } else {
                    const assetIndex = getGridPositionWorklet(touchX, touchY - 200, config, assets.length);
                    if (assetIndex !== null && assetIndex >= 0 && assetIndex < assets.length) {
                        runOnJS(callbacks.onDragStart)('asset', assetIndex);
                    }
                }
            })

            /**
             * On pan update
             * @param event - The event
             * @returns void
             */
            .onUpdate((event) => {
                'worklet';
                const currentX = event.x;
                const currentY = event.y;
                
                const albumSectionHeight = config.albumSectionHeight || (subAlbums.length > 0 ? 100 : 0);
                const isInAlbumSection = currentY < albumSectionHeight;
                
                if (isInAlbumSection && subAlbums.length > 0) {
                    const albumItemHeight = config.albumItemHeight || 120;
                    const albumItemsPerRow = config.albumItemsPerRow || 3;
                    const screenWidth = config.screenWidth || 375;
                    
                    const albumIndex = Math.floor(currentY / albumItemHeight) * albumItemsPerRow + Math.floor(currentX / (screenWidth / albumItemsPerRow));
                    if (albumIndex >= 0 && albumIndex < subAlbums.length) {
                        runOnJS(callbacks.onDragUpdate)('album', albumIndex);
                    } else {
                        runOnJS(callbacks.onDragUpdate)('album', null);
                    }
                } else {
                    const assetIndex = getGridPositionWorklet(currentX, currentY - 200, config, assets.length);
                    if (assetIndex !== null && assetIndex >= 0 && assetIndex < assets.length) {
                        runOnJS(callbacks.onDragUpdate)('asset', assetIndex);
                    } else {
                        runOnJS(callbacks.onDragUpdate)('asset', null);
                    }
                }
            })

            /**
             * On pan end
             * @param event - The event
             * @returns void
             */
            .onEnd((event) => {
                'worklet';
                const dropX = event.x;
                const dropY = event.y;
                
                const albumSectionHeight = config.albumSectionHeight || (subAlbums.length > 0 ? 100 : 0);
                const isInAlbumSection = dropY < albumSectionHeight;
                
                if (isInAlbumSection && subAlbums.length > 0) {
                    const albumItemHeight = config.albumItemHeight || 120;
                    const albumItemsPerRow = config.albumItemsPerRow || 3;
                    const screenWidth = config.screenWidth || 375;
                    
                    const albumIndex = Math.floor(dropY / albumItemHeight) * albumItemsPerRow + Math.floor(dropX / (screenWidth / albumItemsPerRow));
                    if (albumIndex >= 0 && albumIndex < subAlbums.length) {
                        // Note: You'll need to track the original index from onStart
                        runOnJS(callbacks.onDragEnd)(0, albumIndex, 'album');
                    }
                } else {
                    const assetIndex = getGridPositionWorklet(dropX, dropY - 200, config, assets.length);
                    if (assetIndex !== null && assetIndex >= 0 && assetIndex < assets.length) {
                        // Note: You'll need to track the original index from onStart
                        runOnJS(callbacks.onDragEnd)(0, assetIndex, 'asset');
                    }
                }
            });
    }, [getGridPositionWorklet]);

    // ============================================================================
    // SLIDER GESTURE CREATION
    // ============================================================================
    /**
     * Create slider gestures (pan, pinch, double tap)
     * @param config - The configuration for the gesture
     * @param assets - The assets to get the item from
     * @param callbacks - The callbacks to call when the gesture is triggered
     */
    const createSliderGestures = useCallback((
        config: GestureConfig,
        assets: Asset[],
        callbacks: {
            onPanUpdate: (translationX: number, translationY: number, scale: number) => void;
            onPanEnd: (velocityX: number, translationX: number, scale: number) => void;
            onPinchUpdate: (scale: number) => void;
            onPinchEnd: (scale: number) => void;
            onDoubleTap: (scale: number) => void;
        }
    ) => {
        const itemWidth = config.itemWidth || 375;
        const maxScale = config.maxScale || 3;
        const minScale = config.minScale || 1;

        /**
         * Handle pan gesture
         */
        const panGesture = Gesture.Pan()
            .onUpdate((event) => {
                'worklet';
                runOnJS(callbacks.onPanUpdate)(event.translationX, event.translationY, 1); // Scale will be passed separately
            })
            .onEnd((event) => {
                'worklet';
                runOnJS(callbacks.onPanEnd)(event.velocityX, event.translationX, 1); // Scale will be passed separately
            });

        /**
         * Handle pinch gesture
         */
        const pinchGesture = Gesture.Pinch()
            .onUpdate((event) => {
                'worklet';
                runOnJS(callbacks.onPinchUpdate)(event.scale);
            })
            .onEnd((event) => {
                'worklet';
                runOnJS(callbacks.onPinchEnd)(event.scale);
            });

        /**
         * Handle double tap gesture
         */
        const doubleTapGesture = Gesture.Tap()
            .numberOfTaps(2)
            .onStart(() => {
                'worklet';
                runOnJS(callbacks.onDoubleTap)(1); // Current scale will be passed separately
            });

        /**
         * Compose all gestures
         */
        return Gesture.Simultaneous(
            Gesture.Simultaneous(panGesture, pinchGesture),
            doubleTapGesture
        );
    }, []);

    // ============================================================================
    // ADVANCED SLIDER GESTURE CREATION
    // ============================================================================
    /**
     * Create advanced slider gestures with internal state management
     * @param config - The configuration for the gesture
     * @param assets - The assets to get the item from
     * @param sharedValues - Shared values for slider state (translateX, translateY, scale, currentIndex, savedScale, savedTranslateY)
     * @param callbacks - The callbacks to call when the gesture is triggered
     */
    const createAdvancedSliderGestures = useCallback((
        config: GestureConfig,
        assets: Asset[],
        sharedValues: {
            translateX: any;
            translateY: any;
            scale: any;
            currentIndex: any;
            savedScale: any;
            savedTranslateY: any;
        },
        callbacks: {
            onIndexChange: (index: number) => void;
            onAssetChange?: (index: number) => void;
        }
    ) => {
        const itemWidth = config.itemWidth || 375;
        const maxScale = config.maxScale || 3;
        const minScale = config.minScale || 1;

        /**
         * Handle pan gesture
         */
        const panGesture = Gesture.Pan()
            .onUpdate((event) => {
                'worklet';
                if (sharedValues.scale.value <= 1) {
                    // Horizontal pan for navigation when not zoomed
                    sharedValues.translateX.value = event.translationX - sharedValues.currentIndex.value * itemWidth;
                } else {
                    // Vertical pan for moving zoomed image
                    sharedValues.translateY.value = sharedValues.savedTranslateY.value + event.translationY;
                }
            })
            .onEnd((event) => {
                'worklet';
                if (sharedValues.scale.value <= 1) {
                    const velocity = event.velocityX;
                    const translation = event.translationX;
            
                    let targetIndex = sharedValues.currentIndex.value;
                    if (Math.abs(translation) > itemWidth * 0.3 || Math.abs(velocity) > 500) {
                        if (translation > 0 || velocity > 0) {
                            targetIndex = Math.max(0, sharedValues.currentIndex.value - 1);
                        } else {
                            targetIndex = Math.min(assets.length - 1, sharedValues.currentIndex.value + 1);
                        }
                    }
            
                    sharedValues.translateX.value = withSpring(-targetIndex * itemWidth, {
                        damping: 20,
                        stiffness: 200,
                    });
            
                    sharedValues.currentIndex.value = targetIndex;
                    runOnJS(callbacks.onIndexChange)(targetIndex);
                    
                    if (callbacks.onAssetChange) {
                        runOnJS(callbacks.onAssetChange)(targetIndex);
                    }
                } else {
                    sharedValues.savedTranslateY.value = sharedValues.translateY.value;
                }
            });

        /**
         * Handle pinch gesture
         */
        const pinchGesture = Gesture.Pinch()
            .onUpdate((event) => {
                'worklet';
                sharedValues.scale.value = sharedValues.savedScale.value * event.scale;
            })
            .onEnd(() => {
                'worklet';
                sharedValues.savedScale.value = sharedValues.scale.value;
                if (sharedValues.scale.value < minScale) {
                    sharedValues.scale.value = withSpring(minScale);
                    sharedValues.savedScale.value = minScale;
                } else if (sharedValues.scale.value > maxScale) {
                    sharedValues.scale.value = withSpring(maxScale);
                    sharedValues.savedScale.value = maxScale;
                }
            });

        /**
         * Handle double tap gesture
         */
        const doubleTapGesture = Gesture.Tap()
            .numberOfTaps(2)
            .onStart(() => {
                'worklet';
                if (sharedValues.scale.value > 1) {
                    sharedValues.scale.value = withSpring(1);
                    sharedValues.savedScale.value = 1;
                    sharedValues.translateY.value = withSpring(0);
                    sharedValues.savedTranslateY.value = 0;
                } else {
                    sharedValues.scale.value = withSpring(2);
                    sharedValues.savedScale.value = 2;
                }
            });

        /**
         * Compose all gestures
         */
        return Gesture.Simultaneous(
            Gesture.Simultaneous(panGesture, pinchGesture),
            doubleTapGesture
        );
    }, []);

    // ============================================================================
    // UTILITY MANAGERS
    // ============================================================================
    /**
     * Create selection manager utility functions
     */
    const createSelectionManager = useCallback(() => {
        const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
        const [isSelectionMode, setIsSelectionMode] = useState(false);

        const enterSelectionMode = useCallback((assetId: string, assets: Asset[], onSelectionChange?: (assets: Asset[]) => void) => {
            setIsSelectionMode(true);
            setSelectedAssetIds(new Set([assetId]));
            const selectedAsset = assets.find(asset => asset.id === assetId);
            if (selectedAsset && onSelectionChange) {
                onSelectionChange([selectedAsset]);
            }
        }, []);

        const exitSelectionMode = useCallback((onSelectionChange?: (assets: Asset[]) => void) => {
            setIsSelectionMode(false);
            setSelectedAssetIds(new Set());
            if (onSelectionChange) {
                onSelectionChange([]);
            }
        }, []);

        const toggleAssetSelection = useCallback((assetId: string, assets: Asset[], onSelectionChange?: (assets: Asset[]) => void) => {
            if (!isSelectionMode) return;

            setSelectedAssetIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(assetId)) {
                    newSet.delete(assetId);
                } else {
                    newSet.add(assetId);
                }
                
                const selectedAssetsArray = assets.filter(asset => newSet.has(asset.id));
                if (onSelectionChange) {
                    onSelectionChange(selectedAssetsArray);
                }
                
                return newSet;
            });
        }, [isSelectionMode]);

        const clearSelection = useCallback((onSelectionChange?: (assets: Asset[]) => void) => {
            setSelectedAssetIds(new Set());
            setIsSelectionMode(false);
            if (onSelectionChange) {
                onSelectionChange([]);
            }
        }, []);

        return {
            selectedAssetIds,
            isSelectionMode,
            enterSelectionMode,
            exitSelectionMode,
            toggleAssetSelection,
            clearSelection,
        };
    }, []);

    /**
     * Create drag and drop manager utility functions
     */
    const createDragAndDropManager = useCallback(() => {
        const [draggedItem, setDraggedItem] = useState<{ type: 'asset' | 'album', index: number } | null>(null);
        const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

        const resetDragState = useCallback(() => {
            setDraggedItem(null);
            setDropTargetIndex(null);
        }, []);

        return {
            draggedItem,
            dropTargetIndex,
            setDraggedItem,
            setDropTargetIndex,
            resetDragState,
        };
    }, []);

    // ============================================================================
    // CONTEXT VALUE
    // ============================================================================
    const contextValue: GestureContextType = useMemo(() => ({
        createSwipeSelectionPanResponder,
        createDragAndDropGesture,
        createSliderGestures,
        createAdvancedSliderGestures,
        createSelectionManager,
        createDragAndDropManager,
        getItemAtPosition,
        getGridPositionWorklet,
        getAssetIndicesBetween,
        hasSufficientHorizontalMovement,
        hasSignificantVerticalMovement,
        resetGestureState,
        getGestureState,
    }), [
        createSwipeSelectionPanResponder,
        createDragAndDropGesture,
        createSliderGestures,
        createAdvancedSliderGestures,
        createSelectionManager,
        createDragAndDropManager,
        getItemAtPosition,
        getGridPositionWorklet,
        getAssetIndicesBetween,
        hasSufficientHorizontalMovement,
        hasSignificantVerticalMovement,
        resetGestureState,
        getGestureState,
    ]);

    return (
        <GestureContext.Provider value={contextValue}>
            {children}
        </GestureContext.Provider>
    );
};

export default GestureProvider;