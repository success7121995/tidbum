import { useSetting } from "@/constant/SettingProvider";
import { getLanguageText, Language } from "@/lib/lang";
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
	const { language } = useSetting();
	const text = getLanguageText(language as Language);

	const handleLanguageSelect = () => {
		router.push("/setting/lang");
	};

	const handleHelpCenter = () => {
		// Navigate to help center or open external link
		Linking.openURL("https://your-help-center-url.com").catch(() => {
			Alert.alert(text.error, text.cannotOpenHelpCenter);
		});
	};

	const handleFAQ = () => {
		// Navigate to FAQ page or open external link
		Linking.openURL("https://your-faq-url.com").catch(() => {
			Alert.alert(text.error, text.cannotOpenFAQ);
		});
	};

	const handleTermsOfUse = () => {
		// Navigate to Terms of Use page or open external link
		Linking.openURL("https://your-terms-url.com").catch(() => {
			Alert.alert(text.error, text.cannotOpenTerms);
		});
	};

	const handlePolicy = () => {
		// Navigate to Privacy Policy page or open external link
		Linking.openURL("https://your-policy-url.com").catch(() => {
			Alert.alert(text.error, text.cannotOpenPolicy);
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
				<SettingSection title={text.language}>
					<SettingItem
						title={text.language}
						subtitle={text.languageSubtitle}
						onPress={handleLanguageSelect}
					/>
				</SettingSection>

				{/* Theme Section */}
				<SettingSection title={text.appearance}>
					<SettingItem
						title={text.darkMode}
						subtitle={text.darkModeSubtitle}
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
				<SettingSection title={text.helpSupport}>
					<SettingItem
						title={text.helpCenter}
						subtitle={text.helpCenterSubtitle}
						onPress={handleHelpCenter}
					/>
					<SettingItem
						title={text.faq}
						subtitle={text.faqSubtitle}
						onPress={handleFAQ}
					/>
				</SettingSection>

				{/* Legal Section */}
				<SettingSection title={text.legal}>
					<SettingItem
						title={text.termsOfUse}
						subtitle={text.termsOfUseSubtitle}
						onPress={handleTermsOfUse}
					/>
					<SettingItem
						title={text.privacyPolicy}
						subtitle={text.privacyPolicySubtitle}
						onPress={handlePolicy}
					/>
				</SettingSection>

				{/* App Info */}
				<View className="mt-8 items-center">
					<Text className="text-sm text-gray-400">{text.version}</Text>
					<Text className="text-sm text-gray-400 mt-1">{text.copyright}</Text>
				</View>
			</View>
		</ScrollView>
	);
};

export default SettingIndex;