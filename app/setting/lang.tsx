import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const LangIndex = () => {
	const router = useRouter();
	const [selectedLanguage, setSelectedLanguage] = useState("繁體中文");

	const languages = [
		{ id: "zh-TW", name: "繁體中文", nativeName: "繁體中文" },
		{ id: "zh-CN", name: "簡體中文", nativeName: "简体中文" },
		{ id: "en", name: "English", nativeName: "English" },
	];

	const handleLanguageSelect = (language: string) => {
		setSelectedLanguage(language);
		// Here you would typically update the app's language setting
		// and trigger a re-render of the app with the new language
		
		// Navigate back to settings after selection
		setTimeout(() => {
			router.back();
		}, 300);
	};

	const LanguageItem = ({ language }: { language: typeof languages[0] }) => (
		<TouchableOpacity
			className={`flex-row items-center justify-between py-4 px-4 border-b border-gray-100 ${
				selectedLanguage === language.name ? "bg-blue-50" : ""
			} active:bg-gray-50`}
			onPress={() => handleLanguageSelect(language.name)}
		>
			<View className="flex-1">
				<Text className="text-base font-medium text-gray-900">
					{language.nativeName}
				</Text>
				{language.nativeName !== language.name && (
					<Text className="text-sm text-gray-500 mt-1">
						{language.name}
					</Text>
				)}
			</View>
			{selectedLanguage === language.name && (
				<Ionicons name="checkmark" size={20} color="#007AFF" />
			)}
		</TouchableOpacity>
	);

	return (
		<View className="flex-1 bg-gray-50">

			{/* Language List */}
			<ScrollView className="flex-1">
				<View className="mt-4 mx-4">
					<View className="bg-white rounded-lg overflow-hidden border border-gray-100">
						{languages.map((language, index) => (
							<LanguageItem key={language.id} language={language} />
						))}
					</View>
				</View>

				{/* Info Section */}
				<View className="mt-6 mx-4">
					<View className="bg-blue-50 rounded-lg p-4 border border-blue-100">
						<View className="flex-row items-start">
							<Ionicons name="information-circle" size={20} color="#007AFF" />
							<Text className="text-sm text-blue-800 ml-2 flex-1">
								選擇語言後，應用程式將重新啟動以套用新的語言設定。
							</Text>
						</View>
					</View>
				</View>
			</ScrollView>
		</View>
	);
};

export default LangIndex;