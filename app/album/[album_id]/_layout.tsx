import Feather from "@expo/vector-icons/Feather";
import { router, Stack } from "expo-router";
import { TouchableOpacity } from "react-native";

const AlbumLayout = () => {
	return (
		<Stack screenOptions={{
			headerShown: false,
			headerShadowVisible: false,
		}}>
			<Stack.Screen
                name="index"
                options={{
                    headerShown: true,
                    headerTitle: 'Album',
					headerLeft: () => (
						<TouchableOpacity onPress={() => router.back()}>
							<Feather name="chevron-left" size={32} color="black" />
						</TouchableOpacity>
					),
                }}
            />
		</Stack>
	);
};

export default AlbumLayout;     