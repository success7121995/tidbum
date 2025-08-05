import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import React from "react";
import { Dimensions, Image, TouchableOpacity, View } from "react-native";

// ============================================================================
// CONSTANTS
// ============================================================================
const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth >= 768;
const numColumns = isTablet ? 9 : 5;
const gap = 2;
const itemSize = (screenWidth - (gap * (numColumns + 1))) / numColumns;

// ============================================================================
// TYPES
// ============================================================================
interface AssetItemProps {
    asset: Asset;
    isSelected: boolean;
    isCurrentlyDragged: boolean;
    isDropTarget: boolean;
    onPress: () => void;
    onLongPress: () => void;
    isScrolling: boolean;
    isHovered: boolean;
}

// ============================================================================
// ASSET ITEM COMPONENT
// ============================================================================
const AssetItem = React.memo(({ 
    asset, 
    isSelected, 
    isCurrentlyDragged, 
    isDropTarget, 
    onPress, 
    onLongPress,
    isScrolling,
    isHovered
}: AssetItemProps) => {
    const itemStyle = {
        width: itemSize,
        height: itemSize,
        position: 'relative' as const,
        opacity: isCurrentlyDragged ? 0.3 : 1,
        borderWidth: isDropTarget ? 2 : 0,
        borderColor: isDropTarget ? '#3B82F6' : 'transparent',
        borderRadius: isDropTarget ? 8 : 0,
        backgroundColor: isDropTarget ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    };

    return (
        <View>
            <TouchableOpacity
                style={itemStyle}
                onPress={isScrolling ? undefined : onPress}
                onLongPress={isScrolling ? undefined : onLongPress}
                activeOpacity={isScrolling ? 1 : 0.7}
                delayPressIn={150}
                delayLongPress={650}
                disabled={isScrolling}
            >
                <Image 
                    source={{ uri: asset.uri }} 
                    className="w-full h-full object-cover"
                />
                
                {isHovered && (
                    <View className="absolute inset-0 bg-opacity-30" />
                )}
                
                {asset.mediaType === 'video' && (
                    <View className="absolute top-1 right-1">
                        <View className="bg-black bg-opacity-50 rounded-full p-1">
                            <Feather name="play" size={12} color="white" />
                        </View>
                    </View>
                )}

                {isDropTarget && (
                    <View className="absolute inset-0 bg-opacity-30 rounded-lg items-center justify-center">
                        <View className="bg-blue-500 rounded-full p-2">
                            <Feather name="arrow-down" size={16} color="white" />
                        </View>
                    </View>
                )}

                {isSelected && (
                    <View className="absolute top-1 right-1">
                        <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white shadow-sm">
                            <Feather name="check" size={12} color="white" />
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
});

AssetItem.displayName = 'AssetItem';

export default AssetItem; 