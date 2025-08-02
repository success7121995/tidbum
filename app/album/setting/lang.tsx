import { useSetting } from "@/constant/SettingProvider";
import { updateSettings } from "@/lib/db";
import { Language, getLanguageText } from "@/lib/lang";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

const LangIndex = () => {
	// ============================================================================
	// STATE
	// ============================================================================
	const { language, setLanguage, theme } = useSetting();
	const [selectedLanguage, setSelectedLanguage] = useState<Language>(language as Language);
	const text = getLanguageText(language as Language);

	// Update selected language when language changes
	useEffect(() => {
		setSelectedLanguage(language as Language);
	}, [language]);

	// ============================================================================
	// MAPPING
	// ============================================================================
	const languageMapping = {
		[Language.EN]: "English",
		[Language.ZH_TW]: "繁體中文",
		[Language.ZH_CN]: "简体中文",
	}

	// ============================================================================
	// HANDLERS
	// ============================================================================
	const handleLanguageSelect = async (language: string) => {
		try {
			await updateSettings({ lang: language as Language });
			setLanguage(language as Language);
		} catch (error) {
			console.error(error);
			Alert.alert(text.error, text.failedToUpdateLanguage);
		}
	};


	// ============================================================================
	// RENDER
	// ============================================================================
	const LanguageItem = ({ languageItem }: { languageItem: Language }) => (
		<TouchableOpacity
			className={`flex-row items-center justify-between py-4 px-4 border-b ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'} ${
				languageItem === selectedLanguage ? `${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-50'}` : ""
			} ${theme === 'dark' ? 'active:bg-dark-bg' : 'active:bg-light-bg'}`}
			onPress={() => handleLanguageSelect(languageItem)}
		>
			<View className="flex-1">
				<Text className={`text-base font-medium ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>
					{languageMapping[languageItem]}
				</Text>
			</View>
			{languageItem === selectedLanguage && (
				<Ionicons name="checkmark" size={20} color="#007AFF" />
			)}
		</TouchableOpacity>
	);

	return (
		<View className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>

			{/* Language List */}
			<ScrollView className="flex-1">
				<View className="mt-4 mx-4">
					<View className={`${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'}`}>
						{Object.values(Language).map((languageItem, index) => (
							<LanguageItem key={languageItem} languageItem={languageItem} />
						))}
					</View>
				</View>
			</ScrollView>
		</View>
	);
};

export default LangIndex;