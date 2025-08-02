import { getLanguageText, Language } from '@/lib/lang';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { useSetting } from '../constant/SettingProvider';
import { AlbumFormData, albumSchema } from '../lib/schema';

interface AlbumFormProps {
	onSubmit: (data: AlbumFormData) => Promise<void>;
	onCancel?: () => void;
	initialData?: Partial<AlbumFormData>;
	isSubmitting?: boolean;
}

const AlbumForm = ({ 
	onSubmit, 
	onCancel, 
	initialData = {}, 
	isSubmitting = false 
}: AlbumFormProps) => {
	const { language, theme } = useSetting();
	const text = getLanguageText(language as Language);

	const {
		control,
		handleSubmit,
		formState: { errors, isValid },
		reset
	} = useForm<AlbumFormData>({
		resolver: zodResolver(albumSchema),
		defaultValues: {
			name: '',
			description: '',
			...initialData,
		},
		mode: 'onChange',
	});

	const handleFormSubmit = async (data: AlbumFormData) => {
		try {
			await onSubmit(data);
			reset();
		} catch (error) {
			Alert.alert(text.error, text.failedToSaveAlbum);
		}
	};

	return (
		<KeyboardAvoidingView 
			className="flex-1"
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			{/* Form */}
			<View className="space-y-6">
				{/* Album Name */}
				<View>
					<Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} font-semibold mb-2`}>
						{text.albumName}<Text className="text-red-500">*</Text>
					</Text>
					<Controller
						control={control}
						name="name"
						render={({ field: { onChange, onBlur, value } }) => (
							<TextInput
								className={`px-4 py-3 rounded-xl border ${
									errors.name ? 'border-red-500 bg-red-50' : `${theme === 'dark' ? 'border-dark-border bg-dark-card' : 'border-light-border bg-light-card'}`
								} ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}
								placeholder={text.enterAlbumName}
								placeholderTextColor={theme === 'dark' ? '#94a3b8' : '#9ca3af'}
								onChangeText={onChange}
								onBlur={onBlur}
								value={value}
								maxLength={50}
							/>
						)}
					/>
					{errors.name && (
						<Text className="text-red-500 text-sm mt-1">
							{errors.name.message}
						</Text>
					)}
				</View>

				{/* Description */}
				<View className="mt-4">
					<Text className={`${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'} font-semibold mb-2`}>
						{text.enterAlbumDescription}
					</Text>
					<Controller
						control={control}
						name="description"
						render={({ field: { onChange, onBlur, value } }) => (
							<TextInput
								className={`px-4 py-3 rounded-xl border ${theme === 'dark' ? 'border-dark-border bg-dark-card' : 'border-light-border bg-light-card'} ${theme === 'dark' ? 'text-dark-text-primary' : 'text-light-text-primary'}`}
								placeholder={text.enterAlbumDescription}
								placeholderTextColor={theme === 'dark' ? '#94a3b8' : '#9ca3af'}
								onChangeText={onChange}
								onBlur={onBlur}
								value={value}
								multiline
								numberOfLines={3}
								maxLength={200}
								textAlignVertical="top"
							/>
						)}
					/>
					{errors.description && (
						<Text className="text-red-500 text-sm mt-1">
							{errors.description.message}
						</Text>
					)}
				</View>
			</View>

			{/* Submit Button */}
			<View className="mt-8 space-y-3">
				<TouchableOpacity
					className={`py-4 rounded-xl ${
						isValid && !isSubmitting
							? 'bg-blue-500'
							: 'bg-slate-300'
					}`}
					onPress={handleSubmit(handleFormSubmit)}
					disabled={!isValid || isSubmitting}
				>
					<Text className="text-white text-center font-semibold text-lg">
						{isSubmitting ? text.saving : text.saveAlbum}
					</Text>
				</TouchableOpacity>

				{onCancel && (
					<TouchableOpacity
						className={`py-4 mt-4 rounded-xl border ${theme === 'dark' ? 'border-dark-border' : 'border-light-border'}`}
						onPress={onCancel}
						disabled={isSubmitting}
					>
						<Text className={`${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'} text-center font-medium`}>
							{text.cancel}
						</Text>
					</TouchableOpacity>
				)}
			</View>
		</KeyboardAvoidingView>
	);
} 

export default AlbumForm;