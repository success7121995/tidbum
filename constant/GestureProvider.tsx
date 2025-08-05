import { Asset } from "@/types/asset";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { GestureResponderEvent, PanResponder, PanResponderGestureState } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS, useSharedValue, withSpring } from "react-native-reanimated";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration object for gesture behavior across different components
 */
interface GestureConfig {
    // Grid layout configuration
    numColumns: number;        // Number of columns in the grid
    itemSize: number;          // Size of each grid item
    gap: number;              // Gap between grid items
    
    // Component positioning offsets
    offsetY: number;          // Vertical offset (header height, sub-albums section)
    offsetX: number;          // Horizontal offset
    
    // Scroll position tracking
    scrollOffsetX: number;    // Current horizontal scroll position
    scrollOffsetY: number;    // Current vertical scroll position
    
    // Component type identification
    componentType: 'album' | 'mediaLibrary' | 'subAlbum' | 'slider';
    isExpanded?: boolean;     // For album component expansion state
    
    // Drag and drop specific configuration
    screenWidth?: number;     // Screen width for drag calculations
    albumSectionHeight?: number;  // Height of album section
    albumItemHeight?: number;     // Height of individual album items
    albumItemsPerRow?: number;    // Number of albums per row
    
    // Slider specific configuration
    itemWidth?: number;       // Width of slider items
    maxScale?: number;        // Maximum zoom scale
    minScale?: number;        // Minimum zoom scale
}

/**
 * Internal state tracking for gesture interactions
 */
interface GestureState {
    // Gesture movement tracking
    isSwipeSelecting: boolean;                    // Whether currently in swipe selection mode
    gestureStartPosition: { x: number; y: number } | null;  // Initial touch position
    hasHorizontalMovement: boolean;               // Whether horizontal movement detected
    hasVerticalMovement: boolean;                 // Whether vertical movement detected
    gestureLockedAsScroll: boolean;               // Whether gesture is locked as scroll
    
    // Selection state tracking
    initialAssetIndex: number | null;             // Index of first selected asset
    isDeselectGesture: boolean | null;            // Whether this is a deselect gesture
    lastProcessedIndex: number | null;            // Last processed asset index
    toggledAssetIds: Set<string>;                 // Assets toggled in current gesture
    currentHoverAssetId: string | null;           // Currently hovered asset
    
    // Row-based selection (for MediaLibrary component)
    visitedRows: Set<number>;                     // Rows visited during gesture
    rowToggleStates: Map<number, boolean>;        // Toggle state for each row
    currentRow: number | null;                    // Current row being processed
}

/**
 * Main context interface providing all gesture functionality
 */
interface GestureContextType {
    // Core gesture creation functions
    createSwipeSelectionPanResponder: (
        config: GestureConfig,
        assets: Asset[],
        selectedAssetIds: Set<string>,
        isScrolling: boolean,
        isSelectionMode: boolean,
        callbacks: {
            onAssetToggle: (assetId: string, shouldSelect: boolean) => void;
            onHoverChange?: (assetId: string | null) => void;
            onSwipeSelectingChange?: (isSelecting: boolean) => void;
        }
    ) => any;
    
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
    
    // Utility manager creation functions
    createSelectionManager: () => {
        selectedAssetIds: Set<string>;
        isSelectionMode: boolean;
        enterSelectionMode: (assetId: string, assets: Asset[], onSelectionChange?: (assets: Asset[]) => void) => void;
        exitSelectionMode: (onSelectionChange?: (assets: Asset[]) => void) => void;
        toggleAssetSelection: (assetId: string, assets: Asset[], onSelectionChange?: (assets: Asset[]) => void) => void;
        clearSelection: (onSelectionChange?: (assets: Asset[]) => void) => void;
    };
    
    createDragAndDropManager: () => {
        draggedItem: { type: 'asset' | 'album', index: number } | null;
        dropTargetIndex: number | null;
        setDraggedItem: (item: { type: 'asset' | 'album', index: number } | null) => void;
        setDropTargetIndex: (index: number | null) => void;
        resetDragState: () => void;
    };
    
