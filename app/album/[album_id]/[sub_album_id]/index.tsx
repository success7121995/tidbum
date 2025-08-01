import AlbumScreen from "@/components/AlbumScreen";
import { useLocalSearchParams } from "expo-router";

const SubAlbumIndex = () => {
	const { album_id, sub_album_id } = useLocalSearchParams();
	
	return <AlbumScreen albumId={sub_album_id as string} parentAlbumId={album_id as string} />;
};

export default SubAlbumIndex;