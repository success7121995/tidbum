import AlbumWithAssets from "@/components/Album";
import { getAlbumById } from "@/lib/db";
import { type Album } from "@/types/album";
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActionSheetIOS, ScrollView, Text, TouchableOpacity, View } from "react-native";

const AlbumScreen = () => {
	// ============================================================================
	// STATE
	// ============================================================================
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const { album_id } = useLocalSearchParams();
	const [album, setAlbum] = useState<Album | null>(null);

	// ============================================================================
	// HANDLERS
	// ============================================================================

	/**
	 * Fetch album
	 */
	useFocusEffect(
		useCallback(() => {
			(async () => {
				const album = await getAlbumById(album_id as string);
				setAlbum(album);
			})();
		}, [album_id])
	);

	/**
	 * Handle edit album
	 */
	const handleEditAlbum = () => {
		router.push({
			pathname: '/album/[album_id]/edit',
			params: {
				album_id: album_id as string,
				name: album?.name,
				description: album?.description,
				cover_asset_id: album?.cover_asset_id,
			},
		});
	};

	/**
	 * Handle add assets
	 */
	const handleAddAssets = () => {
		ActionSheetIOS.showActionSheetWithOptions({
			message: 'Add media or a new folder',
			options: ['Add media', 'Add a new folder', 'Cancel'],
			cancelButtonIndex: 2,
		}, (selectedIndex) => {
			if (selectedIndex === 0) {
				// TODO: Open photo picker
				console.log('Add photo to album:', album_id);
			} else if (selectedIndex === 1) {
				router.push(`/album/${album_id}/create`);
			}
		});
	};

	// ============================================================================
	// RENDERERS
	// ============================================================================

	if (!album) {
		return (
			<View className="flex-1 bg-white px-4 py-4">
				<Text>Loading...</Text>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-white">
			<View className="px-4 py-4">
				{/* Header with title and action buttons */}
				<View className="flex-row items-center justify-between mb-2">
					<Text className="text-2xl font-bold flex-1">{album.name}</Text>
					<View className="flex-row items-center gap-3">
						<TouchableOpacity 
							onPress={handleEditAlbum}
						>
							<Feather name="edit" size={20} color="#374151" />
						</TouchableOpacity>
						<TouchableOpacity 
							onPress={handleAddAssets}
						>
							<MaterialIcons name="add" size={24} color="#374151" />
						</TouchableOpacity>
					</View>
				</View>

				<Text className="text-sm text-gray-500">{album.description ? album.description : 'No description'}</Text>

				{/* Count of videos and images */}
				<View className="flex-row items-center gap-2">
					<Text className="text-sm text-gray-500">
						{album.assets?.filter((asset) => asset.media_type === 'video').length} videos
					</Text>
					<Text className="text-sm text-gray-500">
						{album.assets?.filter((asset) => asset.media_type === 'image').length} images
					</Text>
				</View>
			</View>

			{/* Divider */}
			<View className="h-px bg-gray-200" />

			{/* Album with assets */}
			{album && (album.assets?.length || 0) > 0 && (album.subAlbums?.length || 0) > 0 ? (
				<ScrollView className="px-4 py-4">
					{album && <AlbumWithAssets album={album} />}
				</ScrollView>
			) : (
				<View className="flex-1 items-center justify-center">
					<Text className="text-gray-500">No assets found</Text>
				</View>
			)}
		</View>

	);
};

export default AlbumScreen;