import { Album } from "@/types/album";
import Feather from '@expo/vector-icons/Feather';
import React from "react";
import { Dimensions, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useSetting } from "../constant/SettingProvider";
import { getLanguageText, Language } from "../lib/lang";

interface AlbumDirectoryProps {
    parentAlbum: Album | null;
    subAlbums: Album[];
    topLevelAlbums: Album[];
    currentAlbumId: string;
    selectedTargetAlbum: Album | null;
    onAlbumPress: (album: Album) => void;
    onParentPress: () => void;
    onAlbumSelect: (album: Album) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth >= 768;
const numColumns = isTablet ? 4 : 3;
const gap = 12;
const itemWidth = (screenWidth - (gap * (numColumns + 1)) - 32) / numColumns;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AlbumDirectory = ({
    parentAlbum,
    subAlbums,
    topLevelAlbums,
    currentAlbumId,
    selectedTargetAlbum,
    onAlbumPress,
    onParentPress,
    onAlbumSelect
}: AlbumDirectoryProps) => {
    const { language, theme } = useSetting();
    const text = getLanguageText(language as Language);

    // ============================================================================
    // RENDERERS
    // ============================================================================

    const renderParentAlbum = () => {
        if (!parentAlbum) return null;

        const isSelected = selectedTargetAlbum?.album_id === parentAlbum.album_id;
        const isCurrentAlbum = parentAlbum.album_id === currentAlbumId;

        return (
            <View className="mb-6">
                <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-sm font-medium mb-3 px-4`}>
                    {text.parentAlbum}
                </Text>
                <View className="px-4">
                    <TouchableOpacity
                        onPress={isCurrentAlbum ? () => onAlbumSelect(parentAlbum) : onParentPress}
                        activeOpacity={0.8}
                        className={`rounded-xl overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    >
                        <View className={`${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} rounded-xl overflow-hidden`}>
                            <View className="flex-row items-center p-4">
                                <View className={`w-12 h-12 rounded-lg items-center justify-center mr-3 ${
                                    isCurrentAlbum 
                                        ? 'bg-gray-100 dark:bg-gray-800' 
                                        : 'bg-blue-100 dark:bg-blue-900'
                                }`}>
                                    <Feather 
                                        name="folder" 
                                        size={20} 
                                        color={
                                            isCurrentAlbum
                                                ? theme === 'dark' ? '#94A3B8' : '#64748B'
                                                : theme === 'dark' ? '#60A5FA' : '#3B82F6'
                                        } 
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} font-semibold`}>
                                        {parentAlbum.name}
                                    </Text>
                                    <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-sm`}>
                                        {parentAlbum.totalAssets || 0} {parentAlbum.totalAssets === 1 ? text.asset : text.assets}
                                        {isCurrentAlbum && ` • ${text.currentAlbum}`}
                                    </Text>
                                </View>
                                <Feather 
                                    name="chevron-up" 
                                    size={20} 
                                    color={theme === 'dark' ? '#94A3B8' : '#64748B'} 
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    /**
     * Renders the top level albums.
     * @returns 
     */
    const renderTopLevelAlbums = () => {
        if (topLevelAlbums.length === 0) return null;

        return (
            <View className="mb-6">
                <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-sm font-medium mb-3 px-4`}>
                    {text.topLevelAlbums}
                </Text>
                <FlatList
                    data={topLevelAlbums}
                    renderItem={renderSubAlbum}
                    keyExtractor={(item) => item.album_id!}
                    numColumns={numColumns}
                    columnWrapperStyle={{ paddingHorizontal: 16 }}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                />
            </View>
        );
    };

    const renderSubAlbum = ({ item, index }: { item: Album; index: number }) => {
        const isSelected = selectedTargetAlbum?.album_id === item.album_id;
        const isCurrentAlbum = item.album_id === currentAlbumId;

        return (
            <View className="px-1" style={{ width: itemWidth }}>
                <TouchableOpacity
                    onPress={isCurrentAlbum ? () => onAlbumSelect(item) : () => onAlbumPress(item)}
                    activeOpacity={0.8}
                    className={`rounded-xl overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                >
                    <View className={`${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} rounded-xl overflow-hidden`}>
                        {/* Album Cover */}
                        <View className="aspect-square relative">
                            {item.cover_uri ? (
                                <View className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-t-xl" />
                            ) : (
                                <View className={`w-full h-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-t-xl flex items-center justify-center`}>
                                    <Feather name="folder" size={24} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                                </View>
                            )}
                            
                            {/* Current Album Indicator */}
                            {isCurrentAlbum && (
                                <View className="absolute top-2 left-2 bg-blue-500 rounded-full px-2 py-1">
                                    <Text className="text-white text-xs font-medium">
                                        {text.currentAlbum}
                                    </Text>
                                </View>
                            )}
                        </View>
                        
                        {/* Album Info */}
                        <View className="p-3">
                            <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} text-sm font-semibold mb-1`} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-xs`}>
                                {item.totalAssets || 0} {item.totalAssets === 1 ? text.asset : text.assets}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const renderSubAlbumsSection = () => {
        if (subAlbums.length === 0) return null;

        return (
            <View className="mb-6">
                <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-sm font-medium mb-3 px-4`}>
                    {text.subAlbums}
                </Text>
                <FlatList
                    data={subAlbums}
                    renderItem={renderSubAlbum}
                    keyExtractor={(item) => item.album_id!}
                    numColumns={numColumns}
                    columnWrapperStyle={{ paddingHorizontal: 16 }}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                />
            </View>
        );
    };

    const renderEmptyState = () => {
        return (
            <View className="flex-1 items-center justify-center px-8">
                <View className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} items-center justify-center mb-4`}>
                    <Feather name="folder" size={24} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                </View>
                <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} text-lg font-semibold mb-2 text-center`}>
                    {text.noSubAlbums}
                </Text>
                <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-sm text-center`}>
                    {text.noSubAlbumsDescription}
                </Text>
            </View>
        );
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <View className="flex-1">
            {renderParentAlbum()}
            {renderTopLevelAlbums()}
            {renderSubAlbumsSection()}
            {subAlbums.length === 0 && !parentAlbum && topLevelAlbums.length === 0 && renderEmptyState()}
        </View>
    );
};

export default AlbumDirectory;  