import Feather from '@expo/vector-icons/Feather';
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

// ============================================================================
// TYPES
// ============================================================================
interface SelectionModeBottomBarProps {
    selectedAssets: Set<string>;
    onDelete: () => void;
    onShare: () => void;
    onCancel: () => void;
    onMore: () => void;
    text: any;
    theme: string;
}

// ============================================================================
// SELECTION MODE BOTTOM BAR COMPONENT
// ============================================================================
const SelectionModeBottomBar = ({ 
    selectedAssets, 
    onDelete, 
    onShare, 
    onCancel, 
    onMore, 
    text, 
    theme 
}: SelectionModeBottomBarProps) => (
    <View className={`mb-3 px-4 py-3 ${theme === 'dark' ? 'bg-gray-900' : 'bg-black'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-800'}`}>
        <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={onShare} className="p-2">
                    <Feather name="share-2" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} className="p-2">
                    <Feather name="trash-2" size={24} color="white" />
                </TouchableOpacity>
            </View>
            
            <Text className="text-white font-medium text-base">
                {selectedAssets.size} {selectedAssets.size === 1 ? text.photo : text.photos} {text.selected}
            </Text>
            
            {/* Cancel Button */}
            <TouchableOpacity onPress={onCancel} className="p-2 px-8 bg-blue-500 rounded-full">
                <Text className="text-white font-medium text-base">
                    {text.cancel}
                </Text>
            </TouchableOpacity>
        </View>
        </View>
    );

export default SelectionModeBottomBar;   