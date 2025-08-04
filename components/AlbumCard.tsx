import Ionicons from '@expo/vector-icons/Ionicons';
import { ActionSheetIOS, Animated, Image, Text, TouchableOpacity, View } from "react-native";
import { useSetting } from "../constant/SettingProvider";
import { deleteAlbum } from "../lib/db";
import { getLanguageText, Language } from "../lib/lang";
import { Album } from "../types/album";

interface AlbumCardProps {
    album: Album;
    onDelete?: (albumId: string) => void;
    onPress?: (album: Album) => void;
}

const AlbumCard = ({ album, onDelete, onPress }: AlbumCardProps) => {
    // ============================================================================
    // STATE
    // ============================================================================
    const fadeAnim = new Animated.Value(1);
    const scaleAnim = new Animated.Value(1);
    const { language, theme } = useSetting();
    const text = getLanguageText(language as Language);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    /**
     * Handle menu press
     * @param albumId - The album ID
     */
    const handleMenuPress = (albumId: string) => {
        if (!albumId) {
            return;
        }
        
        ActionSheetIOS.showActionSheetWithOptions({
            message: text.deleteAlbum,
            options: [text.delete, text.cancel],
            cancelButtonIndex: 1,
            destructiveButtonIndex: 0,
        }, (buttonIndex) => {
            if (buttonIndex === 0) {
                // Animate the card out before deleting
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 0.8,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    // Delete the album after animation completes
                    (async () => {
                        const album_id = await deleteAlbum(albumId);
                        return onDelete?.(album_id);
                    })();
                });
            }
        });
    };

    /**
     * Handle album press
     */
    const handleAlbumPress = () => {
        if (onPress) {
            onPress(album);
        } else if (album.album_id) {
            // Fallback to router if no onPress callback is provided
            // This will only work when the component is used outside of modals
            try {
                const { router } = require("expo-router");
                router.push(`/album/${album.album_id}`);
            } catch (error) {
                console.warn('Navigation not available in this context');
            }
        }
    };

    // ============================================================================
    // RENDERERS
    // ============================================================================

    return (
        <Animated.View 
            className="bg-transparent"
            style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
            }}
        >
            {/* Photo Thumbnail - Clickable for navigation */}
            <TouchableOpacity 
                className={`aspect-square ${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} relative rounded-xl rounded-br-none overflow-hidden`}
                onPress={handleAlbumPress}
                activeOpacity={0.8}
            >
                {album.cover_asset_id ? (
                    <Image 
                        source={{ uri: album.cover_asset_id }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className={`w-full h-full ${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} flex items-center justify-center`}>
                        <Ionicons name="images-outline" size={32} color={theme === 'dark' ? '#cbd5e1' : '#64748b'} />
                    </View>
                )}
                
                {/* Menu Icon - Separate clickable area */}
                <TouchableOpacity 
                    className="absolute top-2 right-2 bg-black/20 rounded-full p-1"
                    onPress={() => handleMenuPress(album.album_id || '')}
                >
                    <Ionicons name="ellipsis-vertical" size={16} color="white" />
                </TouchableOpacity>
            </TouchableOpacity>
            
            {/* Album Info */}
            <View className="p-3">
                <Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} text-sm font-semibold mb-1`} numberOfLines={1}>
                    {album.name}
                </Text>
                <Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-xs`}>
                    {album.totalAssets || 0} {album.totalAssets === 1 ? text.asset : text.assets}
                </Text>
            </View>
        </Animated.View>
    );
};

export default AlbumCard;   