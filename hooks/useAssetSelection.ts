import { Asset } from "@/types/asset";
import { useCallback, useState } from "react";

interface UseAssetSelectionProps {
    assets: Asset[];
    onSelectionChange?: (assets: Asset[]) => void;
}

export const useAssetSelection = ({ assets, onSelectionChange }: UseAssetSelectionProps) => {
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const enterSelectionModeAndSelect = useCallback((assetId: string) => {
        setIsSelectionMode(true);
        setSelectedAssetIds(new Set([assetId]));
        const selectedAsset = assets.find(asset => asset.id === assetId);
        if (selectedAsset) {
            onSelectionChange?.([selectedAsset]);
        }
    }, [assets, onSelectionChange]);

    const exitSelectionMode = useCallback(() => {
        setIsSelectionMode(false);
        setSelectedAssetIds(new Set());
        onSelectionChange?.([]);
    }, [onSelectionChange]);

    const toggleAssetSelection = useCallback((assetId: string) => {
        if (!isSelectionMode) return;

        setSelectedAssetIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(assetId)) {
                newSet.delete(assetId);
            } else {
                newSet.add(assetId);
            }
            
            const selectedAssetsArray = assets.filter(asset => newSet.has(asset.id));
            onSelectionChange?.(selectedAssetsArray);
            
            return newSet;
        });
    }, [isSelectionMode, assets, onSelectionChange]);

    const clearSelection = useCallback(() => {
        setSelectedAssetIds(new Set());
        setIsSelectionMode(false);
        onSelectionChange?.([]);
    }, [onSelectionChange]);

    const getSelectedAssets = useCallback(() => {
        return assets.filter(asset => selectedAssetIds.has(asset.id));
    }, [assets, selectedAssetIds]);

    return {
        selectedAssetIds,
        isSelectionMode,
        enterSelectionModeAndSelect,
        exitSelectionMode,
        toggleAssetSelection,
        clearSelection,
        getSelectedAssets,
    };
}; 