    // Utility helper functions
    getItemAtPosition: (position: { x: number; y: number }, config: GestureConfig, assets: Asset[]) => Asset | null;
    getGridPositionWorklet: (x: number, y: number, config: GestureConfig, itemListLength: number) => number | null;
    getAssetIndicesBetween: (startIndex: number, endIndex: number, numColumns: number) => number[];
    hasSufficientHorizontalMovement: (startPos: { x: number; y: number }, currentPos: { x: number; y: number }) => boolean;
    hasSignificantVerticalMovement: (startPos: { x: number; y: number }, currentPos: { x: number; y: number }) => boolean;
    
    // State management functions
    resetGestureState: () => void;
    getGestureState: () => GestureState;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

/**
 * React context for gesture functionality
 */
const GestureContext = createContext<GestureContextType | undefined>(undefined);

/**
 * Hook to access gesture context
 * @throws Error if used outside of GestureProvider
 */
export const useGesture = () => {
    const context = useContext(GestureContext);
    if (!context) {
        throw new Error('useGesture must be used within a GestureProvider');
    }
    return context;
};

// ============================================================================
// GESTURE PROVIDER COMPONENT
// ============================================================================

/**
 * Main provider component that provides gesture functionality to the app
 * Handles swipe selection, drag and drop, and slider gestures
 */
const GestureProvider = ({ children }: { children: React.ReactNode }) => {
    
    // ============================================================================
    // INTERNAL STATE MANAGEMENT
    // ============================================================================
    
    /**
     * Internal gesture state for tracking current interaction
     */
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
    // DRAG AND DROP SHARED VALUES
    // ============================================================================
    
    /**
     * Shared values for drag and drop state that can be accessed from worklets
     */
    const dragStartIndex = useSharedValue(-1);
    const dragStartType = useSharedValue<'asset' | 'album' | null>(null);
    const dragLastDropTarget = useSharedValue(-1);

    // ============================================================================
    // POSITION CALCULATION UTILITIES
    // ============================================================================
    
    /**
     * Calculate which asset is at a given screen position
     * @param position - Screen coordinates to check
     * @param config - Gesture configuration with grid layout info
     * @param assets - Array of assets to search through
     * @returns The asset at the position, or null if none found
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
     * Worklet function for calculating grid position during drag and drop
     * Must be a worklet for use in gesture handlers
     * @param x - X coordinate
     * @param y - Y coordinate  
     * @param config - Gesture configuration
     * @param itemListLength - Total number of items in the list
     * @returns Index of item at position, or null if invalid
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

    // ============================================================================
    // SELECTION RANGE UTILITIES
    // ============================================================================
    
    /**
     * Get all asset indices between two positions (inclusive)
     * Used for swipe selection to determine which assets to toggle
     * @param startIndex - Starting index
     * @param endIndex - Ending index
     * @param numColumns - Number of columns in the grid
     * @returns Array of indices between start and end
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

    // ============================================================================
    // MOVEMENT DETECTION UTILITIES
    // ============================================================================
    
    /**
     * Check if there's sufficient horizontal movement to trigger selection
     * Prevents accidental selections from small finger movements
     * @param startPos - Starting position
     * @param currentPos - Current position
     * @returns True if horizontal movement is sufficient for selection
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
     * Used to distinguish between scrolling and selection gestures
     * @param startPos - Starting position
     * @param currentPos - Current position
     * @returns True if vertical movement indicates scrolling
     */
    const hasSignificantVerticalMovement = useCallback((startPos: { x: number; y: number }, currentPos: { x: number; y: number }): boolean => {
        const verticalThreshold = 10; // 10px vertical movement threshold
        const dx = Math.abs(currentPos.x - startPos.x);
        const dy = Math.abs(currentPos.y - startPos.y);
        
        // Check if vertical movement is significant and greater than horizontal
        return dy >= verticalThreshold && dy > dx * 1.5;
    }, []);

    // ============================================================================
    // SELECTION PROCESSING UTILITIES
    // ============================================================================
    
    /**
     * Process deterministic selection based on gesture type
     * Ensures consistent selection behavior during swipe gestures
     * @param currentIndex - Current asset index being processed
     * @param assets - Array of all assets
     * @param selectedAssetIds - Currently selected asset IDs
     * @param onAssetToggle - Callback to toggle asset selection
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
    // STATE MANAGEMENT UTILITIES
    // ============================================================================
    
    /**
     * Reset all gesture state to initial values
     * Called when gesture ends or is cancelled
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
     * @returns Current gesture state object
     */
    const getGestureState = useCallback(() => gestureState, [gestureState]);

    // ============================================================================
    // SWIPE SELECTION GESTURE CREATION
    // ============================================================================
    
    /**
     * Create pan responder for swipe selection functionality
     * Handles multi-asset selection through swipe gestures
     * @param config - Gesture configuration
     * @param assets - Array of assets to select from
     * @param selectedAssetIds - Currently selected asset IDs
     * @param isScrolling - Whether user is currently scrolling
     * @param isSelectionMode - Whether in selection mode
     * @param callbacks - Callbacks for selection events
     * @returns PanResponder object or null if not in selection mode
     */
    const createSwipeSelectionPanResponder = useCallback((
        config: GestureConfig,
        assets: Asset[],
        selectedAssetIds: Set<string>,
        isScrolling: boolean,
        isSelectionMode: boolean,
        callbacks: {
            onAssetToggle: (assetId: string, shouldSelect: boolean) => void;
            onHoverChange?: (assetId: string | null) => void;
            onSwipeSelectingChange?: (isSelecting: boolean) => void;
        }
    ) => {
        if (!isSelectionMode) return null;

        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                return !isScrolling && (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10);
            },
            
            /**
             * Handle gesture start
             * Initialize gesture state and determine initial asset
             */
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
             * Handle gesture movement
             * Process selection based on movement direction and position
             */
            onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                const currentState = getGestureState();
                if (!currentState.gestureStartPosition) return;

                const currentPosition = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
                
                // If gesture is locked as scroll, don't process selection
                if (currentState.gestureLockedAsScroll) {
                    return;
                }
                
                // Check for vertical movement first (scrolling)
                if (!currentState.hasVerticalMovement) {
                    const hasVertical = hasSignificantVerticalMovement(currentState.gestureStartPosition, currentPosition);
                    
                    if (hasVertical) {
                        setGestureState(prev => ({
                            ...prev,
                            hasVerticalMovement: true,
                            gestureLockedAsScroll: true,
                            isSwipeSelecting: false
                        }));
                        callbacks.onSwipeSelectingChange?.(false);
                        return;
                    }
                }
                
                // Check for horizontal movement threshold (selection)
                if (!currentState.hasHorizontalMovement) {
                    const hasHorizontal = hasSufficientHorizontalMovement(currentState.gestureStartPosition, currentPosition);
                    
                    if (hasHorizontal) {
                        setGestureState(prev => ({
                            ...prev,
                            hasHorizontalMovement: true,
                            isSwipeSelecting: true
                        }));
                        callbacks.onSwipeSelectingChange?.(true);
                        
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
                            
                            callbacks.onHoverChange?.(initialAsset.id);
                            
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
                callbacks.onHoverChange?.(currentAsset?.id || null);
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
             * Handle gesture release
             * Clean up state and callbacks
             */
            onPanResponderRelease: () => {
                callbacks.onSwipeSelectingChange?.(false);
                callbacks.onHoverChange?.(null);
                resetGestureState();
            },

            /**
             * Handle gesture termination
             * Clean up state and callbacks
             */
            onPanResponderTerminate: () => {
                callbacks.onSwipeSelectingChange?.(false);
                callbacks.onHoverChange?.(null);
                resetGestureState();
            },
        });
    }, [getGestureState, hasSignificantVerticalMovement, hasSufficientHorizontalMovement, getItemAtPosition, processDeterministicSelection, resetGestureState]);

