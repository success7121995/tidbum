import { useSetting } from "@/constant/SettingProvider";
import { getLanguageText, Language } from "@/lib/lang";
import Feather from '@expo/vector-icons/Feather';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Asset } from "../types/asset";

interface CoverImageModalProps {
    visible: boolean;
    onClose: () => void;
    assets: Asset[];
    currentCoverUri?: string;
    onSelectCover: (asset: Asset | null) => void;
}

/**
 * Asset item for cover image selection
 */
const CoverAssetItem = React.memo(({ 
    asset, 
    isSelected, 
    onSelect, 
    itemSize,
    isCurrentCover
}: { 
    asset: Asset; 
    isSelected: boolean; 
    onSelect: (asset: Asset) => void; 
    itemSize: number;
    isCurrentCover: boolean;
}) => {
    return (
        <TouchableOpacity
            style={{
                width: itemSize,
                height: itemSize,
                position: 'relative',
            }}
            onPress={() => onSelect(asset)}
            activeOpacity={0.7}
        >
            <Image 
                source={{ uri: asset.uri }} 
                className="w-full h-full object-cover"
            />
            
            {/* Selection checkmark - show when selected */}
            {isSelected && (
                <View className="absolute top-1 right-1">
                    <View className="w-6 h-6 rounded-full border-2 border-white items-center justify-center bg-blue-500">
                        <Feather 
                            name="check" 
                            size={12} 
                            color="white" 
                        />
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
});

const CoverImageModal = ({ visible, onClose, assets, currentCoverUri, onSelectCover }: CoverImageModalProps) => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
    const insets = useSafeAreaInsets();

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
    // EFFECTS
    // ============================================================================

    /**
     * Filter assets to only include photos and set default selection when modal opens
     */
    useEffect(() => {
        if (visible) {
            // Filter assets to only include photos
            const photoAssets = assets.filter(asset => 
                asset.mediaType === 'photo' || asset.media_type === 'photo'
            );
            setFilteredAssets(photoAssets);
            
            // Set current cover image as selected by default
            if (currentCoverUri) {
                const currentCoverAsset = photoAssets.find(asset => asset.uri === currentCoverUri);
                setSelectedAsset(currentCoverAsset || null);
            } else {
                setSelectedAsset(null);
            }
        }
    }, [visible, assets, currentCoverUri]);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    /**
     * Handle asset selection/deselection
     */
    const handleAssetSelect = useCallback((asset: Asset) => {
        setSelectedAsset(prev => prev?.id === asset.id ? null : asset);
    }, []);

    /**
     * Handle close modal
     */
    const handleCloseModal = useCallback(() => {
        onClose();
    }, [onClose]);

    /**
     * Handle change cover image
     */
    const handleChangeCoverImage = useCallback(() => {
        if (filteredAssets.length === 0) {
            Alert.alert(text.noPhotosAvailable, text.noPhotosAvailableMessage);
            return;
        }
        onSelectCover(selectedAsset);
        onClose();
    }, [selectedAsset, onSelectCover, onClose, filteredAssets.length]);

    // ============================================================================
    // RENDERERS
    // ============================================================================

    /**
     * Render item
     */
    const renderItem = useCallback(({ item }: { item: Asset }) => {
        const isSelected = selectedAsset?.id === item.id;
        const isCurrentCover = currentCoverUri === item.uri;
        
        return (
            <CoverAssetItem 
                asset={item}
                isSelected={isSelected}
                onSelect={handleAssetSelect}
                itemSize={itemSize}
                isCurrentCover={isCurrentCover}
            />
        );
    }, [selectedAsset, currentCoverUri, handleAssetSelect, itemSize]);

    const keyExtractor = useCallback((item: Asset) => item.id, []);

    const headerComponent = useMemo(() => (
        <View 
            className={`flex-row justify-between items-center px-4 py-3 ${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} border-b ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'}`}
            style={{ paddingTop: insets.top }}
        >
            <View className="flex-row items-center">
                <Text className={`text-lg font-semibold ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>
                    {text.selectCoverImage}
                </Text>
            </View>
            <TouchableOpacity onPress={handleCloseModal}>
                <Feather 
                    name="x" 
                    size={24} 
                    color={theme === 'dark' ? '#cbd5e1' : '#475569'} 
                />
            </TouchableOpacity>
        </View>
    ), [filteredAssets.length, insets.top, handleCloseModal, theme]);

    const bottomBarComponent = useMemo(() => {
        // Determine if we're removing the current cover (current cover was selected but now deselected)
        const isRemovingCurrentCover = !selectedAsset && currentCoverUri;
        
        let buttonText = text.changeCover;
        if (isRemovingCurrentCover) {
            buttonText = text.removeCover;
        }
        
        return (
            <View 
                className={`flex-row justify-between items-center px-4 py-3 ${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} border-t ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'}`}
                style={{ paddingBottom: insets.bottom }}
            >
                <View className="flex-1">
                    {selectedAsset ? (
                        <Text className={`text-sm ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                            {text.selectedCoverImage}: {selectedAsset.filename}
                        </Text>
                    ) : (
                        <Text className={`text-sm ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                            {text.noImageSelected}
                        </Text>
                    )}
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={handleCloseModal}
                        className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-dark-border' : 'bg-light-border'}`}
                    >
                        <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>
                            {text.cancel}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleChangeCoverImage}
                        className={`px-4 py-2 rounded-lg ${isRemovingCurrentCover ? 'bg-red-500' : 'bg-blue-500'}`}
                    >
                        <Text className="text-white font-medium">
                            {buttonText}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }, [selectedAsset, currentCoverUri, insets.bottom, handleCloseModal, handleChangeCoverImage, theme]);

    // Loading component
    const loadingComponent = useMemo(() => (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator 
                size="large" 
                color={theme === 'dark' ? '#60a5fa' : '#3b82f6'} 
            />
            <Text className={`mt-4 text-base ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                Loading photos...
            </Text>
        </View>
    ), [theme]);

    return (
        <Modal visible={visible} animationType="slide">
            <View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>
                {/* Header */}
                {headerComponent}

                {/* Content */}
                {filteredAssets.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <Feather 
                            name="image" 
                            size={48} 
                            color={theme === 'dark' ? '#64748b' : '#94a3b8'} 
                        />
                        <Text className={`mt-4 text-base ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                            No photos available
                        </Text>
                    </View>
                ) : (
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
                )}

                {/* Bottom Bar */}
                {bottomBarComponent}
            </View>
        </Modal>
    );
};

export default CoverImageModal;