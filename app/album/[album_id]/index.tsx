import AlbumScreen from "@/components/AlbumScreen";
import { useLocalSearchParams } from "expo-router";

const AlbumIndex = () => {
	const { album_id } = useLocalSearchParams();
	
	// When we're in an album, the album_id is the parent for any sub-albums
	return <AlbumScreen albumId={album_id as string} parentAlbumId={album_id as string} />;
};

export default AlbumIndex;