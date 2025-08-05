export interface Asset {
    // Core identifiers
    id: string;
    asset_id?: string; // For database compatibility
    album_id?: string;
    
    // File information
    filename: string;
    name?: string; // For database compatibility
    uri: string;
    localUri?: string;
    
    // Media properties
    mediaType: 'photo' | 'video';
    media_type?: 'photo' | 'video'; // For database compatibility
    mediaSubtypes: string[];
    media_subtype?: string; // For database compatibility
    order_index: number; // For database compatibility

    // Dimensions and duration
    width: number;
    height: number;
    duration?: number;
    
    // Timestamps
    creationTime?: number;
    modificationTime?: number;
    created_at?: string; // For database compatibility
    updated_at?: string; // For database compatibility
    
    // Additional properties
    orientation?: number;
    isFavorite?: boolean;
    isHidden?: boolean;
    caption?: string;
    album_name?: string;

    // Relationships
    pairedVideoAsset?: Asset | null;
    
    // EXIF metadata
    exif?: {
        ColorModel?: string;
        Depth?: number;
        PixelHeight?: number;
        PixelWidth?: number;
        ProfileName?: string;
        '{Exif}'?: any[];
        '{JFIF}'?: any[];
        '{GPS}'?: any[];
        '{TIFF}'?: any[];
        [key: string]: any;
    };
    
    // GPS location data
    location?: {
        latitude: number;
        longitude: number;
        altitude?: number;
        heading?: number;
        speed?: number;
        timestamp?: number;
    };
}