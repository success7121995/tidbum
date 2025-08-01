import AlbumScreen from "@/components/AlbumScreen";
import { useLocalSearchParams } from "expo-router";

const AlbumIndex = () => {
	const { album_id } = useLocalSearchParams();
	
	return <AlbumScreen albumId={album_id as string} />;
};

export default AlbumIndex;