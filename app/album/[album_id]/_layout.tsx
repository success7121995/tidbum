import { AlbumProvider } from "@/constant";
import { Stack } from "expo-router";

const AlbumLayout = () => {
	
	return (
		<AlbumProvider>
			<Stack screenOptions={{ headerShown: false }} />
		</AlbumProvider>
	);
};

export default AlbumLayout;     