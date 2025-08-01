import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
	Alert,
	Linking,
	ScrollView,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

const SettingIndex = () => {
	const router = useRouter();
	const [isDarkMode, setIsDarkMode] = useState(false);
	const [selectedLanguage, setSelectedLanguage] = useState("繁體中文");

	const languages = [
		{ id: "zh-TW", name: "繁體中文" },
		{ id: "zh-CN", name: "簡體中文" },
		{ id: "en", name: "English" },
	];

	const handleLanguageSelect = () => {
		router.push("/setting/lang");
	};

	const handleHelpCenter = () => {
		// Navigate to help center or open external link
		Linking.openURL("https://your-help-center-url.com").catch(() => {
			Alert.alert("錯誤", "無法開啟幫助中心");
		});
	};

	const handleFAQ = () => {
		// Navigate to FAQ page or open external link
		Linking.openURL("https://your-faq-url.com").catch(() => {
			Alert.alert("錯誤", "無法開啟常見問題");
		});
	};

	const handleTermsOfUse = () => {
		// Navigate to Terms of Use page or open external link
		Linking.openURL("https://your-terms-url.com").catch(() => {
			Alert.alert("錯誤", "無法開啟使用條款");
		});
	};

	const handlePolicy = () => {
		// Navigate to Privacy Policy page or open external link
		Linking.openURL("https://your-policy-url.com").catch(() => {
			Alert.alert("錯誤", "無法開啟隱私政策");
		});
	};

	const SettingItem = ({
		title,
		subtitle,
		onPress,
		showArrow = true,
		rightComponent,
	}: {
		title: string;
		subtitle?: string;
		onPress?: () => void;
		showArrow?: boolean;
		rightComponent?: React.ReactNode;
	}) => (
		<TouchableOpacity
			className={`flex-row items-center justify-between py-4 px-4 border-b border-gray-100 ${
				onPress ? "active:bg-gray-50" : ""
			}`}
			onPress={onPress}
			disabled={!onPress}
		>
			<View className="flex-1">
				<Text className="text-base font-medium text-gray-900">{title}</Text>
				{subtitle && (
					<Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
				)}
			</View>
			{rightComponent && <View className="ml-3">{rightComponent}</View>}
			{showArrow && onPress && (
				<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
			)}
		</TouchableOpacity>
	);

	const SettingSection = ({
		title,
		children,
	}: {
		title: string;
		children: React.ReactNode;
	}) => (
		<View className="mb-6">
			<Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-4 py-2">
				{title}
			</Text>
			<View className="bg-white rounded-lg overflow-hidden border border-gray-100">
				{children}
			</View>
		</View>
	);

	return (
		<ScrollView className="flex-1 bg-gray-50">
			<View className="px-4 py-6">
				{/* Language Section */}
				<SettingSection title="語言">
					<SettingItem
						title="語言"
						subtitle={selectedLanguage}
						onPress={handleLanguageSelect}
					/>
				</SettingSection>

				{/* Theme Section */}
				<SettingSection title="外觀">
					<SettingItem
						title="深色模式"
						subtitle="切換深色和淺色主題"
						rightComponent={
							<Switch
								value={isDarkMode}
								onValueChange={setIsDarkMode}
								trackColor={{ false: "#E5E7EB", true: "#007AFF" }}
								thumbColor={isDarkMode ? "#FFFFFF" : "#FFFFFF"}
								ios_backgroundColor="#E5E7EB"
							/>
						}
						showArrow={false}
					/>
				</SettingSection>

				{/* Help Section */}
				<SettingSection title="幫助與支援">
					<SettingItem
						title="幫助中心"
						subtitle="獲取使用幫助和支援"
						onPress={handleHelpCenter}
					/>
					<SettingItem
						title="常見問題"
						subtitle="查看常見問題解答"
						onPress={handleFAQ}
					/>
				</SettingSection>

				{/* Legal Section */}
				<SettingSection title="法律條款">
					<SettingItem
						title="使用條款"
						subtitle="閱讀應用程式使用條款"
						onPress={handleTermsOfUse}
					/>
					<SettingItem
						title="隱私政策"
						subtitle="了解我們的隱私政策"
						onPress={handlePolicy}
					/>
				</SettingSection>

				{/* App Info */}
				<View className="mt-8 items-center">
					<Text className="text-sm text-gray-400">版本 1.0.0</Text>
					<Text className="text-sm text-gray-400 mt-1">© 2024 TidBum</Text>
				</View>
			</View>
		</ScrollView>
	);
};

export default SettingIndex;