    // ============================================================================
    // DRAG AND DROP GESTURE CREATION
    // ============================================================================
    
    /**
     * Create gesture handler for drag and drop functionality
     * Supports dragging both assets and albums to different positions
     * @param config - Gesture configuration
     * @param assets - Array of assets
     * @param subAlbums - Array of sub-albums
     * @param isSelectionMode - Whether in selection mode
     * @param callbacks - Callbacks for drag events
     * @returns Gesture object or null if in selection mode
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
        if (isSelectionMode) {
            return null;
        }

        return Gesture.Pan()
            .minDistance(5) // Require minimum distance to start drag
            .onBegin(() => {
                'worklet';
            })
            /**
             * Handle drag start
             * Determine what type of item is being dragged and its index
             */
            .onStart((event) => {
                'worklet';
                const touchX = event.x;
                const touchY = event.y;
                
                const albumSectionHeight = config.albumSectionHeight || (subAlbums.length > 0 ? 100 : 0);
                const isInAlbumSection = touchY < albumSectionHeight;
                
                if (isInAlbumSection && subAlbums.length > 0) {
                    // Handle album drag
                    const albumItemHeight = config.albumItemHeight || 120;
                    const albumItemsPerRow = config.albumItemsPerRow || 3;
                    const screenWidth = config.screenWidth || 375;
                    
                    const albumIndex = Math.floor(touchY / albumItemHeight) * albumItemsPerRow + Math.floor(touchX / (screenWidth / albumItemsPerRow));
                    
                    if (albumIndex >= 0 && albumIndex < subAlbums.length) {
                        dragStartIndex.value = albumIndex;
                        dragStartType.value = 'album';
                        runOnJS(callbacks.onDragStart)('album', albumIndex);
                    }
                } else {
                    // Handle asset drag
                    const assetIndex = getGridPositionWorklet(touchX, touchY - 200, config, assets.length);
                    
                    if (assetIndex !== null && assetIndex >= 0 && assetIndex < assets.length) {
                        dragStartIndex.value = assetIndex;
                        dragStartType.value = 'asset';
                        runOnJS(callbacks.onDragStart)('asset', assetIndex);
                    }
                }
            })

