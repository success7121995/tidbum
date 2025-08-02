import { useSetting } from "@/constant/SettingProvider";
import { deleteAsset, getSettings, updateAsset, updateSettings } from "@/lib/db";
import { getLanguageText, Language } from "@/lib/lang";
import { Asset } from "@/types/asset";
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionSheetIOS, Dimensions, Image, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import Caption from "./svg/caption";

interface AlbumSliderProps {
    visible: boolean;
    assets: Asset[];
    selectedAssetIndex: number;
    onAssetChange: (index: number) => void;
    onClose: () => void;
    onDelete?: (asset: Asset) => void;
    onAssetsUpdate?: (updatedAssets: Asset[]) => void;
}

const AlbumSlider = ({ 
    visible, 
    assets, 
    selectedAssetIndex, 
    onAssetChange, 
    onClose,
    onDelete,
    onAssetsUpdate,
}: AlbumSliderProps) => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [isCaptionOpen, setIsCaptionOpen] = useState(false);
    const [captionText, setCaptionText] = useState('');
    const [isEditingCaption, setIsEditingCaption] = useState(false);
    const [currentIndexState, setCurrentIndexState] = useState(selectedAssetIndex);
    const [updatedAssets, setUpdatedAssets] = useState<Asset[]>(assets);

    // Use updatedAssets if available, otherwise use props
    const displayAssets = updatedAssets.length > 0 ? updatedAssets : assets;

    // ============================================================================
    // CONTEXT
    // ============================================================================
    const { language } = useSetting();
    const text = getLanguageText(language as Language);

    // ============================================================================
    // CONSTANTS
    // ============================================================================
    const SCREEN_WIDTH = Dimensions.get('window').width;
    const SCREEN_HEIGHT = Dimensions.get('window').height;
    const ITEM_WIDTH = SCREEN_WIDTH;

    // ============================================================================
    // ANIMATED VALUES
    // ============================================================================
    const translateX = useSharedValue(-selectedAssetIndex * ITEM_WIDTH);
    const currentIndex = useSharedValue(selectedAssetIndex);
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useEffect(() => {
        if (visible) {
            translateX.value = -selectedAssetIndex * ITEM_WIDTH;
            currentIndex.value = selectedAssetIndex;
            setCurrentIndexState(selectedAssetIndex);
    
            // Reset zoom/pan
            scale.value = 1;
            savedScale.value = 1;
            translateY.value = 0;
            savedTranslateY.value = 0;
        }
    }, [visible, selectedAssetIndex]);

    // Sync local assets with props when they change
    useEffect(() => {
        setUpdatedAssets(assets);
    }, [assets]);

    // Ensure updatedAssets is always in sync when slider is visible
    useEffect(() => {
        if (visible && assets.length !== updatedAssets.length) {
            setUpdatedAssets(assets);
        }
    }, [visible, assets, updatedAssets.length]);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                const settings = await getSettings();
                
                setIsCaptionOpen(Boolean(settings.caption_open));
            })();
        }, [])
    );

    // ============================================================================
    // HANDLERS
    // ============================================================================
    
    /**
     * Handle caption edit
     */
    const handleCaptionEdit = useCallback(() => {
        const currentAsset = displayAssets[currentIndexState];
        setCaptionText(currentAsset.caption || '');
        setIsEditingCaption(true);
    }, [displayAssets, currentIndexState]);

    /**
     * Handle save caption
     */
    const handleSaveCaption = useCallback(async () => {
        const currentAsset = displayAssets[currentIndexState];
        // Create a new asset object to avoid mutating the original
        const updatedAsset = {
            ...currentAsset,
            caption: captionText
        };
        
        try {
            await updateAsset(currentAsset.id, updatedAsset);
            
            // Update the local assets state immediately for instant display
            const newUpdatedAssets = [...displayAssets];
            newUpdatedAssets[currentIndexState] = updatedAsset;
            setUpdatedAssets(newUpdatedAssets);
            
            setIsEditingCaption(false);
            setCaptionText('');
        } catch (error) {
            console.error('Error saving caption:', error);
            // You might want to show an error message to the user here
        }
    }, [captionText, displayAssets, currentIndexState]);

    /**
     * Handle cancel caption edit
     */
    const handleCancelCaption = useCallback(() => {
        setIsEditingCaption(false);
        setCaptionText('');
    }, []);

    /**
     * Handle caption enable
     */
    const handleCaptionEnable = useCallback(async () => {
        const settings = await getSettings();
        const updatedSettings = {
            ...settings,
            caption_open: Number(!Boolean(settings.caption_open))
        };
        
        await updateSettings(updatedSettings);
        setIsCaptionOpen(Boolean(updatedSettings.caption_open));
    }, []);

    /**
     * Handle delete
     */
    const handleDeleteActionSheet = useCallback(async (asset: Asset) => {
        const deleteText = asset?.media_type === 'photo' ? text.deletePhoto : 
                          asset?.media_type === 'video' ? text.deleteVideo : 
                          text.deleteAsset;
        
        ActionSheetIOS.showActionSheetWithOptions({
            message: text.deletingAssetMessage,
            options: [deleteText, text.cancel],
            destructiveButtonIndex: 0,
            cancelButtonIndex: 1,
        }, (buttonIndex) => {
            if (buttonIndex === 0) {
                handleDeleteAsset(asset);
            }
        });
    }, [text]);

    /**
     * Handle delete
     */
    const handleDeleteAsset = useCallback(async (asset: Asset) => {
        try {
            if (!asset.asset_id) {
                console.error('Asset ID is required');
                return;
            }

            await deleteAsset(asset.asset_id);
            
            // Filter out the deleted asset
            const filteredAssets = updatedAssets.filter(a => a.asset_id !== asset.asset_id);
            
            // Update local state
            setUpdatedAssets(filteredAssets);
            
            // Adjust current index if needed
            const newIndex = Math.min(currentIndexState, filteredAssets.length - 1);
            setCurrentIndexState(newIndex);
            currentIndex.value = newIndex;
            translateX.value = -newIndex * ITEM_WIDTH;
            
            // Update the parent's selected index
            onAssetChange?.(newIndex);
            
            // Immediately call callbacks to update parent
            onDelete?.(asset);
            onAssetsUpdate?.(filteredAssets);
        } catch (error) {
            console.error('Error deleting asset:', error);
        }
    }, [updatedAssets, onDelete, onAssetsUpdate, currentIndexState, currentIndex, translateX, ITEM_WIDTH, onAssetChange]);

    /**
     * Handle close
     */
    const handleClose = useCallback(() => {
        // Assets are already synced when deleted, so just close
        onClose();
    }, [onClose]);

    // ============================================================================
    // GESTURE HANDLERS
    // ============================================================================

    /**
     * Handle pan
     */
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (scale.value <= 1) {
                // Horizontal pan for navigation when not zoomed
                translateX.value = event.translationX - currentIndex.value * ITEM_WIDTH;
            } else {
                // Vertical pan for moving zoomed image
                translateY.value = savedTranslateY.value + event.translationY;
            }
        })
        .onEnd((event) => {
            if (scale.value <= 1) {
                const velocity = event.velocityX;
                const translation = event.translationX;
        
                let targetIndex = currentIndex.value;
                if (Math.abs(translation) > ITEM_WIDTH * 0.3 || Math.abs(velocity) > 500) {
                    if (translation > 0 || velocity > 0) {
                        targetIndex = Math.max(0, currentIndex.value - 1);
                    } else {
                        targetIndex = Math.min(displayAssets.length - 1, currentIndex.value + 1);
                    }
                } else {
                }
        
                translateX.value = withSpring(-targetIndex * ITEM_WIDTH, {
                    damping: 20,
                    stiffness: 200,
                });
        
                currentIndex.value = targetIndex;
        
                runOnJS(setCurrentIndexState)(targetIndex);

                if (onAssetChange) {
                    runOnJS(onAssetChange)(targetIndex);
                }
            } else {
                savedTranslateY.value = translateY.value;
            }
        });
        

    /**
     * Handle pinch
     */
    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = savedScale.value * event.scale;
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            if (scale.value < 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
            } else if (scale.value > 3) {
                scale.value = withSpring(3);
                savedScale.value = 3;
            }
        });

    /**
     * Handle double tap
     */
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onStart(() => {
            if (scale.value > 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
                translateY.value = withSpring(0);
                savedTranslateY.value = 0;
            } else {
                scale.value = withSpring(2);
                savedScale.value = 2;
            }
        });

    /**
     * Compose gesture
     */
    const composedGesture = Gesture.Simultaneous(
        Gesture.Simultaneous(panGesture, pinchGesture),
        doubleTapGesture
    );

    // ============================================================================
    // ANIMATED STYLES
    // ============================================================================
    /**
     * Animated style for the main container
     */
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    /**
     * Animated style for the image
     */
    const imageAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { translateY: translateY.value },
            ],
        };
    });

    // ============================================================================
    // RENDER
    // ============================================================================

    /**
     * Render asset
     * @param asset - The asset to render
     * @param index - The index of the asset
     * @returns
     */
    const renderAsset = useCallback((asset: Asset, index: number) => {
        // Calculate aspect ratio for iOS-style display
        const aspectRatio = asset.width / asset.height;
        const imageHeight = aspectRatio > 1 
            ? ITEM_WIDTH / aspectRatio 
            : Math.min(ITEM_WIDTH / aspectRatio, SCREEN_HEIGHT * 0.8);

        // Only apply zoom/pan transforms to the currently visible asset
        const isCurrentAsset = index === currentIndexState;
        const imageStyle = isCurrentAsset ? imageAnimatedStyle : {};

        return (
            <Animated.View
                key={asset.id}
                className="justify-center items-center"
                style={{
                    width: ITEM_WIDTH,
                    height: SCREEN_HEIGHT,
                    marginTop: -50, // Move image higher to true center
                }}
            >
                <Animated.View
                    className="justify-center items-center"
                    style={imageStyle}
                >
                    <Image
                        source={{ uri: asset.uri }}
                        style={{
                            width: ITEM_WIDTH,
                            height: imageHeight,
                        }}
                        resizeMode="contain"
                    />
                </Animated.View>
            </Animated.View>
        );
    }, [ITEM_WIDTH, SCREEN_HEIGHT, imageAnimatedStyle, currentIndexState]);

    /**
     * Render indicators
     * @returns
     */
    const renderThumbnails = useMemo(() => {
        return (
            <View 
                className="absolute left-0 right-0 flex-row justify-center items-center gap-2"
                style={{
                    bottom: 40,
                }}
            >
                <ScrollView horizontal>
                    {displayAssets.map((asset, index) => (
                                                    <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    const targetIndex = index;
                                    translateX.value = withSpring(-targetIndex * ITEM_WIDTH, {
                                        damping: 20,
                                        stiffness: 200,
                                    });
                                    currentIndex.value = targetIndex;
                                    setCurrentIndexState(targetIndex);
                                    if (onAssetChange) {
                                        onAssetChange(targetIndex);
                                    }
                                }}
                            className={`rounded-lg overflow-hidden border-2 ${
                                index === currentIndexState 
                                    ? 'border-white' 
                                    : 'border-transparent'
                            }`}
                            style={{
                                width: 40,
                                height: 40,
                            }}
                        >
                            <Image
                                source={{ uri: asset.uri }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    }, [displayAssets, currentIndexState, ITEM_WIDTH, translateX, currentIndex, onAssetChange]);

    /**
     * Render caption
     * @returns
     */
    const renderCaption = useMemo(() => {
        if (!isCaptionOpen) {
            return null;
        }

        // Use selectedAssetIndex for now to avoid Reanimated warnings
        const currentAsset = displayAssets[selectedAssetIndex];

        return (
            <View 
                className="absolute bottom-20 w-full h-[250px]"
                pointerEvents="none"
            >
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)']}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="flex-1 justify-center items-center"
                    >
                        <View className="overflow-hidden w-full h-[300px] px-3 pt-[80px]">
                            <Text className="text-white text-sm font-medium">
                                {currentAsset?.caption || ''}
                            </Text>
                    </View>
                </LinearGradient>
            </View>
        );
    }, [displayAssets, currentIndexState, isCaptionOpen]);

    /**
     * Render close button
     * @returns
     */
    const renderCloseButton = useMemo(() => {
        return (
            <TouchableOpacity
                onPress={handleClose}
                className="absolute bg-black bg-opacity-70 w-10 h-10 rounded-full justify-center items-center z-10"
                style={{
                    top: 20,
                    left: 20,
                }}
            >
                <Feather name="x" size={20} color="white" />
            </TouchableOpacity>
        );
    }, [handleClose]);

    /**
     * Render action buttons
     * @returns
     */
    const renderActionButtons = useMemo(() => {
        const currentAsset = displayAssets[currentIndexState];
        
        return (
            <View 
                className="absolute flex-row gap-2 z-10"
                style={{
                    top: 20,
                    right: 20,
                }}
            >
                    {/* Caption Enable */}
                    <TouchableOpacity
                        onPress={handleCaptionEnable}
                        activeOpacity={0.7}
                        className="bg-black bg-opacity-70 w-10 h-10 rounded-full justify-center items-center"
                    >
                        <Caption size={22} color={isCaptionOpen ? 'white' : 'gray'} />
                    </TouchableOpacity>

                    {/* Edit */}
                    <TouchableOpacity
                        onPress={handleCaptionEdit}
                        activeOpacity={0.7}
                        className="bg-black bg-opacity-70 w-10 h-10 rounded-full justify-center items-center"
                    >
                        <Feather name="edit" size={18} color="white" />
                    </TouchableOpacity>

                    {/* Delete */}
                    <TouchableOpacity
                        onPress={() => handleDeleteActionSheet(currentAsset)}
                        activeOpacity={0.7}
                        className="bg-black bg-opacity-70 w-10 h-10 rounded-full justify-center items-center"
                    >
                        <Feather name="trash-2" size={18} color="white" />
                    </TouchableOpacity>
            </View>
        );
    }, [displayAssets, currentIndexState, isCaptionOpen, handleDeleteActionSheet, handleCaptionEdit, isEditingCaption]);

    if (!visible || !assets.length) {
        return null;
    }

    // If no display assets after filtering, close the slider
    if (displayAssets.length === 0) {
        // Close the slider when no assets remain
        setTimeout(() => {
            onClose();
        }, 100);
        return null;
    }

    return (
        <Modal
            visible={visible}
            onRequestClose={handleClose}
            animationType="fade"
            presentationStyle="fullScreen"
        >
            <SafeAreaView className="flex-1 bg-black">          
                <GestureHandlerRootView className="flex-1">
                    <View className="flex-1 bg-black">
                        <GestureDetector gesture={composedGesture}>
                            <Animated.View 
                                className="flex-row"
                                style={[{
                                    height: SCREEN_HEIGHT,
                                }, animatedStyle]}
                            >
                                {displayAssets.map((asset, index) => renderAsset(asset, index))}
                            </Animated.View>
                        </GestureDetector>

                    {renderCaption}
                        {renderThumbnails}
                        {renderCloseButton}
                        {renderActionButtons}
                    </View>
                    

                    {/* Edit caption modal - rendered inside main modal */}
                    {isEditingCaption && (
                        <TouchableOpacity 
                            onPress={handleCancelCaption} 
                            className="absolute inset-0 bg-black/50 justify-center items-center px-4"
                            activeOpacity={1}
                        >
                            {/* Small Alert-like Modal */}
                            <TouchableOpacity 
                                activeOpacity={1}
                                className="bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
                            >
                                {/* Header */}
                                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-700">
                                    <TouchableOpacity onPress={handleCancelCaption}>
                                        <Text className="text-gray-400 text-base">{text.cancel}</Text>
                                    </TouchableOpacity>
                                    
                                    <Text className="text-white text-base font-semibold">{text.editCaption}</Text>
                                    
                                    <TouchableOpacity onPress={handleSaveCaption}>
                                        <Text className="text-blue-500 text-base font-semibold">{text.saveAlbum}</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Content */}
                                <View className="p-4">
                                    {/* Small Image Preview */}
                                    <View className="items-center mb-4">
                                        <Image
                                            source={{ uri: assets[currentIndexState]?.uri }}
                                            className="w-48 h-32 rounded-lg"
                                            resizeMode="cover"
                                        />
                                    </View>

                                    {/* Caption Input */}
                                    <TextInput
                                        value={captionText}
                                        onChangeText={setCaptionText}
                                        placeholder={text.addCaption}
                                        placeholderTextColor="#666"
                                        multiline
                                        textAlignVertical="top"
                                        className="bg-gray-800 text-white p-3 rounded-lg min-h-20 text-sm"
                                        style={{
                                            borderWidth: 1,
                                            borderColor: '#444',
                                        }}
                                    />
                                </View>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                </GestureHandlerRootView>
            </SafeAreaView>
        </Modal>
    );
};

export default AlbumSlider;