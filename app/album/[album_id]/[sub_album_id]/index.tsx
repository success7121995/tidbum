import AlbumWithAssets from "@/components/Album";
import AlbumSlider from "@/components/AlbumSlider";
import MediaLibrary from "@/components/MediaLibrary";
import { deleteAlbum, getAlbumById, insertAssets } from "@/lib/db";
import { type Album } from "@/types/album";
import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActionSheetIOS, Text, TouchableOpacity, View } from "react-native";

const SubAlbumScreen = () => {
	// ============================================================================
	// STATE
	// ============================================================================
	const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
	const { album_id, sub_album_id } = useLocalSearchParams();
	const [album, setAlbum] = useState<Album | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
	const [isSliderOpen, setIsSliderOpen] = useState(false);

	// ============================================================================
	// HANDLERS
	// ============================================================================

	/**
	 * Fetch album
	 */
	const fetchAlbum = useCallback(async () => {
		try {
			setIsLoading(true);
			const album = await getAlbumById(sub_album_id as string);
			setAlbum(album);
		} catch (error) {
			console.error('Error fetching album:', error);
		} finally {
			setIsLoading(false);
		}
	}, [sub_album_id]);

	/**
	 * Fetch album on focus
	 */
	useFocusEffect(
		useCallback(() => {
			fetchAlbum();
		}, [fetchAlbum])
	);

	/**
	 * Handle edit album
	 */
	const handleEditAlbum = () => {
		router.push({
			pathname: '/album/[album_id]/edit',
			params: {
				album_id: sub_album_id as string,
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
				setIsMediaLibraryOpen(true);
			} else if (selectedIndex === 1) {
				router.push(`/album/${album_id}/${sub_album_id}/create`);
			}
		});
	};

	/**
	 * Handle select assets
	 * @param assets - Array of assets to insert
	 */
	const handleSelectAssets = async (assets: Asset[]) => {
		try {
			await insertAssets(sub_album_id as string, assets);
			// Refresh album data after inserting assets
			await fetchAlbum();
		} catch (error) {
			console.error('Error inserting assets:', error);
		}
	};

	/**
	 * Handle asset press
	 * @param asset - The pressed asset
	 */
	const handleAssetPress = (asset: Asset) => {
		// Find the index of the pressed asset
		const assetIndex = album?.assets?.findIndex(a => a.id === asset.id) ?? -1;
		
		if (assetIndex !== -1) {
			setSelectedAssetIndex(assetIndex);
			setIsSliderOpen(true);
		}
	};

	/**
	 * Handle delete
	 * @param asset - The asset to delete
	 */
	const handleDelete = (asset: Asset) => {
		setAlbum(album => {
			const newAssets = album?.assets?.filter(a => a.asset_id !== asset.asset_id) || [];
			return {
				...album,
				assets: newAssets,
			};
		});
	};

	/**
	 * Handle album delete
	 */
	const handleAlbumDeleteActionSheet = async () => {
		ActionSheetIOS.showActionSheetWithOptions({
			message: 'Are you sure you want to delete this album? This action cannot be undone.',
			options: ['Delete', 'Cancel'],
			destructiveButtonIndex: 0,
			cancelButtonIndex: 1,
		}, (selectedIndex) => {
			if (selectedIndex === 0) {
				handleAlbumDelete();
			}
		});
	};

	/**
	 * Handle album delete
	 */
	const handleAlbumDelete = async () => {
		try {
			await deleteAlbum(sub_album_id as string);
			router.back();
		} catch (error) {
			console.error('Error deleting album:', error);
		}
	}

	// ============================================================================
	// RENDERERS
	// ============================================================================

	if (isLoading) {
		return (
			<View className="flex-1 bg-white items-center justify-center">
				<Text className="text-gray-500">Loading album...</Text>
			</View>
		);
	}

	if (!album) {
		return (
			<View className="flex-1 bg-white items-center justify-center">
				<Text className="text-gray-500">Album not found</Text>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-white">

			{/* Header with title and action buttons */}
			<View className="px-4 py-4 mb-5 border-b border-gray-200">
				<View className="flex-row items-center justify-between">

					<View className="flex-1 gap-1">
						<Text className="text-2xl font-bold text-gray-900">{album.name}</Text>
						
						{/* Asset counts */}
						<View className="flex-row items-center gap-4 mb-4">

							{/* Photo count */}
							<View className="flex-row items-center gap-1">
								<Feather name="image" size={16} color="#6B7280" />
								<Text className="text-sm text-gray-600">
									{album.assets?.filter(asset => asset.media_type === 'photo').length || 0}  {album.assets && album.assets.filter(asset => asset.media_type === 'photo').length > 1 ? 'photos' : 'photo'}
								</Text>
							</View>

							{/* Video count */}
							<View className="flex-row items-center gap-1">
								<Feather name="video" size={16} color="#6B7280" />
								<Text className="text-sm text-gray-600">
									{album.assets?.filter(asset => asset.media_type === 'video').length || 0}  {album.assets && album.assets.filter(asset => asset.media_type === 'video').length > 1 ? 'videos' : 'video'}
								</Text>
							</View>
						</View>
					</View>

					{/* Action buttons */}
					<View className="flex-row items-center">

						{/* Delete album */}
						<TouchableOpacity 
							onPress={handleAlbumDeleteActionSheet}
							className="p-2"
						>
							<Feather name="trash-2" size={20} color="#374151" />
						</TouchableOpacity>

						{/* Edit album */}
						<TouchableOpacity 
							onPress={handleEditAlbum}
							className="p-2"
						>
							<Feather name="edit" size={20} color="#374151" />
						</TouchableOpacity>



						{/* Add assets */}
						<TouchableOpacity 
							onPress={handleAddAssets}
							className="p-2"
						>
							<MaterialIcons name="add" size={26} color="#374151" />
						</TouchableOpacity>
					</View>
				</View>

				<Text className="text-sm text-gray-600">{album.description || 'No description'}</Text>
			</View>

			{/* Album content */}
			<AlbumWithAssets 
				album={album} 
				onAssetPress={handleAssetPress}
			/>

			{/* Media library */}
			<MediaLibrary
				visible={isMediaLibraryOpen}
				onClose={() => setIsMediaLibraryOpen(false)}
				onSelect={handleSelectAssets}
			/>

			{/* Album slider */}
			<AlbumSlider
				visible={isSliderOpen}
				assets={album.assets || []}
				selectedAssetIndex={selectedAssetIndex}
				onAssetChange={setSelectedAssetIndex}
				onClose={() => setIsSliderOpen(false)}
				onDelete={handleDelete}
			/>
		</View>
	);
};

export default SubAlbumScreen;