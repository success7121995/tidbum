import { useSetting } from "@/constant/SettingProvider";
import { getLanguageText, Language } from "@/lib/lang";
import { Stack } from "expo-router";

const SettingLayout = () => {
	const { language, theme } = useSetting();
	const text = getLanguageText(language as Language);
	return (
		<Stack screenOptions={{ headerShown: false }} />
	);
};

export default SettingLayout;   