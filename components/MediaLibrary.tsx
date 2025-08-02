import { useSetting } from "@/constant/SettingProvider";
import { getExistingAssetIds } from "@/lib/db";
import { getLanguageText, Language } from "@/lib/lang";
import { getMediaLibrary } from "@/lib/media";
import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, FlatList, Image, Modal, Text, View } from "react-native";
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
    itemSize 
}: { 
    asset: Asset; 
    isSelected: boolean; 
    onToggle: (asset: Asset) => void; 
    itemSize: number;
}) => {
    return (
        <View 
            style={{
                width: itemSize,
                height: itemSize,
                position: 'relative',
            }}
            onTouchEnd={() => onToggle(asset)}
        >
            <Image 
                source={{ uri: asset.uri }} 
                className="w-full h-full object-cover"
            />
            
            {/* Selection checkmark - only show when selected */}
            {isSelected && (
                <View className="absolute top-1 right-1">
                    <View className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white items-center justify-center">
                        <Feather name="check" size={12} color="white" />
                    </View>
                </View>
            )}
        </View>
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
    // HANDLERS
    // ============================================================================

    /**
     * Fetch assets and filter out existing ones
     */
    useEffect(() => {
        if (visible) {
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
    }, [visible]);

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
     * Handle close and save selected assets
     */
    const handleClose = useCallback(() => {
        if (selectedAssetIds.size > 0) {
            const selectedAssets = filteredAssets.filter(asset => selectedAssetIds.has(asset.id));
            onSelect(selectedAssets);
        }
        onClose();
    }, [selectedAssetIds, filteredAssets, onSelect, onClose]);

    // ============================================================================
    // RENDERERS
    // ============================================================================

    /**
     * Render item
     */
    const renderItem = useCallback(({ item }: { item: Asset }) => {
        const isSelected = selectedAssetIds.has(item.id);
        return (
            <AssetItem 
                asset={item}
                isSelected={isSelected}
                onToggle={toggleAssetSelection}
                itemSize={itemSize}
            />
        );
    }, [selectedAssetIds, toggleAssetSelection, itemSize]);

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

    return (
        <Modal visible={visible} animationType="slide">
            <View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>
                {/* Header */}
                {headerComponent}

                {/* Grid */}
                <FlatList
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
                />
            </View>
        </Modal>
    );
};

export default MediaLibrary;