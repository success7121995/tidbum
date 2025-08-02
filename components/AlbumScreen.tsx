import AlbumWithAssets from "@/components/Album";
import AlbumSlider from "@/components/AlbumSlider";
import MediaLibrary from "@/components/MediaLibrary";
import { useAlbum } from "@/constant/AlbumProvider";
import { useSetting } from "@/constant/SettingProvider";
import { getAlbumById } from "@/lib/db";
import { getLanguageText, Language } from "@/lib/lang";
import { type Album } from "@/types/album";
import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface AlbumScreenProps {
	albumId: string;
	parentAlbumId?: string; // Optional parent album ID for sub-albums
}

const AlbumScreen = ({ albumId, parentAlbumId }: AlbumScreenProps) => {
	// ============================================================================
	// STATE
	// ============================================================================
	const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
	const [album, setAlbum] = useState<Album | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
	const [isSliderOpen, setIsSliderOpen] = useState(false);
	const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);

	// ============================================================================
	// REFS
	// ============================================================================
	const loadedAlbumsRef = useRef<Set<string>>(new Set());

	// ============================================================================
	// CONTEXT
	// ============================================================================
	const { 
		handleEditAlbum, 
		handleAddAssets, 
		handleSelectAssets, 
		handleAlbumDeleteActionSheet 
	} = useAlbum();

	const { language, theme } = useSetting();
	const text = getLanguageText(language as Language);

	// ============================================================================
	// HANDLERS
	// ============================================================================

	/**
	 * Fetch album
	 */
	const fetchAlbum = useCallback(async () => {
		try {
			// Only set loading if we don't have album data yet
			if (!album) {
				setIsLoading(true);
			}
			const albumData = await getAlbumById(albumId);
			setAlbum(albumData);
			// Mark this album as loaded
			loadedAlbumsRef.current.add(albumId);
		} catch (error) {
			console.error('Error fetching album:', error);
		} finally {
			setIsLoading(false);
		}
	}, [albumId, album]);

	/**
	 * Fetch album on focus - only if we don't have data
	 */
	useFocusEffect(
		useCallback(() => {
			// Only fetch if we don't have album data or if the albumId changed
			if (!album || album.album_id !== albumId || !loadedAlbumsRef.current.has(albumId)) {
				fetchAlbum();
			}
		}, [fetchAlbum, album, albumId])
	);

	/**
	 * Clean up loaded albums tracking when albumId changes
	 */
	useEffect(() => {
		// Clear loaded albums when albumId changes to ensure fresh data
		loadedAlbumsRef.current.clear();
	}, [albumId]);

	/**
	 * Handle edit album
	 */
	const handleEditAlbumLocal = () => {
		if (album && handleEditAlbum) {
			handleEditAlbum(album, parentAlbumId);
		}
	};

	/**
	 * Handle add assets
	 */
	const handleAddAssetsLocal = () => {
		if (handleAddAssets) {
			handleAddAssets(albumId, parentAlbumId, () => {
				setIsMediaLibraryOpen(true);
			});
		}
	};

	/**
	 * Handle select assets
	 * @param assets - Array of assets to insert
	 */
	const handleSelectAssetsLocal = async (assets: Asset[]) => {
		if (handleSelectAssets) {
			await handleSelectAssets(albumId, assets, fetchAlbum);
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
			// No need to refresh album data if we already have it
		}
	};

	/**
	 * Handle slider close
	 */
	const handleSliderClose = () => {
		setIsSliderOpen(false);
		// No need to refresh album data on close
	};

	/**
	 * Handle selection change
	 * @param assets - Array of selected assets
	 */
	const handleSelectionChange = useCallback((assets: Asset[]) => {
		setSelectedAssets(assets);
	}, []);

	/**
	 * Handle assets update from Album component
	 * @param updatedAssets - Updated array of assets
	 */
	const handleAssetsUpdate = useCallback((updatedAssets: Asset[]) => {
		setAlbum(prevAlbum => {
			if (!prevAlbum) return prevAlbum;
			return {
				...prevAlbum,
				assets: updatedAssets
			};
		});
	}, []);

	/**
	 * Handle delete
	 * @param asset - The asset to delete
	 */
	const handleDelete = (asset: Asset) => {
		setAlbum(album => {
			if (!album) return album;
			return {
				...album,
				assets: album.assets?.filter(a => a.asset_id !== asset.asset_id) || []
			};
		});
	};

	/**
	 * Handle album delete
	 */
	const handleAlbumDeleteLocal = () => {
		if (handleAlbumDeleteActionSheet) {
			handleAlbumDeleteActionSheet(albumId, () => {
				// This will be handled by the provider's handleAlbumDelete
			});
		}
	};

	// ============================================================================
	// RENDERERS
	// ============================================================================

	if (isLoading) {
		return (
			<View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'} items-center justify-center`}>
				<Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>{text.loadingAlbum}</Text>
			</View>
		);
	}

	if (!album) {
		return (
			<View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'} items-center justify-center`}>
				<Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>{text.albumNotFound}</Text>
			</View>
		);
	}

	return (
		<View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>

			{/* Header with title and action buttons */}
			<View className={`px-4 py-4 mb-5 border-b ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'}`}>
				<View className="flex-row items-center justify-between">

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
							onPress={handleAlbumDeleteLocal}
							className="p-2"
						>
							<Feather name="trash-2" size={20} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />
						</TouchableOpacity>

						{/* Edit album */}
						<TouchableOpacity 
							onPress={handleEditAlbumLocal}
							className="p-2"
						>
							<Feather name="edit" size={20} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />
						</TouchableOpacity>

						{/* Add assets */}
						<TouchableOpacity 
							onPress={handleAddAssetsLocal}
							className="p-2"
						>
							<MaterialIcons name="add" size={26} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />
						</TouchableOpacity>
					</View>
				</View>

				<Text className={`text-sm ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>{album.description || text.noDescription}</Text>
			</View>

			{/* Album content */}
			<AlbumWithAssets 
				album={album} 
				onAssetPress={handleAssetPress}
				onSelectionChange={handleSelectionChange}
				onAssetsUpdate={handleAssetsUpdate}
			/>

			{/* Media library */}
			<MediaLibrary
				visible={isMediaLibraryOpen}
				onClose={() => setIsMediaLibraryOpen(false)}
				onSelect={handleSelectAssetsLocal}
			/>

			{/* Album slider */}
			<AlbumSlider
				visible={isSliderOpen}
				assets={album.assets || []}
				selectedAssetIndex={selectedAssetIndex}
				onAssetChange={setSelectedAssetIndex}
				onClose={handleSliderClose}
				onDelete={handleDelete}
				onAssetsUpdate={handleAssetsUpdate}
			/>
		</View>
	);
};

export default AlbumScreen; 