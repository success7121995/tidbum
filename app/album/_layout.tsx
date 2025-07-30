import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { router, Stack } from "expo-router";
import { TouchableOpacity } from "react-native";

const AlbumLayout = () => {
	return (
		<Stack screenOptions={{
			headerShown: true,
			headerShadowVisible: false,
		}}>
			<Stack.Screen
				name="index"
				options={{
					headerTitle: 'Tidbum',
					headerRight: () => (
						<TouchableOpacity onPress={() => router.push('/album/create')}>
							<AntDesign name="search1" size={24} color="black" />
						</TouchableOpacity>
					),
				}}
			/>
			<Stack.Screen
				name="create"
				options={{
					headerTitle: 'Create Album',
					headerLeft: () => (
						<TouchableOpacity onPress={() => router.back()}>
							<Feather name="chevron-left" size={32} color="black" />
						</TouchableOpacity>
					),
				}}
			/>
		</Stack>
	);
}

export default AlbumLayout;