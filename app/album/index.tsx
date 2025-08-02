import { useSetting } from '@/constant/SettingProvider';
import { getLanguageText, Language } from '@/lib/lang';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Dimensions, FlatList, Text, TouchableOpacity, View } from "react-native";
import AlbumCard from "../../components/AlbumCard";
import { clearAllTables, deleteAllTables, getTopLevelAlbums, initDb } from "../../lib/db";
import { Album } from "../../types/album";

const HomeIndex = () => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [albums, setAlbums] = useState<(Album & { totalAssets: number })[]>([]);
    const { width } = Dimensions.get('window');
    const isTablet = width >= 768; // iPad breakpoint
    const albumsPerRow = isTablet ? 5 : 3;
    const [isTesting, _] = useState(false);
    const { language, theme } = useSetting();
    const text = getLanguageText(language as Language);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    /**
     * Fetch albums
     */
    useFocusEffect(
        useCallback(() => {
            (async () => {

                if (isTesting) {
                    await deleteAllTables();
                    await clearAllTables();
                }

                await initDb();
                const albums = await getTopLevelAlbums();
                setAlbums(albums);
            })();
        }, [])
    );

    /**
     * Handle album delete with smooth animation
     */
    const handleAlbumDelete = (albumId: string) => {
        const newAlbums = albums.filter((album) => album.album_id !== albumId);
        setAlbums(newAlbums);
    };

    // ============================================================================
    // RENDERERS
    // ============================================================================

    /**
     * Render album card
     */
    const renderAlbumCard = ({ item }: { item: Album & { totalAssets: number } }) => (
        <View className={`${isTablet ? 'w-1/5' : 'w-1/3'} px-1 mb-4`}>
            <AlbumCard
                album={item}
                onDelete={handleAlbumDelete}
            />
        </View>
    );

    return (
        <View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>
            {/* Header bar */}
            <View className="flex-row justify-end items-center px-4 py-2">
                <TouchableOpacity onPress={() => router.push('/album/create')}>
                    <FontAwesome6 name="add" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
            </View>

            {/* Album grid */}
            { albums.length > 0 ? (
                <View className="flex-1 px-4 py-4">
                    <FlatList
                        data={albums}
                        renderItem={renderAlbumCard}
                        keyExtractor={(item) => item.album_id || ''}
                        numColumns={albumsPerRow}
                        columnWrapperStyle={{ 
                            justifyContent: 'flex-start',
                            gap: 2
                        }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        removeClippedSubviews={false}
                        getItemLayout={(data, index) => ({
                            length: 200, // Approximate height of each item
                            offset: 200 * Math.floor(index / albumsPerRow),
                            index,
                        })}
                        />
                </View>
            ) : (
                <View className="flex-1 items-center justify-center">
                    <Text className={`text-md font-bold ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>{text.noAlbum}</Text>
                </View>
            )}
        </View>
    );
};

export default HomeIndex;