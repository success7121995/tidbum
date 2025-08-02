import { useSetting } from "@/constant/SettingProvider";
import { getLanguageText, Language } from "@/lib/lang";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const SettingIndex = () => {
	const router = useRouter();
	const { language, theme } = useSetting();
	const text = getLanguageText(language as Language);

	const handleLanguageSelect = () => {
		router.push("/album/setting/lang");
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
			className={`flex-row items-center justify-between py-4 px-4 border-b ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'} ${
				onPress ? `active:${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}` : ""
			}`}
			onPress={onPress}
			disabled={!onPress}
		>
			<View className="flex-1">
				<Text className={`text-base font-medium ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>{title}</Text>
				{subtitle && (
					<Text className={`text-sm ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mt-1`}>{subtitle}</Text>
				)}
			</View>
			{rightComponent && <View className="ml-3">{rightComponent}</View>}
			{showArrow && onPress && (
				<Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#94a3b8' : '#9CA3AF'} />
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
			<Text className={`text-sm font-semibold ${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'} uppercase tracking-wide px-4 py-2`}>
				{title}
			</Text>
			<View className={`${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'} rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'}`}>
				{children}
			</View>
		</View>
	);

	return (
		<ScrollView className={`flex-1 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>
			<View className="px-4 py-6">
				{/* Language Section */}
				<SettingSection title={text.language}>
					<SettingItem
						title={text.language}
						subtitle={text.languageSubtitle}
						onPress={handleLanguageSelect}
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
					<Text className={`text-sm ${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}>{text.version}</Text>
					<Text className={`text-sm ${theme === 'dark' ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'} mt-1`}>{text.copyright}</Text>
				</View>
			</View>
		</ScrollView>
	);
};

export default SettingIndex;