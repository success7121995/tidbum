import { useSetting } from "@/constant/SettingProvider";
import { getLanguageText, Language } from "@/lib/lang";
import { type Album } from "@/types/album";
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image, Text, TouchableOpacity, View } from "react-native";

interface AlbumHeaderProps {
	album: Album;
	onEditAlbum?: () => void;
	onAddAssets?: () => void;
	onDeleteAlbum?: () => void;
	onCoverImage?: () => void;
}

const AlbumHeader = ({ album, onEditAlbum, onAddAssets, onDeleteAlbum, onCoverImage }: AlbumHeaderProps) => {
    // ============================================================================
    // CONTEXT
    // ============================================================================
    const { language, theme } = useSetting();
    const text = getLanguageText(language as Language);

    // ============================================================================
    // RENDERERS
    // ============================================================================

    return (
        <View className={`px-4 py-4 mb-5 border-b ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'}`}>
            <View className="flex-row items-start justify-between">
                {/* Cover Image */}
                <TouchableOpacity 
                    onPress={onCoverImage}
                    className="mr-4"
                >
                    {album.cover_uri ? (
                        <Image 
                            source={{ uri: album.cover_uri }} 
                            className="w-20 h-20 rounded-lg"
                            style={{ resizeMode: 'cover' }}
                        />
                    ) : (
                        <View className={`w-20 h-20 rounded-lg items-center justify-center ${theme === 'dark' ? 'bg-dark-border' : 'bg-light-border'}`}>
                            <Feather name="image" size={24} color={theme === 'dark' ? '#64748b' : '#94a3b8'} />
                        </View>
                    )}
                </TouchableOpacity>

                <View className="flex-1 gap-1">
                    <Text className={`text-2xl font-bold ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>{album.name}</Text>
                    
                    {/* Asset counts */}
                    <View className="flex-row items-center gap-4 mb-4">

                        {/* Photo count */}
                        <View className="flex-row items-center gap-1">
                            <Feather name="image" size={16} color={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                            <Text className={`text-sm ${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}>
                                {album.assets?.filter(asset => asset.media_type === 'photo').length || 0}  {album.assets && album.assets.filter(asset => asset.media_type === 'photo').length > 1 ? text.photos : text.photo}
                            </Text>
                        </View>

                        {/* Video count */}
                        <View className="flex-row items-center gap-1">
                            <Feather name="video" size={16} color={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                            <Text className={`text-sm ${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}>
                                {album.assets?.filter(asset => asset.media_type === 'video').length || 0}  {album.assets && album.assets.filter(asset => asset.media_type === 'video').length > 1 ? text.videos : text.video}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action buttons */}
                <View className="flex-row items-center">

                    {/* Delete album */}
                    <TouchableOpacity 
                        onPress={onDeleteAlbum}
                        className="p-2"
                    >
                        <Feather name="trash-2" size={20} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />
                    </TouchableOpacity>

                    {/* Edit album */}
                    <TouchableOpacity 
                        onPress={onEditAlbum}
                        className="p-2"
                    >
                        <Feather name="edit" size={20} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />
                    </TouchableOpacity>

                    {/* Add assets */}
                    <TouchableOpacity 
                        onPress={onAddAssets}
                        className="p-2"
                    >
                        <MaterialIcons name="add" size={26} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />
                    </TouchableOpacity>
                </View>
            </View>

            <Text className={`text-sm ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>{album.description || text.noDescription}</Text>
        </View>
    );
};

export default AlbumHeader;