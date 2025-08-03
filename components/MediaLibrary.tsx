import { useSetting } from "@/constant/SettingProvider";
import { getExistingAssetIds } from "@/lib/db";
import { getLanguageText, Language } from "@/lib/lang";
import { getMediaLibrary } from "@/lib/media";
import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, GestureResponderEvent, Image, Modal, PanResponder, PanResponderGestureState, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MediaLibraryProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (assets: Asset[]) => void;
    albumId?: string; // Optional album ID to filter existing assets for specific album
}

/**
 * Asset item
 * @param param0
 * @returns
 */
const AssetItem = React.memo(({ 
    asset, 
    isSelected, 
    onToggle, 
    itemSize,
    isScrolling,
    isHovered
}: { 
    asset: Asset; 
    isSelected: boolean; 
    onToggle: (asset: Asset) => void; 
    itemSize: number;
    isScrolling: boolean;
    isHovered: boolean;
}) => {
    return (
        <TouchableOpacity
            style={{
                width: itemSize,
                height: itemSize,
                position: 'relative',
            }}
            onPress={() => onToggle(asset)}
            activeOpacity={0.7}
            delayPressIn={0}
            delayLongPress={0}
        >
            <Image 
                source={{ uri: asset.uri }} 
                className="w-full h-full object-cover"
            />
            
            {/* Hover overlay for visual feedback */}
            {isHovered && (
                <View className="absolute inset-0 bg-opacity-30" />
            )}
            
            {/* Selection checkmark - only show when selected */}
            {isSelected && (
                <View className="absolute top-1 right-1">
                    <View className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white items-center justify-center">
                        <Feather name="check" size={12} color="white" />
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
});

const MediaLibrary = ({ visible, onClose, onSelect, albumId }: MediaLibraryProps) => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [assets, setAssets] = useState<any[]>([]);
    const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
    const insets = useSafeAreaInsets();
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
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
    const [visitedRows, setVisitedRows] = useState<Set<number>>(new Set());
    const [rowToggleStates, setRowToggleStates] = useState<Map<number, boolean>>(new Map());
    const [currentRow, setCurrentRow] = useState<number | null>(null);
    const [scrollOffsetY, setScrollOffsetY] = useState(0);
    const [scrollOffsetX, setScrollOffsetX] = useState(0);

    // ============================================================================
    // REFS
    // ============================================================================
    const flatListRef = useRef<FlatList>(null);

    // ============================================================================
    // CONTEXT
    // ============================================================================
    const { language, theme } = useSetting();
    const text = getLanguageText(language as Language);

    // ============================================================================
    // CONSTANTS
    // ============================================================================
    const screenWidth = Dimensions.get('window').width;
    const isTablet = screenWidth >= 768;
    const numColumns = isTablet ? 9 : 5;
    const gap = 2; // 2px gap between items
    const itemSize = (screenWidth - (gap * (numColumns + 1))) / numColumns; // Account for gaps

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    /**
     * Get item at specific screen position
     */
    const getItemAtPosition = useCallback((position: { x: number; y: number }) => {
        // Calculate which item is at this position
        const adjustedX = position.x - gap + scrollOffsetX;
        const adjustedY = position.y - insets.top - 60 + scrollOffsetY; // Account for header height and scroll offset
        
        if (adjustedX < 0 || adjustedY < 0) return null;

        const column = Math.floor(adjustedX / (itemSize + gap));
        const row = Math.floor(adjustedY / (itemSize + gap));
        
        if (column < 0 || column >= numColumns || row < 0) return null;

        const index = row * numColumns + column;
        return filteredAssets[index] || null;
    }, [filteredAssets, itemSize, gap, numColumns, insets.top, scrollOffsetX, scrollOffsetY]);

    /**
     * Get row and column from position
     */
    const getRowAndColumnFromPosition = useCallback((position: { x: number; y: number }) => {
        const adjustedX = position.x - gap + scrollOffsetX;
        const adjustedY = position.y - insets.top - 60 + scrollOffsetY; // Account for header height and scroll offset
        
        if (adjustedX < 0 || adjustedY < 0) return { row: -1, column: -1 };

        const column = Math.floor(adjustedX / (itemSize + gap));
        const row = Math.floor(adjustedY / (itemSize + gap));
        
        return { row, column };
    }, [itemSize, gap, insets.top, scrollOffsetX, scrollOffsetY]);

    /**
     * Get items in a row range with precise start/end columns
     */
    const getItemsInRowRange = useCallback((startRow: number, endRow: number, startColumn: number, endColumn: number) => {
        const items: Asset[] = [];
        
        for (let row = startRow; row <= endRow; row++) {
            const rowStartIndex = row * numColumns;
            const rowEndIndex = Math.min(rowStartIndex + numColumns, filteredAssets.length);
            
            // Determine column range for this row
            let colStart = 0;
            let colEnd = numColumns - 1;
            
            if (row === startRow) {
                colStart = startColumn;
            }
            if (row === endRow) {
                colEnd = endColumn;
            }
            
            // Add items in the column range for this row
            for (let col = colStart; col <= colEnd; col++) {
                const index = rowStartIndex + col;
                if (index < rowEndIndex && index < filteredAssets.length) {
                    items.push(filteredAssets[index]);
                }
            }
        }
        
        return items;
    }, [filteredAssets, numColumns]);

    /**
     * Get all assets along a path between two positions
     */
    const getAssetsAlongPath = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
        const assets: Asset[] = [];
        const startPos = getRowAndColumnFromPosition(start);
        const endPos = getRowAndColumnFromPosition(end);
        
        if (startPos.row === -1 || endPos.row === -1) return assets;
        
        // Calculate the path between start and end positions
        const dx = endPos.column - startPos.column;
        const dy = endPos.row - startPos.row;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        
        if (steps === 0) {
            // Same position, just return the asset at that position
            const asset = getItemAtPosition(start);
            if (asset) assets.push(asset);
            return assets;
        }
        
        // Sample points along the path
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const currentRow = Math.round(startPos.row + dy * t);
            const currentCol = Math.round(startPos.column + dx * t);
            
            const index = currentRow * numColumns + currentCol;
            if (index >= 0 && index < filteredAssets.length) {
                const asset = filteredAssets[index];
                if (asset && !assets.find(a => a.id === asset.id)) {
                    assets.push(asset);
                }
            }
        }
        
        return assets;
    }, [getRowAndColumnFromPosition, getItemAtPosition, filteredAssets, numColumns]);

    /**
     * Get all items between two positions with precise iOS-like selection
     */
    const getItemsBetweenPositions = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
        const startPos = getRowAndColumnFromPosition(start);
        const endPos = getRowAndColumnFromPosition(end);
        
        if (startPos.row === -1 || endPos.row === -1) return [];
        
        // Ensure start is always the "earlier" position (top-left to bottom-right)
        let actualStart = startPos;
        let actualEnd = endPos;
        
        if (startPos.row > endPos.row || (startPos.row === endPos.row && startPos.column > endPos.column)) {
            actualStart = endPos;
            actualEnd = startPos;
        }
        
        return getItemsInRowRange(actualStart.row, actualEnd.row, actualStart.column, actualEnd.column);
    }, [getRowAndColumnFromPosition, getItemsInRowRange]);

    /**
     * Check if position is near screen edges for auto-scroll
     */
    const isNearEdge = useCallback((position: { x: number; y: number }) => {
        const screenHeight = Dimensions.get('window').height;
        const edgeThreshold = 100; // pixels from edge
        
        return {
            nearTop: position.y < edgeThreshold,
            nearBottom: position.y > screenHeight - edgeThreshold
        };
    }, []);

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
        const horizontalThreshold = 15; // Increased to 15px for better scroll detection
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
     * Optimized asset selection processing with memoization
     */
    const processAssetSelectionOptimized = useCallback((asset: Asset, shouldSelect: boolean) => {
        const assetId = asset.id;
        const isCurrentlySelected = selectedAssetIds.has(assetId);
        
        // Only update if state actually needs to change
        if (shouldSelect && !isCurrentlySelected) {
            setSelectedAssetIds(prev => new Set([...prev, assetId]));
        } else if (!shouldSelect && isCurrentlySelected) {
            setSelectedAssetIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(assetId);
                return newSet;
            });
        }
        
        // Track as processed to avoid duplicate work
        setToggledAssetIds(prev => new Set([...prev, assetId]));
    }, [selectedAssetIds]);

    /**
     * Process selection for all assets between start and current position
     */
    const processSelectionRange = useCallback((startIndex: number, currentIndex: number) => {
        if (initialAssetIndex === null || isDeselectGesture === null) return;
        
        // Get all indices between start and current position
        const indicesToProcess = getAssetIndicesBetween(startIndex, currentIndex);
        
        // Process only assets that haven't been toggled yet
        indicesToProcess.forEach(index => {
            if (index >= 0 && index < filteredAssets.length) {
                const asset = filteredAssets[index];
                if (!toggledAssetIds.has(asset.id)) {
                    processAssetSelectionOptimized(asset, !isDeselectGesture);
                }
            }
        });
        
        setLastProcessedIndex(currentIndex);
    }, [initialAssetIndex, isDeselectGesture, filteredAssets, toggledAssetIds, getAssetIndicesBetween, processAssetSelectionOptimized]);

    /**
     * Get all assets in a specific row
     */
    const getAssetsInRow = useCallback((row: number) => {
        if (row < 0) return [];
        const startIndex = row * numColumns;
        const endIndex = Math.min(startIndex + numColumns, filteredAssets.length);
        return filteredAssets.slice(startIndex, endIndex);
    }, [filteredAssets, numColumns]);

    /**
     * Process entire row selection/deselection
     */
    const processRowSelection = useCallback((row: number, shouldSelect: boolean) => {
        const rowAssets = getAssetsInRow(row);
        
        rowAssets.forEach(asset => {
            const isCurrentlySelected = selectedAssetIds.has(asset.id);
            
            if (shouldSelect && !isCurrentlySelected) {
                setSelectedAssetIds(prev => new Set([...prev, asset.id]));
            } else if (!shouldSelect && isCurrentlySelected) {
                setSelectedAssetIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(asset.id);
                    return newSet;
                });
            }
            
            // Track all assets in this row as processed
            setToggledAssetIds(prev => new Set([...prev, asset.id]));
        });
        
        // Track row toggle state
        setRowToggleStates(prev => new Map(prev).set(row, shouldSelect));
        setVisitedRows(prev => new Set([...prev, row]));
    }, [getAssetsInRow, selectedAssetIds]);

    /**
     * Determine if we should select based on current asset state and direction
     */
    const shouldSelectAsset = useCallback((asset: Asset, isMovingDown: boolean = false) => {
        const isCurrentlySelected = selectedAssetIds.has(asset.id);
        
        // If asset hasn't been toggled in this gesture, toggle based on current state
        if (!toggledAssetIds.has(asset.id)) {
            return !isCurrentlySelected; // Toggle: unselected → select, selected → deselect
        }
        
        // If asset has been toggled, maintain its current state
        return isCurrentlySelected;
    }, [selectedAssetIds, toggledAssetIds]);

    /**
     * Process asset with directional awareness
     */
    const processAssetWithDirection = useCallback((asset: Asset, previousRow: number | null) => {
        const assetRow = Math.floor(filteredAssets.indexOf(asset) / numColumns);
        
        // Check if we're moving to a new row
        if (previousRow !== null && assetRow !== previousRow) {
            const isMovingDown = assetRow > previousRow;
            
            // Process the entire row based on direction
            if (isMovingDown) {
                // Moving down: select new rows
                processRowSelection(assetRow, true);
            } else {
                // Moving up: deselect previously selected rows
                if (visitedRows.has(assetRow) && rowToggleStates.get(assetRow)) {
                    processRowSelection(assetRow, false);
                }
            }
        } else {
            // Same row: process individual asset
            const shouldSelect = shouldSelectAsset(asset);
            processAssetSelectionOptimized(asset, shouldSelect);
        }
        
        setCurrentRow(assetRow);
    }, [filteredAssets, numColumns, visitedRows, rowToggleStates, shouldSelectAsset, processRowSelection, processAssetSelectionOptimized]);

    /**
     * Process deterministic selection based on gesture type
     */
    const processDeterministicSelection = useCallback((currentIndex: number) => {
        if (initialAssetIndex === null || isDeselectGesture === null) return;
        
        // Get all indices between initial and current position
        const indicesToProcess = getAssetIndicesBetween(initialAssetIndex, currentIndex);
        
        indicesToProcess.forEach(index => {
            if (index >= 0 && index < filteredAssets.length) {
                const asset = filteredAssets[index];
                const assetId = asset.id;
                
                // Only process if not already toggled in this gesture
                if (!toggledAssetIds.has(assetId)) {
                    const isCurrentlySelected = selectedAssetIds.has(assetId);
                    
                    if (isDeselectGesture) {
                        // Deselect gesture: unselect if currently selected
                        if (isCurrentlySelected) {
                            setSelectedAssetIds(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(assetId);
                                return newSet;
                            });
                        }
                    } else {
                        // Select gesture: select if currently unselected
                        if (!isCurrentlySelected) {
                            setSelectedAssetIds(prev => new Set([...prev, assetId]));
                        }
                    }
                    
                    // Track this asset as toggled
                    setToggledAssetIds(prev => new Set([...prev, assetId]));
                }
            }
        });
        
        setLastProcessedIndex(currentIndex);
    }, [initialAssetIndex, isDeselectGesture, filteredAssets, selectedAssetIds, toggledAssetIds, getAssetIndicesBetween]);

    // ============================================================================
    // PAN RESPONDER
    // ============================================================================
    const panResponder = useMemo(() => PanResponder.create({
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
            setVisitedRows(new Set());
            setRowToggleStates(new Map());
            setCurrentRow(null);
            
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
                        const initialIndex = filteredAssets.indexOf(initialAsset);
                        setInitialAssetIndex(initialIndex);
                        
                        // Determine gesture type based on initial asset's selection state
                        const isCurrentlySelected = selectedAssetIds.has(initialAsset.id);
                        setIsDeselectGesture(isCurrentlySelected);
                        
                        // Process the initial asset
                        processDeterministicSelection(initialIndex);
                        setLastProcessedAssetId(initialAsset.id);
                        setCurrentHoverAssetId(initialAsset.id);
                        
                        // Set initial row
                        const initialRow = Math.floor(initialIndex / numColumns);
                        setCurrentRow(initialRow);
                        setVisitedRows(new Set([initialRow]));
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
                const currentIndex = filteredAssets.indexOf(currentAsset);
                
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
            setVisitedRows(new Set());
            setRowToggleStates(new Map());
            setCurrentRow(null);
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
            setVisitedRows(new Set());
            setRowToggleStates(new Map());
            setCurrentRow(null);
        },
    }), [isScrolling, isSwipeSelecting, selectedAssetIds, toggledAssetIds, lastProcessedAssetId, currentRow, filteredAssets, numColumns, getItemAtPosition, processDeterministicSelection, hasHorizontalMovement, hasSufficientHorizontalMovement, hasVerticalMovement, hasSignificantVerticalMovement, gestureStartPosition, gestureLockedAsScroll, scrollOffsetX, scrollOffsetY]);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    /**
     * Reset scroll offset
     */
    const resetScrollOffset = useCallback(() => {
        setScrollOffsetX(0);
        setScrollOffsetY(0);
    }, []);

    /**
     * Fetch assets and filter out existing ones
     */
    useEffect(() => {
        if (visible) {
            // Reset scroll offset when modal becomes visible
            resetScrollOffset();
            
            (async () => {
                setIsLoading(true);
                try {
                    const { assets, success } = await getMediaLibrary();
                    if (success) {
                        const mediaAssets = assets?.assets || [];
                        setAssets(mediaAssets);
                        
                        // Get existing asset IDs from database
                        const existingAssetIds = await getExistingAssetIds();
                        
                        // Filter out assets that already exist in database
                        const newAssets = mediaAssets.filter(asset => !existingAssetIds.has(asset.id));
                        setFilteredAssets(newAssets);
                        
                    } else {
                        console.error('Failed to retrieve media library assets');
                        setFilteredAssets([]);
                    }
                } catch (error) {
                    console.error('Error fetching and filtering assets:', error);
                    setFilteredAssets([]);
                } finally {
                    setIsLoading(false);
                }
            })();
        }
    }, [visible, resetScrollOffset]);

    /**
     * Toggle asset selection
     */
    const toggleAssetSelection = useCallback((asset: Asset) => {
        setSelectedAssetIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(asset.id)) {
                newSet.delete(asset.id);
            } else {
                newSet.add(asset.id);
            }
            return newSet;
        });
    }, []);

    /**
     * Handle swipe selection
     */
    const handleSwipeSelect = useCallback((asset: Asset, select: boolean) => {
        setSelectedAssetIds(prev => {
            const newSet = new Set(prev);
            if (select) {
                newSet.add(asset.id);
            } else {
                newSet.delete(asset.id);
            }
            return newSet;
        });
    }, []);

    /**
     * Handle close and save selected assets
     */
    const handleClose = useCallback(() => {
        if (selectedAssetIds.size > 0) {
            const selectedAssets = filteredAssets.filter(asset => selectedAssetIds.has(asset.id));
            onSelect(selectedAssets);
        }
        resetScrollOffset();
        onClose();
    }, [selectedAssetIds, filteredAssets, onSelect, onClose, resetScrollOffset]);

    /**
     * Handle scroll events to track offset
     */
    const handleScroll = useCallback((event: any) => {
        const { contentOffset } = event.nativeEvent;
        setScrollOffsetY(contentOffset.y);
        setScrollOffsetX(contentOffset.x || 0);
    }, []);

    // ============================================================================
    // RENDERERS
    // ============================================================================

    /**
     * Render item
     */
    const renderItem = useCallback(({ item }: { item: Asset }) => {
        const isSelected = selectedAssetIds.has(item.id);
        const isHovered = currentHoverAssetId === item.id;
        return (
            <AssetItem 
                asset={item}
                isSelected={isSelected}
                onToggle={toggleAssetSelection}
                itemSize={itemSize}
                isScrolling={isScrolling}
                isHovered={isHovered}
            />
        );
    }, [selectedAssetIds, toggleAssetSelection, itemSize, isScrolling, currentHoverAssetId]);

    const keyExtractor = useCallback((item: Asset) => item.id, []);

    const headerComponent = useMemo(() => (
        <View 
            className={`flex-row justify-between items-center px-4 py-3 ${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} border-b ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'}`}
            style={{ paddingTop: insets.top }}
        >
            <View className="flex-row items-center">
                <Text className={`text-lg font-semibold ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>
                    {text.mediaLibrary}
                </Text>
                {selectedAssetIds.size > 0 && (
                    <Text className="ml-2 text-sm text-blue-500 font-medium">
                        ({selectedAssetIds.size} {text.selected})
                    </Text>
                )}
                {!isLoading && (
                    <Text className={`ml-2 text-xs ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                        {filteredAssets.length} {text.available}
                    </Text>
                )}
            </View>
            <Text
                className={`text-lg ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}
                onPress={handleClose}
            >
                <Feather name="x" size={24} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />
            </Text>
        </View>
    ), [selectedAssetIds.size, filteredAssets.length, insets.top, handleClose, isLoading, text, theme]);

    // Loading component
    const loadingComponent = useMemo(() => (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator 
                size="large" 
                color={theme === 'dark' ? '#60a5fa' : '#3b82f6'} 
            />
            <Text className={`mt-4 text-base ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                {text.loadingAlbum || 'Loading media library...'}
            </Text>
        </View>
    ), [theme, text]);

    return (
        <Modal visible={visible} animationType="slide">
            <View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>
                {/* Header */}
                {headerComponent}

                {/* Content */}
                {isLoading ? (
                    loadingComponent
                ) : (
                    /* Grid with Pan Responder */
                    <View 
                        className="flex-1"
                        {...panResponder.panHandlers}
                    >
                        <FlatList
                            ref={flatListRef}
                            className="flex-1"
                            data={filteredAssets}
                            numColumns={numColumns}
                            renderItem={renderItem}
                            keyExtractor={keyExtractor}
                            showsVerticalScrollIndicator={false}
                            removeClippedSubviews={true}
                            maxToRenderPerBatch={20}
                            windowSize={10}
                            initialNumToRender={20}
                            columnWrapperStyle={{ gap: gap }}
                            contentContainerStyle={{ gap: gap, paddingHorizontal: gap }}
                            scrollEventThrottle={16}
                            onScroll={handleScroll}
                            onScrollBeginDrag={() => setIsScrolling(true)}
                            onScrollEndDrag={() => setIsScrolling(false)}
                            onMomentumScrollBegin={() => setIsScrolling(true)}
                            onMomentumScrollEnd={() => setIsScrolling(false)}
                        />
                    </View>
                )}
            </View>
        </Modal>
    );
};

export default MediaLibrary;