import { AlbumProvider } from "@/constant";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

export default function RootLayout() {

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<StatusBar style="auto" />
			<AlbumProvider>
				<Stack screenOptions={{ headerShown: false }}/>
			</AlbumProvider>
		</GestureHandlerRootView>
	);
}
