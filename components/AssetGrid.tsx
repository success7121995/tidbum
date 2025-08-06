import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import React, { useRef } from "react";
import { FlatList, Text, View } from "react-native";

interface AssetGridProps {
    assets: Asset[];
    renderAssetItem: (item: { item: Asset; index: number }) => React.ReactElement;
    keyExtractor: (item: Asset) => string;
    onScroll?: (event: any) => void;
    onScrollBeginDrag?: () => void;
    onScrollEndDrag?: () => void;
    onMomentumScrollBegin?: () => void;
    onMomentumScrollEnd?: () => void;
    swipeSelectionPanResponder?: any;
    text: any;
    theme: string;
    isSelectionMode?: boolean;
    numColumns: number;
    gap: number;
    emptyMessage?: string;
    emptySubMessage?: string;
    draggedItem?: { type: 'asset' | 'album', index: number } | null;
    isSwapMode?: boolean;
    onSwapModeChange?: (isSwapMode: boolean) => void;
}

const AssetGrid = ({ 
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
    isSelectionMode = false,
    numColumns,
    gap,
    emptyMessage = text.noMediaYet,
    emptySubMessage = text.tapToAdd,
    draggedItem,
    onSwapModeChange,
    isSwapMode = false,
}: AssetGridProps) => {
    const flatListRef = useRef<FlatList>(null);

    if (!assets || assets.length === 0) {
        return (
            <View className="flex-1 items-center justify-center px-4">
                <Feather name="image" size={48} color={theme === 'dark' ? '#cbd5e1' : '#64748b'} />
                <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-center mt-4`}>
                    {emptyMessage}
                </Text>
                <Text className={`${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'} text-center text-sm mt-2`}>
                    {emptySubMessage}
                </Text>
            </View>
        );
    }

    return (
        <>
            <View className="px-4 mb-3 flex-row justify-between items-center">

                <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} font-medium text-lg`}>
                    {text.media} ({assets.length})
                </Text>
            </View>
            <View 
                className="flex-1 relative"
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
                    // Disable scroll when dragging assets
                    scrollEnabled={!draggedItem || draggedItem.type !== 'asset'}
                />
            
            </View>
        </>
    );
};

export default AssetGrid; 