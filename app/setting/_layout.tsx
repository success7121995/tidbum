import { getLanguageText, Language } from "@/lib/lang";
import Feather from "@expo/vector-icons/Feather";
import { router, Stack } from "expo-router";
import { TouchableOpacity } from "react-native";
import { useSetting } from "../../constant/SettingProvider";

const SettingLayout = () => {
	const { language } = useSetting();
	const text = getLanguageText(language as Language);
	return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen name="index" options={{
                headerShown: true,
                headerTitle: text.setting,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="chevron-left" size={32} color="black" />
                    </TouchableOpacity>
                ),
            }} />
            <Stack.Screen name="lang" options={{
                headerShown: true,
                headerTitle: text.languageSetting,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="chevron-left" size={32} color="black" />
                    </TouchableOpacity>
                ),
            }} />
        </Stack>
	);
};

export default SettingLayout;   