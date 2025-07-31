import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import React, { useCallback } from "react";
import { Dimensions, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { type Album } from "../types/album";

interface AlbumProps {
    album: Album;
    onAssetPress?: (asset: Asset) => void;
}

const AlbumWithAssets = ({ album, onAssetPress }: AlbumProps) => {
    // ============================================================================
    // CONSTANTS
    // ============================================================================
    const screenWidth = Dimensions.get('window').width;
    const isTablet = screenWidth >= 768;
    const numColumns = isTablet ? 9 : 5;
    const itemSize = screenWidth / numColumns; // Same as MediaLibrary - no spacing

    // ============================================================================
    // RENDERERS
    // ============================================================================

    /**
     * Render individual asset item
     * @param asset - The asset to render
     * @returns The rendered asset item
     */
    const AssetItem = useCallback(({ asset }: { asset: Asset }) => {
        return (
            <View 
                style={{
                    width: itemSize,
                    height: itemSize,
                    position: 'relative',
                }}
                onTouchEnd={() => onAssetPress?.(asset)}
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
            </View>
        );
    }, [itemSize, onAssetPress]);

    /**
     * Render asset item for FlatList
     * @param item - The item to render
     * @returns The rendered asset item
     */
    const renderAssetItem = useCallback(({ item }: { item: Asset }) => (
        <AssetItem asset={item} />
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
     * @returns The rendered sub-album item
     */
    const SubAlbumItem = useCallback(({ subAlbum }: { subAlbum: Album }) => {
        return (
            <TouchableOpacity
                className="bg-gray-100 rounded-lg p-4 mb-4"
                onPress={() => {
                    // Navigate to sub-album (implement navigation logic)
                    console.log('Navigate to sub-album:', subAlbum.album_id);
                }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900">
                            {subAlbum.name}
                        </Text>
                        {subAlbum.description && (
                            <Text className="text-sm text-gray-600 mt-1">
                                {subAlbum.description}
                            </Text>
                        )}
                        <Text className="text-xs text-gray-500 mt-2">
                            {subAlbum.totalAssets || 0} items
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#6B7280" />
                </View>
            </TouchableOpacity>
        );
    }, []);

    return (
        <View className="flex-1">
            {/* Sub-albums */}
            {album.subAlbums && album.subAlbums.length > 0 && (
                <View className="px-4 mb-4">
                    <Text className="text-lg font-semibold text-gray-900 mb-3">
                        Folders ({album.subAlbums.length})
                    </Text>
                    {album.subAlbums.map((subAlbum) => (
                        <SubAlbumItem key={subAlbum.album_id} subAlbum={subAlbum} />
                    ))}
                </View>
            )}

            {/* Assets Grid - Same as MediaLibrary */}
            {album.assets && album.assets.length > 0 ? (
                <>
                    <View className="px-4 mb-3">
                        <Text className="text-lg font-semibold text-gray-900">
                            Media ({album.assets.length})
                        </Text>
                    </View>
                    <FlatList
                        className="flex-1"
                        data={album.assets}
                        numColumns={numColumns}
                        renderItem={renderAssetItem}
                        keyExtractor={keyExtractor}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={20}
                        windowSize={10}
                        initialNumToRender={20}
                    />
                </>
            ) : (
                <View className="flex-1 items-center justify-center px-4">
                    <Feather name="image" size={48} color="#D1D5DB" />
                    <Text className="text-gray-500 text-center mt-4">
                        No media in this album yet
                    </Text>
                    <Text className="text-gray-400 text-center text-sm mt-2">
                        Tap the + button to add photos and videos
                    </Text>
                </View>
            )}
        </View>
    );
};

export default AlbumWithAssets;   