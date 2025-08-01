import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
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
					headerTitle: 'Tidbum',
					headerRight: () => (
						<TouchableOpacity onPress={() => router.push('/setting')}>
							<FontAwesome6 name="gear" size={20} color="black" />
						</TouchableOpacity>
					),
				}}
			/>
			<Stack.Screen
				name="create"
				options={{
					headerShown: true,
					headerTitle: 'Create Album',
					headerLeft: () => (
						<TouchableOpacity onPress={() => router.back()}>
							<Feather name="chevron-left" size={32} color="black" />
						</TouchableOpacity>
					),
				}}
			/>
			<Stack.Screen name="[album_id]" />
		</Stack>
	);
}

export default AlbumLayout;