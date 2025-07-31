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
                    headerTitle: '',
					headerLeft: () => (
						<TouchableOpacity onPress={() => router.back()}>
							<Feather name="chevron-left" size={32} color="black" />
						</TouchableOpacity>
					),
                }}
            />
			<Stack.Screen
				name="edit"
				options={{
					headerShown: true,
					headerTitle: 'Edit Album',
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