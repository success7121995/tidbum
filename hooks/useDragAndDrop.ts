import { useCallback, useState } from "react";

export const useDragAndDrop = () => {
    const [draggedItem, setDraggedItem] = useState<{ type: 'asset' | 'album', index: number } | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

    const resetDragState = useCallback(() => {
        setDraggedItem(null);
        setDropTargetIndex(null);
    }, []);

    const startDrag = useCallback((type: 'asset' | 'album', index: number) => {
        setDraggedItem({ type, index });
    }, []);

    const updateDropTarget = useCallback((index: number | null) => {
        setDropTargetIndex(index);
    }, []);

    const endDrag = useCallback(() => {
        setDraggedItem(null);
        setDropTargetIndex(null);
    }, []);

    return {
        draggedItem,
        dropTargetIndex,
        setDraggedItem,
        setDropTargetIndex,
        resetDragState,
        startDrag,
        updateDropTarget,
        endDrag,
    };
}; 