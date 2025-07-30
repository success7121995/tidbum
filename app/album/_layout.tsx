import { Stack } from "expo-router";

const AlbumLayout = () => {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
		</Stack>
	);
}

export default AlbumLayout;