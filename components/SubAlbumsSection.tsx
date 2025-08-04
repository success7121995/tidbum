import Feather from '@expo/vector-icons/Feather';
import React, { useRef } from "react";
import { Dimensions, FlatList, Text, TouchableOpacity, View } from "react-native";
import { type Album } from "../types/album";

// ============================================================================
// CONSTANTS
// ============================================================================
const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth >= 768;

// ============================================================================
// TYPES
// ============================================================================
interface SubAlbumsSectionProps {
    subAlbums: Album[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onAlbumDelete: (albumId: string) => void;
    draggedItem: { type: 'asset' | 'album', index: number } | null;
    dropTargetIndex: number | null;
    renderSubAlbumItem: any;
    text: any;
    theme: string;
}

// ============================================================================
// SUB-ALBUMS SECTION COMPONENT
// ============================================================================
const SubAlbumsSection = ({ 
    subAlbums, 
    isExpanded, 
    onToggleExpand, 
    onAlbumDelete, 
    draggedItem, 
    dropTargetIndex, 
    renderSubAlbumItem, 
    text, 
    theme 
}: SubAlbumsSectionProps) => {
    const albumListRef = useRef<FlatList>(null);

    if (!subAlbums || subAlbums.length === 0) return null;

    return (
        <View className="px-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
                <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} font-medium text-lg`}>
                    {text.folders} ({subAlbums.length}) 
                </Text>
                <TouchableOpacity onPress={onToggleExpand} className="p-2">
                    <Feather 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={theme === 'dark' ? '#cbd5e1' : '#64748b'} 
                    />
                </TouchableOpacity>
            </View>
            {isExpanded && (
                <FlatList
                    ref={albumListRef}
                    data={subAlbums}
                    renderItem={renderSubAlbumItem}
                    keyExtractor={(item) => item.album_id || ''}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                    removeClippedSubviews={false}
                    getItemLayout={(data, index) => ({
                        length: isTablet ? 160 : 140,
                        offset: (isTablet ? 160 : 140) * index,
                        index,
                    })}
                />
            )}
        </View>
    );
};

export default SubAlbumsSection;   