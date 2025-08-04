import { AlbumFormProvider, DirectoryNavigationProvider, GestureProvider, SettingProvider } from "@/constant";
import { useSetting } from "@/constant/SettingProvider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

function AppContent() {
	const { theme } = useSetting();
	
	return (
		<>
			<StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: {
						backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
					},
				}}
			/>
		</>
	);
}

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SettingProvider>
				<AlbumFormProvider>
						<DirectoryNavigationProvider>
							<GestureProvider>
								<AppContent />
							</GestureProvider>
						</DirectoryNavigationProvider>
				</AlbumFormProvider>
			</SettingProvider>
		</GestureHandlerRootView>
	);
}
