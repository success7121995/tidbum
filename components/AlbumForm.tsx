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
			Alert.alert('Error', 'Failed to save album. Please try again.');
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
					<Text className="text-slate-700 font-semibold mb-2">
						Album Name<Text className="text-red-500">*</Text>
					</Text>
					<Controller
						control={control}
						name="name"
						render={({ field: { onChange, onBlur, value } }) => (
							<TextInput
								className={`px-4 py-3 rounded-xl border ${
									errors.name ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'
								}`}
								placeholder="Enter album name"
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
					<Text className="text-slate-700 font-semibold mb-2">
						Description
					</Text>
					<Controller
						control={control}
						name="description"
						render={({ field: { onChange, onBlur, value } }) => (
							<TextInput
								className="px-4 py-3 rounded-xl border border-slate-300 bg-white"
								placeholder="Add a description (optional)"
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
						{isSubmitting ? 'Saving...' : 'Save Album'}
					</Text>
				</TouchableOpacity>

				{onCancel && (
					<TouchableOpacity
						className="py-4 mt-4 rounded-xl border border-slate-300"
						onPress={onCancel}
						disabled={isSubmitting}
					>
						<Text className="text-slate-600 text-center font-medium">
							Cancel
						</Text>
					</TouchableOpacity>
				)}
			</View>
		</KeyboardAvoidingView>
	);
} 

export default AlbumForm;