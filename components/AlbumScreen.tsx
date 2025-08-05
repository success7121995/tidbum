import AlbumWithAssets from "@/components/Album";
import AlbumSlider from "@/components/AlbumSlider";
import MediaLibrary from "@/components/MediaLibrary";
import { useSetting } from "@/constant/SettingProvider";
import { deleteAlbum, getAlbumById, insertAssets, updateAlbum } from "@/lib/db";
import { getLanguageText, Language } from "@/lib/lang";
import { type Album } from "@/types/album";
import { Asset } from "@/types/asset";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ActionSheetIOS, Text, View } from "react-native";
import AlbumHeader from "./AlbumHeader";
import CoverImageModal from "./CoverImageModal";

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
	const [isCoverImageModalOpen, setIsCoverImageModalOpen] = useState(false);

	// ============================================================================
	// REFS
	// ============================================================================

	// ============================================================================
	// CONTEXT
	// ============================================================================
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
		} catch (error) {
			console.error('Error fetching album:', error);
		} finally {
			setIsLoading(false);
		}
	}, [albumId]); // Remove album dependency to prevent unnecessary re-renders

	/**
	 * Fetch album on focus - always refresh to get latest data
	 */
	useFocusEffect(
		useCallback(() => {
			// Always fetch to get latest data, but only show loading if we don't have data
			fetchAlbum();
		}, [fetchAlbum])
	);

	/**
	 * Handle edit album
	 */
	const handleEditAlbumLocal = () => {
		if (album) {
			const pathname = parentAlbumId 
				? '/album/[album_id]/edit'
				: '/album/[album_id]/edit';
			
			const params = {
				album_id: album.album_id || '',
				name: album.name,
				description: album.description || '',
				cover_uri: album.cover_uri || '',
			};

			router.push({
				pathname,
				params,
			});
		}
	};

	/**
	 * Handle add assets
	 */
	const handleAddAssetsLocal = () => {
		ActionSheetIOS.showActionSheetWithOptions({
			message: text.addMediaOrNewFolder,
			options: [text.addMedia, text.addNewFolder, text.cancel],
			cancelButtonIndex: 2,
		}, (selectedIndex) => {
			if (selectedIndex === 0) {
				// Open media library
				setIsMediaLibraryOpen(true);
			} else if (selectedIndex === 1) {
				if (parentAlbumId) {
					router.push({
						pathname: '/album/[album_id]/create-sub-album',
						params: { album_id: parentAlbumId }
					});
				} else {
					router.push('/album/create');
				}
			}
		});
	};

	/**
	 * Handle select assets
	 * @param assets - Array of assets to insert
	 */
	const handleSelectAssetsLocal = async (assets: Asset[]) => {
		try {
			await insertAssets(albumId, assets);
			fetchAlbum();
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
			// No need to refresh album data if we already have it
		}
	};

	/**
	 * Handle slider close
	 */
	const handleSliderClose = () => {
		setIsSliderOpen(false);
	};

	/**
	 * Handle selection change
	 * @param assets - Array of selected assets
	 */
	const handleSelectionChange = useCallback((assets: Asset[]) => {
		setSelectedAssets(assets);
	}, []);

	/**
	 * Handle assets update
	 */
	const handleAssetsUpdate = async (updatedAssets: Asset[]) => {
		if (album) {
			// Update the assets list
			setAlbum({
				...album,
				assets: updatedAssets
			});
			
			// Also refresh the album data to get updated totalAssets count
			try {
				const refreshedAlbum = await getAlbumById(albumId);
				if (refreshedAlbum) {
					setAlbum(refreshedAlbum);
				}
			} catch (error) {
				console.error('Error refreshing album after assets update:', error);
			}
		}
	};

	/**
	 * Handle album update
	 */
	const handleAlbumUpdate = (updatedAlbum: Album) => {
		// Update the album state with the latest data including totalAssets
		setAlbum(updatedAlbum);
	};

	/**
	 * Handle delete
	 * @param asset - The asset to delete
	 */
	const handleDelete = (asset: Asset) => {
		// Update local state immediately for better UX
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
		ActionSheetIOS.showActionSheetWithOptions({
			message: 'Are you sure you want to delete this album? This action cannot be undone.',
			options: ['Delete', 'Cancel'],
			destructiveButtonIndex: 0,
			cancelButtonIndex: 1,
		}, async (selectedIndex) => {
			if (selectedIndex === 0) {
				try {
					await deleteAlbum(albumId);
					router.back();
				} catch (error) {
					console.error('Error deleting album:', error);
				}
			}
		});
	};

	/**
	 * Handle cover image modal close
	 */
	const handleCoverImageModalClose = () => {
		setIsCoverImageModalOpen(false);
	};

	/**
	 * Handle cover image modal open
	 */
	const handleCoverImageModalOpen = () => {
		setIsCoverImageModalOpen(true);
	};

	/**
	 * Handle cover image select
	 */
	const handleSelectCover = async (asset: Asset | null) => {
		try {
			if (album) {
				await updateAlbum(albumId, {
					...album,
					cover_uri: asset?.uri || undefined
				});

				// Refresh album data
				fetchAlbum();
			}
		} catch (err) {
			console.error('Error selecting cover image:', err);
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
			<AlbumHeader 
				album={album}
				onEditAlbum={handleEditAlbumLocal}
				onAddAssets={handleAddAssetsLocal}
				onDeleteAlbum={handleAlbumDeleteLocal}
				onCoverImage={handleCoverImageModalOpen}
			/>

			{/* Album content */}
			<AlbumWithAssets 
				album={album} 
				onAssetPress={handleAssetPress}
				onSelectionChange={handleSelectionChange}
				onAssetsUpdate={handleAssetsUpdate}
				onAlbumUpdate={handleAlbumUpdate}
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

			{/* Cover image modal */}
			<CoverImageModal
				visible={isCoverImageModalOpen}
				onClose={handleCoverImageModalClose}
				assets={album.assets || []}
				currentCoverUri={album.cover_uri}
				onSelectCover={handleSelectCover}
			/>
		</View>
	);
};

export default AlbumScreen;