            /**
             * Handle drag update
             * Track current drag position and update drop target
             */
            .onUpdate((event) => {
                'worklet';
                const currentX = event.x;
                const currentY = event.y;

                const albumSectionHeight = config.albumSectionHeight || (subAlbums.length > 0 ? 100 : 0);
                const isInAlbumSection = currentY < albumSectionHeight;
                
                if (isInAlbumSection && subAlbums.length > 0) {
                    // Update album drop target
                    const albumItemHeight = config.albumItemHeight || 120;
                    const albumItemsPerRow = config.albumItemsPerRow || 3;
                    const screenWidth = config.screenWidth || 375;
                    
                    const albumIndex = Math.floor(currentY / albumItemHeight) * albumItemsPerRow + Math.floor(currentX / (screenWidth / albumItemsPerRow));
                    
                    if (albumIndex >= 0 && albumIndex < subAlbums.length) {
                        dragLastDropTarget.value = albumIndex;
                        runOnJS(callbacks.onDragUpdate)('album', albumIndex);
                    } else {
                        dragLastDropTarget.value = -1;
                        runOnJS(callbacks.onDragUpdate)('album', null);
                    }
                } else {
                    // Update asset drop target
                    const assetIndex = getGridPositionWorklet(currentX, currentY - 200, config, assets.length);
                    
                    if (assetIndex !== null && assetIndex >= 0 && assetIndex < assets.length) {
                        dragLastDropTarget.value = assetIndex;
                        runOnJS(callbacks.onDragUpdate)('asset', assetIndex);
                    } else {
                        dragLastDropTarget.value = -1;
                        runOnJS(callbacks.onDragUpdate)('asset', null);
                    }
                }
            })

