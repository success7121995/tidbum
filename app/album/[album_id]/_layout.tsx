import { AlbumProvider } from "@/constant";
import Feather from "@expo/vector-icons/Feather";
import { router, Stack } from "expo-router";
import { TouchableOpacity } from "react-native";

const AlbumLayout = () => {
	// ============================================================================
	// RENDERERS
	// ============================================================================

	/**
	 * Render stack
	 */
	const renderStack = () => (
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
		<Stack.Screen
			name="create"
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
			name="[sub_album_id]"
			options={{
				headerShown: true,
				headerTitle: '',
			}}
			/>
		</Stack>
	)
	
	return (
		<AlbumProvider>
			{renderStack()}
		</AlbumProvider>
	);
};

export default AlbumLayout;     