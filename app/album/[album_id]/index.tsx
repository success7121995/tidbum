import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

const AlbumScreen = () => {
	const { album_id, refresh } = useLocalSearchParams();

	return (
		<View>
			<Text>Album</Text>
            <Text>{album_id}</Text>
            <Text>{refresh}</Text>
		</View>

	);
};

export default AlbumScreen;