import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { router, Stack } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { useSetting } from "../../constant/SettingProvider";
import { getLanguageText, Language } from "../../lib/lang";

const AlbumLayout = () => {
	const { language, theme } = useSetting();
	const text = getLanguageText(language as Language);

	return (
		<Stack screenOptions={{
			headerShown: true,
			headerShadowVisible: false,
			headerLeft: () => (
				<TouchableOpacity
					className="flex-row items-center gap-1"
					onPress={() => router.back()}
				>
					<Feather name="chevron-left" size={24} color={theme === 'dark' ? 'white' : 'black'} />
					<Text className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{text.back}</Text>
				</TouchableOpacity>
			),
			headerRight: () => (
				<TouchableOpacity onPress={() => router.push('/album/setting')}>
					<FontAwesome6 name="gear" size={20} color={theme === 'dark' ? 'white' : 'black'} />
				</TouchableOpacity>
			),
			headerStyle: {
				backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
			},
			headerTitleStyle: {
				color: theme === 'dark' ? 'white' : 'black',
			},
		}}>
			<Stack.Screen
				name="index"
				options={{
					headerTitle: text.appName,
					headerLeft: () => <></>,
				}}
			/>
			<Stack.Screen
				name="create"
				options={{
					headerTitle: '',
					headerRight: () => <></>
				}}
			/>
			<Stack.Screen
				name="[album_id]"
				options={{
					headerTitle: '',
				}}
			/>
			<Stack.Screen
				name="setting"
				options={{
					headerTitle: text.setting,
					headerRight: () => <></>,
				}}
			/>

		</Stack>
	);
}

export default AlbumLayout;