            /**
             * Handle drag end
             * Complete the drag operation and trigger reordering
             */
            .onEnd((event) => {
                'worklet';
                
                // Use the last drop target from onDragUpdate instead of recalculating
                const toIndex = dragLastDropTarget.value;
                const fromIndex = dragStartIndex.value;
                const dragType = dragStartType.value;
            
                // Always call onDragEnd to reset state, even if no valid drop target
                runOnJS(callbacks.onDragEnd)(
                    fromIndex >= 0 ? fromIndex : 0, 
                    toIndex >= 0 ? toIndex : (fromIndex >= 0 ? fromIndex : 0), 
                    dragType || 'asset'
                );
                
                // Reset tracking variables AFTER using them
                dragStartIndex.value = -1;
                dragStartType.value = null;
                dragLastDropTarget.value = -1;
            });
    }, [getGridPositionWorklet]);

    // ============================================================================
    // SLIDER GESTURE CREATION
    // ============================================================================
    
    /**
     * Create basic slider gestures (pan, pinch, double tap)
     * Provides fundamental slider interaction without internal state management
     * @param config - Gesture configuration
     * @param assets - Array of assets
     * @param callbacks - Callbacks for gesture events
     * @returns Composed gesture object
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
         * Pan gesture for navigation and zoomed image movement
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
         * Pinch gesture for zoom functionality
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
         * Double tap gesture for quick zoom toggle
         */
        const doubleTapGesture = Gesture.Tap()
            .numberOfTaps(2)
            .onStart(() => {
                'worklet';
                runOnJS(callbacks.onDoubleTap)(1); // Current scale will be passed separately
            });

        /**
         * Compose all gestures to work simultaneously
         */
        return Gesture.Simultaneous(
            Gesture.Simultaneous(panGesture, pinchGesture),
            doubleTapGesture
        );
    }, []);

    /**
     * Create advanced slider gestures with internal state management
     * Provides complete slider functionality with automatic state handling
     * @param config - Gesture configuration
     * @param assets - Array of assets
     * @param sharedValues - Shared animated values for slider state
     * @param callbacks - Callbacks for index and asset changes
     * @returns Composed gesture object
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
         * Pan gesture with automatic state management
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
         * Pinch gesture with automatic scale constraints
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
         * Double tap gesture for quick zoom toggle
         */
        const doubleTapGesture = Gesture.Tap()
            .numberOfTaps(2)
            .onStart(() => {
                'worklet';
                if (sharedValues.scale.value > 1) {
                    // Zoom out to normal size
                    sharedValues.scale.value = withSpring(1);
                    sharedValues.savedScale.value = 1;
                    sharedValues.translateY.value = withSpring(0);
                    sharedValues.savedTranslateY.value = 0;
                } else {
                    // Zoom in to 2x
                    sharedValues.scale.value = withSpring(2);
                    sharedValues.savedScale.value = 2;
                }
            });

        /**
         * Compose all gestures to work simultaneously
         */
        return Gesture.Simultaneous(
            Gesture.Simultaneous(panGesture, pinchGesture),
            doubleTapGesture
        );
    }, []);

    // ============================================================================
    // UTILITY MANAGER CREATION
    // ============================================================================
    
    /**
     * Create selection manager with state and utility functions
     * Provides complete selection mode functionality
     * @returns Object with selection state and management functions
     */
    const createSelectionManager = useCallback(() => {
        const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
        const [isSelectionMode, setIsSelectionMode] = useState(false);

        /**
         * Enter selection mode with initial asset selected
         */
        const enterSelectionMode = useCallback((assetId: string, assets: Asset[], onSelectionChange?: (assets: Asset[]) => void) => {
            setIsSelectionMode(true);
            setSelectedAssetIds(new Set([assetId]));
            const selectedAsset = assets.find(asset => asset.id === assetId);
            if (selectedAsset && onSelectionChange) {
                onSelectionChange([selectedAsset]);
            }
        }, []);

        /**
         * Exit selection mode and clear selection
         */
        const exitSelectionMode = useCallback((onSelectionChange?: (assets: Asset[]) => void) => {
            setIsSelectionMode(false);
            setSelectedAssetIds(new Set());
            if (onSelectionChange) {
                onSelectionChange([]);
            }
        }, []);

        /**
         * Toggle selection of a specific asset
         */
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

        /**
         * Clear all selections and exit selection mode
         */
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
     * Create drag and drop manager with state and utility functions
     * Provides complete drag and drop functionality
     * @returns Object with drag state and management functions
     */
    const createDragAndDropManager = useCallback(() => {
        const [draggedItem, setDraggedItem] = useState<{ type: 'asset' | 'album', index: number } | null>(null);
        const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

        /**
         * Reset all drag state to initial values
         */
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
    // CONTEXT VALUE CREATION
    // ============================================================================
    
    /**
     * Create the context value with all gesture functionality
     */
    const contextValue: GestureContextType = useMemo(() => ({
        // Core gesture creation functions
        createSwipeSelectionPanResponder,
        createDragAndDropGesture,
        createSliderGestures,
        createAdvancedSliderGestures,
        
        // Utility manager creation functions
        createSelectionManager,
        createDragAndDropManager,
        
        // Position calculation utilities
        getItemAtPosition,
        getGridPositionWorklet,
        
        // Selection range utilities
        getAssetIndicesBetween,
        
        // Movement detection utilities
        hasSufficientHorizontalMovement,
        hasSignificantVerticalMovement,
        
        // State management functions
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

    // ============================================================================
    // RENDER
    // ============================================================================
    
    return (
        <GestureContext.Provider value={contextValue}>
            {children}
        </GestureContext.Provider>
    );
};

export default GestureProvider;