import { Text, View } from "react-native";
import { type Album } from "../types/album";

interface AlbumProps {
    album: Album;
}

const AlbumWithAssets = ({ album }: AlbumProps) => {
    
    // ============================================================================
    // RENDERERS
    // ============================================================================

    if (album.assets?.length === 0 && album.subAlbums?.length === 0) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-gray-500">No assets found</Text>
            </View>
        );
    }

    return (
        <View>
            <Text>Album: {album.name}</Text>
            {album.description && <Text>{album.description}</Text>}
            {album.assets && <Text>Assets: {album.assets.length}</Text>}
            {album.subAlbums && <Text>Sub-albums: {album.subAlbums.length}</Text>}
        </View>
    );
};

export default AlbumWithAssets;   