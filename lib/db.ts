import { Asset } from '@/types/asset';
import { Settings } from '@/types/setting';
import * as SQLite from 'expo-sqlite';
import uuid from 'react-native-uuid';
import { Album } from '../types/album';

// Database name
const DATABASE_NAME = 'tidbum.db';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Initialize the SQLite database
 * Creates the database and necessary tables
 */
export const initDb = async (): Promise<SQLite.SQLiteDatabase> => {
    if (db) {
        return db;
    }

    try {
        // Open the database
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);

        if (!db) {
            throw new Error('Failed to open database');
        }
        
        // Enable foreign key constraints
        await db.execAsync('PRAGMA foreign_keys = ON;');
        
        // Create album table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS album (
                album_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                cover_uri TEXT,
                parent_album_id TEXT,
                order_index FLOAT DEFAULT 1000,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        
        // Create asset table for storing media items in albums
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS asset (
                asset_id TEXT PRIMARY KEY,
                album_id TEXT NOT NULL,
                name TEXT NOT NULL,
                uri TEXT NOT NULL,
                local_uri TEXT,
                media_type TEXT CHECK(media_type IN ('photo', 'video')) NOT NULL,
                media_subtypes TEXT,
                width INTEGER,
                height INTEGER,
                duration INTEGER,
                caption TEXT,
                size INTEGER,
                order_index FLOAT DEFAULT 1000,
                creation_time INTEGER,
                modification_time INTEGER,
                orientation INTEGER,
                is_favorite BOOLEAN DEFAULT FALSE,
                is_hidden BOOLEAN DEFAULT FALSE,
                exif_data TEXT,
                location_latitude REAL,
                location_longitude REAL,
                location_altitude REAL,
                location_heading REAL,
                location_speed REAL,
                location_timestamp INTEGER,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (album_id) REFERENCES album (album_id) ON DELETE CASCADE
            );
        `);

        // Create setting table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS setting (
                lang TEXT DEFAULT NULL,
                caption_open BOOLEAN DEFAULT 0
            );
        `);

        return db;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

/**
 * Delete all tables
 */
export const deleteAllTables = async (): Promise<void> => {
    if (!db) {
        throw new Error('Database not initialized');
    }
    await db.execAsync('DROP TABLE IF EXISTS album');
    await db.execAsync('DROP TABLE IF EXISTS asset');
    await db.execAsync('DROP TABLE IF EXISTS setting');
};

/**
 * Get the database instance
 * Initializes the database if not already done
 */
export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        return await initDb();
    }
    
    // Ensure foreign key constraints are enabled
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    return db;
};

/**
 * Clear all tables
 */
export const clearAllTables = async (): Promise<void> => {
    if (!db) {
        throw new Error('Database not initialized');
    }
    await db.execAsync('DELETE FROM album');
    await db.execAsync('DELETE FROM asset');
    await db.execAsync('DELETE FROM setting');
};

/**
 * Reset database completely (delete and recreate)
 */
export const resetDatabase = async (): Promise<void> => {
    if (!db) {
        throw new Error('Database not initialized');
    }
    await deleteAllTables();
    await initDb();
};

// ============================================================================
// ALBUM OPERATIONS
// ============================================================================

/**
 * Create a new album   
 * @param album - The album to create
 * @returns The album ID
 */
export const createAlbum = async (album: Album): Promise<string> => {
    try {
        const db = await getDb();
        const albumId = uuid.v4();

        // Get the next available order index for this parent album
        const nextOrderIndex = await getNextAlbumOrderIndex(album.parent_album_id || null);

        const stmt = await db.prepareAsync(
            'INSERT INTO album (album_id, name, description, parent_album_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);'
        );
        
        const insertParams = [
            albumId, 
            album.name, 
            album.description || '', 
            album.parent_album_id || null, 
            nextOrderIndex,
            new Date().toISOString(), 
            new Date().toISOString()
        ];
        
        await stmt.executeAsync(insertParams);
        
        await stmt.finalizeAsync();

        return albumId;
    } catch (error) {
        console.error('Error creating album:', error);
        throw error;
    }
};

/**
 * Get album by ID with assets and sub-albums
 * @param albumId - The album ID to get
 * @returns The album or null if not found
 */
export const getAlbumById = async (albumId: string): Promise<Album | null> => {
    try {
        const db = await getDb();
        
        // Get the album with cover asset and total assets count
        const albumResult = await db.getAllAsync(`
            SELECT 
                a.album_id,
                a.name,
                a.description,
                a.cover_uri,
                a.parent_album_id,
                a.order_index,
                a.created_at,
                a.updated_at,
                cover.uri as cover_uri_from_join,
                cover.name as cover_name,
                cover.media_type as cover_media_type,
                (SELECT COUNT(*) FROM asset WHERE album_id = a.album_id) as total_assets
            FROM album a
            LEFT JOIN asset cover ON a.cover_uri = cover.uri
            WHERE a.album_id = ?
        `, [albumId]);
        
        if (albumResult && Array.isArray(albumResult) && albumResult.length > 0) {
            const albumRow = albumResult[0] as any;

            // a.media_subtypes as mediaSubtypes,
            // a.media_subtypes as media_subtype,
            // a.width,
            // a.height,
            // a.duration,
            // a.creation_time as creationTime,
            // a.modification_time as modificationTime,
            // a.added_at as created_at,
            // a.updated_at,
            // a.orientation,
            // a.is_favorite as isFavorite,
            // a.is_hidden as isHidden,

            // Get all assets in this album
            const assetsResult = await db.getAllAsync(`
                SELECT 
                    a.asset_id as id,
                    a.asset_id,
                    a.album_id,
                    a.name as filename,
                    a.name,
                    a.uri,
                    a.local_uri as localUri,
                    a.media_type as mediaType,
                    a.width,
                    a.height,
                    a.media_type,
                    a.caption,
                    a.order_index as orderIndex,
                    CASE 
                        WHEN a.media_type LIKE 'photo/%' THEN 'photo'
                        WHEN a.media_type LIKE 'video/%' THEN 'video'
                        ELSE 'other'
                    END as asset_type
                FROM asset a
                WHERE a.album_id = ?
                ORDER BY a.order_index ASC
            `, [albumId]);

            // Get all sub-albums
            const subAlbumsResult = await db.getAllAsync(`
                SELECT 
                    a.album_id,
                    a.name,
                    a.description,
                    a.cover_uri,
                    a.parent_album_id,
                    a.order_index,
                    a.created_at,
                    a.updated_at,
                    cover.uri as cover_uri_from_join,
                    cover.name as cover_name,
                    cover.media_type as cover_media_type,
                    (SELECT COUNT(*) FROM asset WHERE album_id = a.album_id) as total_assets
                FROM album a
                LEFT JOIN asset cover ON a.cover_uri = cover.uri
                WHERE a.parent_album_id = ?
                ORDER BY a.order_index ASC
            `, [albumId]);

            // Process sub-albums to include totalAssets
            const processedSubAlbums = subAlbumsResult.map((subAlbumRow: any) => ({
                album_id: subAlbumRow.album_id,
                name: subAlbumRow.name,
                description: subAlbumRow.description || '',
                cover_uri: subAlbumRow.cover_uri || subAlbumRow.cover_uri_from_join || undefined,
                parent_album_id: subAlbumRow.parent_album_id || undefined,
                totalAssets: subAlbumRow.total_assets || 0
            }));

            const album: Album = {
                album_id: albumRow.album_id,
                name: albumRow.name,
                description: albumRow.description || '',
                cover_uri: albumRow.cover_uri || albumRow.cover_uri_from_join || undefined,
                parent_album_id: albumRow.parent_album_id || undefined,
                totalAssets: albumRow.total_assets || 0,
                assets: assetsResult as any[] || [],
                subAlbums: processedSubAlbums || []
            };

            return album;
        }
        
        return null;
    } catch (error) {
        console.error('Error getting album by ID:', error);
        return null;
    }
};

/**
 * Get parent album by ID
 * @param albumId - The album ID to get the parent of
 * @returns The parent album or null if no parent exists
 */
export const getParentAlbum = async (albumId: string): Promise<Album | null> => {
    try {
        const db = await getDb();
        
        // Get the current album to find its parent
        const currentAlbumResult = await db.getAllAsync(
            'SELECT parent_album_id FROM album WHERE album_id = ?',
            [albumId]
        );
        
        if (!currentAlbumResult || currentAlbumResult.length === 0) {
            return null;
        }
        
        const parentAlbumId = (currentAlbumResult[0] as any).parent_album_id;
        
        if (!parentAlbumId) {
            return null; // This is a top-level album
        }
        
        // Get the parent album details
        const parentResult = await db.getAllAsync(`
            SELECT 
                a.album_id,
                a.name,
                a.description,
                a.cover_uri,
                a.parent_album_id,
                a.order_index,
                a.created_at,
                a.updated_at,
                cover.uri as cover_uri_from_join,
                cover.name as cover_name,
                cover.media_type as cover_media_type,
                (SELECT COUNT(*) FROM asset WHERE album_id = a.album_id) as total_assets
            FROM album a
            LEFT JOIN asset cover ON a.cover_uri = cover.uri
            WHERE a.album_id = ?
        `, [parentAlbumId]);
        
        if (parentResult && parentResult.length > 0) {
            const parentRow = parentResult[0] as any;
            return {
                album_id: parentRow.album_id,
                name: parentRow.name,
                description: parentRow.description || '',
                cover_uri: parentRow.cover_uri || parentRow.cover_uri_from_join || undefined,
                parent_album_id: parentRow.parent_album_id || undefined,
                totalAssets: parentRow.total_assets || 0
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting parent album:', error);
        return null;
    }
};

/**
 * Get all top-level albums
 */
export const getTopLevelAlbums = async (): Promise<(Album & { totalAssets: number })[]> => {
    try {
        const db = await getDb();
        
        // Get all top-level albums (where parent_album_id IS NULL)
        const result = await db.getAllAsync(`
            SELECT 
                a.album_id,
                a.name,
                a.description,
                a.cover_uri,
                a.parent_album_id,
                a.order_index,
                a.created_at,
                a.updated_at
            FROM album a
            WHERE a.parent_album_id IS NULL 
            ORDER BY a.order_index ASC
        `);
        
        // Convert result to Album array with cover photo info and asset counts
        const albums: (Album & { totalAssets: number })[] = [];

        if (result && Array.isArray(result)) {
            for (const row of result) {
                const albumRow = row as any;
                const album: Album = {
                    album_id: albumRow.album_id,
                    name: albumRow.name,
                    description: albumRow.description || '',
                    cover_uri: albumRow.cover_uri || undefined,
                    parent_album_id: albumRow.parent_album_id || undefined
                };
                
                // Get total asset count for this album (including sub-albums)
                const totalAssets = await getAlbumTotalAssetCount(albumRow.album_id);
                
                albums.push({
                    ...album,
                    totalAssets
                });
            }
        } else {
            console.error('Result is not an array:', typeof result, result);
        }

        return albums;
    } catch (error) {
        console.error('Error getting top-level albums:', error);
        throw error;
    }
};

/**
 * Get total asset count for an album including all sub-albums
 */
const getAlbumTotalAssetCount = async (albumId: string): Promise<number> => {
    try {
        const db = await getDb();
        
        // Get all sub-album IDs recursively
        const subAlbumIds = await getAllSubAlbumIds(albumId);
        
        // Count assets in this album and all sub-albums
        const albumIdsToCount = [albumId, ...subAlbumIds];
        const placeholders = albumIdsToCount.map(() => '?').join(',');
        
        const countResult = await db.getAllAsync(
            `SELECT COUNT(*) as count FROM asset WHERE album_id IN (${placeholders})`,
            albumIdsToCount
        );
        
        return (countResult[0] as any)?.count || 0;
    } catch (error) {
        console.error('Error getting album total asset count:', error);
        return 0;
    }
};

/**
 * Get all sub-album IDs recursively
 */
const getAllSubAlbumIds = async (parentAlbumId: string): Promise<string[]> => {
    try {
        const db = await getDb();
        const subAlbumIds: string[] = [];
        
        // Get direct sub-albums
        const directSubs = await db.getAllAsync(
            'SELECT album_id FROM album WHERE parent_album_id = ?',
            [parentAlbumId]
        );
        
        for (const sub of directSubs) {
            const subId = (sub as any).album_id;
            subAlbumIds.push(subId);
            
            // Recursively get sub-albums of this sub-album
            const nestedSubs = await getAllSubAlbumIds(subId);
            subAlbumIds.push(...nestedSubs);
        }
        
        return subAlbumIds;
    } catch (error) {
        console.error('Error getting sub-album IDs:', error);
        return [];
    }
};

/**
 * Update an album
 */
export const updateAlbum = async (albumId: string, album: Album): Promise<string> => {
    try {
        const db = await getDb();

        const result = await db.runAsync(
            'UPDATE album SET name = ?, description = ?, cover_uri = ?, updated_at = ? WHERE album_id = ?',
            [
                album.name,
                album.description || '',
                album.cover_uri || null,
                new Date().toISOString(),
                albumId
            ]
        );

        if (result.changes === 0) {
            throw new Error('Album not found or no changes made');
        }

        return albumId;
    } catch (error) {
        console.error('Error updating album:', error);
        throw error;
    }
};

/**
 * Delete an album
 * @param albumId - The album ID to delete
 */
export const deleteAlbum = async (albumId: string): Promise<string> => {
    try {
        const db = await getDb();
        
        const result = await db.runAsync('DELETE FROM album WHERE album_id = ?', [albumId]);

        if (result.changes === 0) {
            throw new Error('Album not found');
        }

        return albumId;
    } catch (error) {
        console.error('Error deleting album:', error);
        throw error;
    }
};

// ============================================================================
// COVER IMAGE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * COVER IMAGE MANAGEMENT SYSTEM
 * 
 * This system automatically handles cover image integrity when assets are deleted or moved:
 * 
 * 1. When an asset is deleted:
 *    - If the deleted asset was a cover image, it's automatically reset to NULL
 *    - A new cover image is automatically selected from the first available asset in the album
 * 
 * 2. When assets are moved between albums:
 *    - All affected albums (source and target) are checked for invalid cover images
 *    - Invalid cover images are reset and new ones are automatically selected
 * 
 * 3. When multiple assets are deleted:
 *    - All affected albums are checked for invalid cover images
 *    - Invalid cover images are reset and new ones are automatically selected
 * 
 * 4. Maintenance functions:
 *    - cleanupAllInvalidCoverImages(): Clean up all invalid cover images across the database
 *    - resetInvalidCoverImages(): Reset cover images for specific albums
 *    - setNewCoverImage(): Manually set a new cover image for an album
 * 
 * 5. Transaction Safety:
 *    - All functions support nested transaction calls to prevent "transaction within transaction" errors
 *    - Functions can be called with useTransaction=false when already within a transaction
 * 
 * The system ensures that albums never have orphaned cover images and automatically
 * maintains visual consistency by selecting the first available asset as the new cover.
 */

/**
 * Set a new cover image for an album by selecting the first available asset
 * @param albumId - The album ID to set a new cover image for
 * @param useTransaction - Whether to use a transaction (default: true, set to false when called from within another transaction)
 * @returns The URI of the new cover image, or null if no assets are available
 */
export const setNewCoverImage = async (albumId: string, useTransaction: boolean = true): Promise<string | null> => {
    try {
        const db = await getDb();
        
        // Get the first asset in the album (by order_index)
        const result = await db.getAllAsync(`
            SELECT uri FROM asset 
            WHERE album_id = ? 
            ORDER BY order_index ASC 
            LIMIT 1
        `, [albumId]);
        
        if (result && result.length > 0) {
            const newCoverUri = (result[0] as any).uri;
            
            // Update the album with the new cover image
            await db.runAsync(
                'UPDATE album SET cover_uri = ?, updated_at = ? WHERE album_id = ?',
                [newCoverUri, new Date().toISOString(), albumId]
            );
            
            return newCoverUri;
        }
    
        return null;
    } catch (error) {
        console.error('Error setting new cover image:', error);
        return null;
    }
};

/**
 * Reset cover images and optionally set new ones for albums where the cover image no longer exists
 * @param albumIds - Array of album IDs to check and reset cover images for
 * @param setNewCover - Whether to automatically set a new cover image (default: true)
 * @param useTransaction - Whether to use a transaction (default: true, set to false when called from within another transaction)
 */
export const resetInvalidCoverImages = async (albumIds: string[], setNewCover: boolean = true, useTransaction: boolean = true): Promise<void> => {
    try {
        const db = await getDb();
        
        if (albumIds.length === 0) {
            return;
        }
        
        // Start transaction for better performance (only if not already in a transaction)
        if (useTransaction) {
            await db.execAsync('BEGIN TRANSACTION');
        }
        
        const placeholders = albumIds.map(() => '?').join(',');
        
        // Find albums where the cover_uri is not null but the asset doesn't exist in the album
        const invalidCoverResult = await db.getAllAsync(`
            SELECT DISTINCT a.album_id, a.cover_uri
            FROM album a
            WHERE a.album_id IN (${placeholders})
            AND a.cover_uri IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM asset 
                WHERE asset.album_id = a.album_id 
                AND asset.uri = a.cover_uri
            )
        `, albumIds);
        
        if (invalidCoverResult && invalidCoverResult.length > 0) {
            
            // Reset cover_uri for these albums
            const albumsToReset = invalidCoverResult.map((row: any) => row.album_id);
            const resetPlaceholders = albumsToReset.map(() => '?').join(',');
            
            await db.runAsync(`
                UPDATE album 
                SET cover_uri = NULL, updated_at = ? 
                WHERE album_id IN (${resetPlaceholders})
            `, [new Date().toISOString(), ...albumsToReset]);
            
            // Optionally set new cover images
            if (setNewCover) {
                for (const albumId of albumsToReset) {
                    await setNewCoverImage(albumId, false); // Don't use transaction for nested calls
                }
            }
        }
        
        // Commit transaction (only if we started one)
        if (useTransaction) {
            await db.execAsync('COMMIT');
        }
        
    } catch (error) {
        // Rollback transaction on error (only if we started one)
        if (useTransaction) {
            try {
                const db = await getDb();
                await db.execAsync('ROLLBACK');
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError);
            }
        }
        
        console.error('Error resetting invalid cover images:', error);
        throw error;
    }
};

/**
 * Clean up all invalid cover images across the entire database
 * This is useful for maintenance and fixing any orphaned cover images
 */
export const cleanupAllInvalidCoverImages = async (): Promise<void> => {
    try {
        const db = await getDb();
        
        // Start transaction for better performance
        await db.execAsync('BEGIN TRANSACTION');
        
        // Find all albums where the cover_uri is not null but the asset doesn't exist in the album
        const invalidCoverResult = await db.getAllAsync(`
            SELECT DISTINCT a.album_id, a.cover_uri
            FROM album a
            WHERE a.cover_uri IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM asset 
                WHERE asset.album_id = a.album_id 
                AND asset.uri = a.cover_uri
            )
        `);
        
        if (invalidCoverResult && invalidCoverResult.length > 0) {
            
            // Reset cover_uri for these albums
            const albumsToReset = invalidCoverResult.map((row: any) => row.album_id);
            const resetPlaceholders = albumsToReset.map(() => '?').join(',');
            
            await db.runAsync(`
                UPDATE album 
                SET cover_uri = NULL, updated_at = ? 
                WHERE album_id IN (${resetPlaceholders})
            `, [new Date().toISOString(), ...albumsToReset]);
            
        }
        
        // Commit transaction
        await db.execAsync('COMMIT');
        
    } catch (error) {
        // Rollback transaction on error
        try {
            const db = await getDb();
            await db.execAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        console.error('Error cleaning up invalid cover images:', error);
        throw error;
    }
};

/**
 * USAGE EXAMPLES:
 * 
 * // Automatic cover image management (happens automatically when assets are deleted/moved)
 * await deleteAsset('asset-123'); // Will automatically reset cover if needed and set new one
 * await moveAssetsToAlbum(['asset-1', 'asset-2'], 'target-album-id'); // Will check and fix covers
 * 
 * // Manual cover image management
 * await setNewCoverImage('album-123'); // Set first available asset as cover
 * await resetInvalidCoverImages(['album-1', 'album-2']); // Reset invalid covers for specific albums
 * await cleanupAllInvalidCoverImages(); // Clean up all invalid covers in database
 * 
 * // Disable automatic new cover selection
 * await resetInvalidCoverImages(['album-1'], false); // Reset but don't set new cover
 * 
 * // When calling from within another transaction (advanced usage)
 * await resetInvalidCoverImages(['album-1'], true, false); // Reset with new cover but no transaction
 * await setNewCoverImage('album-1', false); // Set new cover without transaction
 */

// ============================================================================
// ASSET OPERATIONS
// ============================================================================

/**
 * Insert multiple media assets to the database at once
 * @param albumId - The album ID to associate with
 * @param mediaAssets - Array of media assets to insert
 * @param startOrderIndex - Starting order index for the assets (defaults to 1000.0)
 * @returns Array of inserted asset IDs
 */
export const insertAssets = async (albumId: string, mediaAssets: Asset[]): Promise<string[]> => {
    try {
        const db = await getDb();
        
        // Start transaction for better performance
        await db.execAsync('BEGIN TRANSACTION');
        
        // Get the next available order index once for the first asset
        const baseOrderIndex = await getNextAssetOrderIndex(albumId);
        
        const stmt = await db.prepareAsync(`
            INSERT OR REPLACE INTO asset (
                asset_id, album_id, name, uri, local_uri, media_type, media_subtypes,
                width, height, duration, caption, size, order_index, creation_time, modification_time,
                orientation, is_favorite, is_hidden, exif_data,
                location_latitude, location_longitude, location_altitude,
                location_heading, location_speed, location_timestamp,
                added_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const insertedIds: string[] = [];
        
        for (let i = 0; i < mediaAssets.length; i++) {
            const asset = mediaAssets[i];
            
            // Calculate order index for this asset (base + increment for each asset)
            const orderIndex = baseOrderIndex + (i * 1000);
            
            const insertParams = [
                asset.id,
                albumId,
                asset.filename,
                asset.uri,
                asset.localUri || null,
                asset.mediaType,
                JSON.stringify(asset.mediaSubtypes || []),
                asset.width,
                asset.height,
                asset.duration,
                '', // caption
                null, // size - not available from media library
                orderIndex, // order_index - sequential assignment
                asset.creationTime,
                asset.modificationTime,
                asset.orientation || null,
                asset.isFavorite ? 1 : 0,
                asset.isHidden ? 1 : 0,
                JSON.stringify(asset.exif || {}),
                asset.location?.latitude || null,
                asset.location?.longitude || null,
                asset.location?.altitude || null,
                asset.location?.heading || null,
                asset.location?.speed || null,
                asset.location?.timestamp || null,
                new Date().toISOString(),
                new Date().toISOString()
            ];
            
            await stmt.executeAsync(insertParams as any);
            insertedIds.push(asset.id);
        }
        
        await stmt.finalizeAsync();
        
        // Commit transaction
        await db.execAsync('COMMIT');

        return insertedIds;
    } catch (error) {
        // Rollback transaction on error
        try {
            const db = await getDb();
            await db.execAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        console.error('Error inserting media assets:', error);
        throw error;
    }
};

/**
 * Get media assets by album ID
 * @param albumId - The album ID
 * @returns Array of media assets
 */
export const getMediaAssetsByAlbumId = async (albumId: string): Promise<any[]> => {
    try {
        const db = await getDb();
        
        const result = await db.getAllAsync(`
            SELECT * FROM asset 
            WHERE album_id = ? 
            ORDER BY order_index ASC
        `, [albumId]);
        
        return result.map((row: any) => ({
            id: row.asset_id,
            filename: row.name,
            uri: row.uri,
            localUri: row.local_uri,
            mediaType: row.media_type,
            mediaSubtypes: JSON.parse(row.media_subtypes || '[]'),
            width: row.width,
            height: row.height,
            duration: row.duration,
            creationTime: row.creation_time,
            modificationTime: row.modification_time,
            orientation: row.orientation,
            isFavorite: Boolean(row.is_favorite),
            isHidden: Boolean(row.is_hidden),
            exif: JSON.parse(row.exif_data || '{}'),
            location: row.location_latitude ? {
                latitude: row.location_latitude,
                longitude: row.location_longitude,
                altitude: row.location_altitude,
                heading: row.location_heading,
                speed: row.location_speed,
                timestamp: row.location_timestamp
            } : null
        }));
    } catch (error) {
        console.error('Error getting media assets by album ID:', error);
        return [];
    }
};

/**
 * Get all asset IDs that exist in the database
 * @returns Array of existing asset IDs
 */
export const getExistingAssetIds = async (): Promise<Set<string>> => {
    try {
        const db = await getDb();
        
        const result = await db.getAllAsync(`
            SELECT asset_id FROM asset
        `);
        
        const existingIds = new Set<string>();
        result.forEach((row: any) => {
            existingIds.add(row.asset_id);
        });
        
        return existingIds;
    } catch (error) {
        console.error('Error getting existing asset IDs:', error);
        return new Set();
    }
};

/**
 * Get existing asset IDs for a specific album
 * @param albumId - The album ID to check
 * @returns Array of existing asset IDs in the album
 */
export const getExistingAssetIdsByAlbum = async (albumId: string): Promise<Set<string>> => {
    try {
        const db = await getDb();
        
        const result = await db.getAllAsync(`
            SELECT asset_id FROM asset WHERE album_id = ?
        `, [albumId]);
        
        const existingIds = new Set<string>();
        result.forEach((row: any) => {
            existingIds.add(row.asset_id);
        });
        
        return existingIds;
    } catch (error) {
        console.error('Error getting existing asset IDs for album:', error);
        return new Set();
    }
};

/**
 * Update asset
 * @param assetId - The asset ID to update
 * @param asset - The asset to update
 * @returns The updated asset ID
 */
export const updateAsset = async (assetId: string, asset: Asset): Promise<string> => {
    try {
        const db = await getDb();

        // Field mapping for efficient updates
        const fieldMappings = [
            { key: 'caption', dbField: 'caption' },
            { key: 'name', dbField: 'name' },
            { key: 'filename', dbField: 'name' }, // filename maps to name in DB
            { key: 'uri', dbField: 'uri' },
            { key: 'localUri', dbField: 'local_uri' },
            { key: 'mediaType', dbField: 'media_type' },
            { key: 'width', dbField: 'width' },
            { key: 'height', dbField: 'height' },
            { key: 'duration', dbField: 'duration' },
            { key: 'creationTime', dbField: 'creation_time' },
            { key: 'modificationTime', dbField: 'modification_time' },
            { key: 'orientation', dbField: 'orientation' },
            { key: 'album_id', dbField: 'album_id' },
        ];

        // Special field mappings that need transformation
        const specialMappings = [
            { 
                key: 'mediaSubtypes', 
                dbField: 'media_subtypes',
                transform: (value: any) => JSON.stringify(value)
            },
            { 
                key: 'isFavorite', 
                dbField: 'is_favorite',
                transform: (value: any) => value ? 1 : 0
            },
            { 
                key: 'isHidden', 
                dbField: 'is_hidden',
                transform: (value: any) => value ? 1 : 0
            },
            { 
                key: 'exif', 
                dbField: 'exif_data',
                transform: (value: any) => JSON.stringify(value)
            }
        ];

        // Build dynamic update query
        const fields: string[] = [];
        const values: any[] = [];

        // Process regular field mappings
        fieldMappings.forEach(({ key, dbField }) => {
            if (asset[key as keyof Asset] !== undefined) {
                fields.push(`${dbField} = ?`);
                values.push(asset[key as keyof Asset]);
            }
        });

        // Process special field mappings
        specialMappings.forEach(({ key, dbField, transform }) => {
            if (asset[key as keyof Asset] !== undefined) {
                fields.push(`${dbField} = ?`);
                values.push(transform(asset[key as keyof Asset]));
            }
        });

        // Handle location fields (nested object)
        if (asset.location) {
            const locationFields = [
                { key: 'latitude', dbField: 'location_latitude' },
                { key: 'longitude', dbField: 'location_longitude' },
                { key: 'altitude', dbField: 'location_altitude' },
                { key: 'heading', dbField: 'location_heading' },
                { key: 'speed', dbField: 'location_speed' },
                { key: 'timestamp', dbField: 'location_timestamp' },
            ];

            locationFields.forEach(({ key, dbField }) => {
                if (asset.location![key as keyof typeof asset.location] !== undefined) {
                    fields.push(`${dbField} = ?`);
                    values.push(asset.location![key as keyof typeof asset.location]);
                }
            });
        }

        // Always update updated_at
        fields.push('updated_at = ?');
        values.push(new Date().toISOString());

        // Add assetId for WHERE clause
        values.push(assetId);

        // Early return if no fields to update
        if (fields.length === 0) {
            return assetId;
        }

        // Compose and execute the query
        const query = `UPDATE asset SET ${fields.join(', ')} WHERE asset_id = ?`;
        const result = await db.runAsync(query, values);
        
        if (result.changes === 0) {
            throw new Error('Asset not found or no changes made');
        }

        return assetId;
    } catch (error) {
        console.error('Error updating asset:', error);
        throw error;
    }
};

/**
 * Delete an asset
 * @param assetId - The asset ID to delete
 * @returns The deleted asset ID
 */
export const deleteAsset = async (assetId: string): Promise<string> => {
    try {
        const db = await getDb();

        // Start transaction for better performance
        await db.execAsync('BEGIN TRANSACTION');

        // Get the album ID and URI of the asset before deleting it
        const assetResult = await db.getAllAsync(
            'SELECT album_id, uri FROM asset WHERE asset_id = ?',
            [assetId]
        );

        if (assetResult.length === 0) {
            throw new Error('Asset not found');
        }

        const assetData = assetResult[0] as any;
        const albumId = assetData.album_id;
        const assetUri = assetData.uri;

        // Delete the asset
        await db.runAsync('DELETE FROM asset WHERE asset_id = ?', [assetId]);

        // Check if this asset was a cover image and reset it if necessary
        const coverCheckResult = await db.getAllAsync(
            'SELECT album_id FROM album WHERE album_id = ? AND cover_uri = ?',
            [albumId, assetUri]
        );

        if (coverCheckResult.length > 0) {
            // This asset was a cover image, reset it and try to set a new one
            await db.runAsync(
                'UPDATE album SET cover_uri = NULL, updated_at = ? WHERE album_id = ?',
                [new Date().toISOString(), albumId]
            );
            
            // Try to set a new cover image from remaining assets
            await setNewCoverImage(albumId, false); // Don't use transaction since we're already in one
        }

        // Commit transaction
        await db.execAsync('COMMIT');

        return assetId;
    } catch (error) {
        // Rollback transaction on error
        try {
            const db = await getDb();
            await db.execAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        console.error('Error deleting asset:', error);
        throw error;
    }
};

/**
 * Delete multiple assets
 * @param assetIds - The asset IDs to delete
 * @returns The deleted asset IDs
 */
export const deleteSelectedAssets = async (assetIds: string[]): Promise<string[]> => {
    try {
        const db = await getDb();

        // Start transaction for better performance
        await db.execAsync('BEGIN TRANSACTION');

        // Get the album IDs and URIs of the assets before deleting them
        const placeholders = assetIds.map(() => '?').join(',');
        const assetsResult = await db.getAllAsync(
            `SELECT album_id, uri FROM asset WHERE asset_id IN (${placeholders})`,
            assetIds
        );

        // Group assets by album ID for efficient cover image checking
        const albumAssets = new Map<string, Set<string>>();
        assetsResult.forEach((row: any) => {
            const albumId = row.album_id;
            const uri = row.uri;
            if (!albumAssets.has(albumId)) {
                albumAssets.set(albumId, new Set());
            }
            albumAssets.get(albumId)!.add(uri);
        });

        // Delete assets
        await db.runAsync(`DELETE FROM asset WHERE asset_id IN (${placeholders})`, assetIds);

        // Check and reset cover images for affected albums
        const affectedAlbumIds = Array.from(albumAssets.keys());
        if (affectedAlbumIds.length > 0) {
            await resetInvalidCoverImages(affectedAlbumIds, true, false); // Don't use transaction since we're already in one
        }

        // Commit transaction
        await db.execAsync('COMMIT');

        return assetIds;
    } catch (error) {
        // Rollback transaction on error
        try {
            const db = await getDb();
            await db.execAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        console.error('Error deleting selected assets:', error);
        throw error;
    }
}

/**
 * Move assets from one album to another
 * @param assetIds - Array of asset IDs to move
 * @param targetAlbumId - The target album ID
 * @returns Array of moved asset IDs
 */
export const moveAssetsToAlbum = async (assetIds: string[], targetAlbumId: string): Promise<{ movedAssetIds: string[], affectedAlbumIds: string[] }> => {
    try {
        const db = await getDb();
        
        // Start transaction for better performance
        await db.execAsync('BEGIN TRANSACTION');
        
        // Get the source album IDs for the assets being moved
        const sourceAlbumsResult = await db.getAllAsync(
            `SELECT DISTINCT album_id FROM asset WHERE asset_id IN (${assetIds.map(() => '?').join(',')})`,
            assetIds
        );
        
        const sourceAlbumIds = sourceAlbumsResult
            .map((row: any) => row.album_id)
            .filter((albumId: string) => albumId !== targetAlbumId && albumId !== null); // Exclude target album and null values
        
        // Get the next available order index for the target album
        const baseOrderIndex = await getNextAssetOrderIndex(targetAlbumId);
        
        // Update each asset individually with sequential order indices
        for (let i = 0; i < assetIds.length; i++) {
            const assetId = assetIds[i];
            const orderIndex = baseOrderIndex + (i * 1000);
            
            await db.runAsync(
                'UPDATE asset SET album_id = ?, order_index = ?, updated_at = ? WHERE asset_id = ?',
                [targetAlbumId, orderIndex, new Date().toISOString(), assetId]
            );
        }
        
        // Commit transaction
        await db.execAsync('COMMIT');
        
        // Force a small delay to ensure the transaction is fully committed
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Check and reset cover images for affected albums
        const affectedAlbumIds = [...new Set([...sourceAlbumIds, targetAlbumId])];
        if (affectedAlbumIds.length > 0) {
            await resetInvalidCoverImages(affectedAlbumIds, true, false); // Don't use transaction since we're already in one
        }
        
        return {
            movedAssetIds: assetIds,
            affectedAlbumIds
        };
    } catch (error) {
        // Rollback transaction on error
        try {
            const db = await getDb();
            await db.execAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        console.error('Error moving assets to album:', error);
        throw error;
    }
};

// ============================================================================
// ORDER INDEX MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get the next available order index for an album
 * @param albumId - The album ID to get the next order index for
 * @returns The next available order index
 */
export const getNextAssetOrderIndex = async (albumId: string): Promise<number> => {
    try {
        const db = await getDb();
        
        const result = await db.getAllAsync(`
            SELECT MAX(order_index) as max_order FROM asset WHERE album_id = ?
        `, [albumId]);
        
        const maxOrder = (result[0] as any)?.max_order || 0;
        const nextOrder = maxOrder + 1000;
        
        return nextOrder;
    } catch (error) {
        console.error('Error getting next asset order index:', error);
        return 1000;
    }
};

/**
 * Get the next available order index for albums
 * @param parentAlbumId - The parent album ID (null for top-level albums)
 * @returns The next available order index
 */
export const getNextAlbumOrderIndex = async (parentAlbumId: string | null): Promise<number> => {
    try {
        const db = await getDb();
        
        const result = await db.getAllAsync(`
            SELECT MAX(order_index) as max_order FROM album WHERE parent_album_id ${parentAlbumId === null ? 'IS NULL' : '= ?'}
        `, parentAlbumId === null ? [] : [parentAlbumId]);
        
        const maxOrder = (result[0] as any)?.max_order || 0;
        return maxOrder + 1000;
    } catch (error) {
        console.error('Error getting next album order index:', error);
        return 1000;
    }
};

/**
 * Insert an asset between two existing assets
 * @param albumId - The album ID
 * @param assetId - The asset ID to insert
 * @param beforeOrderIndex - The order index of the asset to insert before
 * @param afterOrderIndex - The order index of the asset to insert after
 * @returns The new order index assigned to the asset
 */
export const insertAssetBetween = async (
    albumId: string, 
    assetId: string, 
    beforeOrderIndex: number, 
    afterOrderIndex: number
): Promise<number> => {
    try {
        const db = await getDb();
        
        // Calculate the new order index between the two existing ones
        const newOrderIndex = beforeOrderIndex + (afterOrderIndex - beforeOrderIndex) / 2;
        
        // Update the asset's order index
        await db.runAsync(
            'UPDATE asset SET order_index = ?, updated_at = ? WHERE asset_id = ? AND album_id = ?',
            [newOrderIndex, new Date().toISOString(), assetId, albumId]
        );
        
        return newOrderIndex;
    } catch (error) {
        console.error('Error inserting asset between:', error);
        throw error;
    }
};

/**
 * Insert an album between two existing albums
 * @param albumId - The album ID to insert
 * @param beforeOrderIndex - The order index of the album to insert before
 * @param afterOrderIndex - The order index of the album to insert after
 * @returns The new order index assigned to the album
 */
export const insertAlbumBetween = async (
    albumId: string, 
    beforeOrderIndex: number, 
    afterOrderIndex: number
): Promise<number> => {
    try {
        const db = await getDb();
        
        // Calculate the new order index between the two existing ones
        const newOrderIndex = beforeOrderIndex + (afterOrderIndex - beforeOrderIndex) / 2;
        
        // Update the album's order index
        await db.runAsync(
            'UPDATE album SET order_index = ?, updated_at = ? WHERE album_id = ?',
            [newOrderIndex, new Date().toISOString(), albumId]
        );
        
        return newOrderIndex;
    } catch (error) {
        console.error('Error inserting album between:', error);
        throw error;
    }
};

/**
 * Swap the order indices of two assets
 * @param assetId1 - The first asset ID
 * @param assetId2 - The second asset ID
 */
export const swapAssetOrder = async (assetId1: string, assetId2: string): Promise<void> => {
    try {
        const db = await getDb();
        
        // Start transaction
        await db.execAsync('BEGIN TRANSACTION');
        
        // Get current order indices
        const result1 = await db.getAllAsync(
            'SELECT order_index FROM asset WHERE asset_id = ?',
            [assetId1]
        );
        const result2 = await db.getAllAsync(
            'SELECT order_index FROM asset WHERE asset_id = ?',
            [assetId2]
        );
        
        if (result1.length === 0 || result2.length === 0) {
            throw new Error('One or both assets not found');
        }
        
        const orderIndex1 = (result1[0] as any).order_index;
        const orderIndex2 = (result2[0] as any).order_index;
        
        // Swap the order indices
        await db.runAsync(
            'UPDATE asset SET order_index = ?, updated_at = ? WHERE asset_id = ?',
            [orderIndex2, new Date().toISOString(), assetId1]
        );
        await db.runAsync(
            'UPDATE asset SET order_index = ?, updated_at = ? WHERE asset_id = ?',
            [orderIndex1, new Date().toISOString(), assetId2]
        );
        
        // Commit transaction
        await db.execAsync('COMMIT');
        
    } catch (error) {
        // Rollback transaction on error
        try {
            const db = await getDb();
            await db.execAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        console.error('❌ Error swapping asset order:', error);
        throw error;
    }
};

/**
 * Swap the order indices of two albums
 * @param albumId1 - The first album ID
 * @param albumId2 - The second album ID
 */
export const swapAlbumOrder = async (albumId1: string, albumId2: string): Promise<void> => {
    try {
        const db = await getDb();
        
        // Start transaction
        await db.execAsync('BEGIN TRANSACTION');
        
        // Get current order indices
        const result1 = await db.getAllAsync(
            'SELECT order_index FROM album WHERE album_id = ?',
            [albumId1]
        );
        const result2 = await db.getAllAsync(
            'SELECT order_index FROM album WHERE album_id = ?',
            [albumId2]
        );
        
        if (result1.length === 0 || result2.length === 0) {
            throw new Error('One or both albums not found');
        }
        
        const orderIndex1 = (result1[0] as any).order_index;
        const orderIndex2 = (result2[0] as any).order_index;
        
        // Swap the order indices
        await db.runAsync(
            'UPDATE album SET order_index = ?, updated_at = ? WHERE album_id = ?',
            [orderIndex2, new Date().toISOString(), albumId1]
        );
        await db.runAsync(
            'UPDATE album SET order_index = ?, updated_at = ? WHERE album_id = ?',
            [orderIndex1, new Date().toISOString(), albumId2]
        );
        
        // Commit transaction
        await db.execAsync('COMMIT');
        
    } catch (error) {
        // Rollback transaction on error
        try {
            const db = await getDb();
            await db.execAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        console.error('Error swapping album order:', error);
        throw error;
    }
};

/**
 * Normalize all asset order indices in an album
 * @param albumId - The album ID to normalize
 */
export const normalizeAssetOrder = async (albumId: string): Promise<void> => {
    try {
        const db = await getDb();
        
        // Start transaction
        await db.execAsync('BEGIN TRANSACTION');
        
        // Get all assets in order
        const assets = await db.getAllAsync(`
            SELECT asset_id FROM asset 
            WHERE album_id = ? 
            ORDER BY order_index ASC
        `, [albumId]);
        
        // Update each asset with a normalized order index
        for (let i = 0; i < assets.length; i++) {
            const assetId = (assets[i] as any).asset_id;
            const newOrderIndex = 1000 + (i * 1000);
            
            await db.runAsync(
                'UPDATE asset SET order_index = ?, updated_at = ? WHERE asset_id = ?',
                [newOrderIndex, new Date().toISOString(), assetId]
            );
        }
        
        // Commit transaction
        await db.execAsync('COMMIT');
    } catch (error) {
        // Rollback transaction on error
        try {
            const db = await getDb();
            await db.execAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        console.error('Error normalizing asset order:', error);
        throw error;
    }
};

/**
 * Normalize all album order indices
 * @param parentAlbumId - The parent album ID (null for top-level albums)
 */
export const normalizeAlbumOrder = async (parentAlbumId: string | null): Promise<void> => {
    try {
        const db = await getDb();
        
        // Start transaction
        await db.execAsync('BEGIN TRANSACTION');
        
        // Get all albums in order
        const albums = await db.getAllAsync(`
            SELECT album_id FROM album 
            WHERE parent_album_id ${parentAlbumId === null ? 'IS NULL' : '= ?'}
            ORDER BY order_index ASC
        `, parentAlbumId === null ? [] : [parentAlbumId]);
        
        // Update each album with a normalized order index
        for (let i = 0; i < albums.length; i++) {
            const albumId = (albums[i] as any).album_id;
            const newOrderIndex = 1000 + (i * 1000);
            
            await db.runAsync(
                'UPDATE album SET order_index = ?, updated_at = ? WHERE album_id = ?',
                [newOrderIndex, new Date().toISOString(), albumId]
            );
        }
        
        // Commit transaction
        await db.execAsync('COMMIT');
    } catch (error) {
        // Rollback transaction on error
        try {
            const db = await getDb();
            await db.execAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        console.error('Error normalizing album order:', error);
        throw error;
    }
};

/**
 * Reorder assets by inserting between existing items
 * @param albumId - The album ID
 * @param assetId - The asset ID to move
 * @param targetIndex - The target index to move the asset to
 * @param currentAssets - Array of current assets in order
 */
export const reorderAssetByIndex = async (
    albumId: string, 
    assetId: string, 
    targetIndex: number, 
    currentAssets: any[]
): Promise<void> => {
    try {
        const db = await getDb();
        
        // Find the asset to move
        const assetToMove = currentAssets.find(asset => asset.id === assetId);
        if (!assetToMove) {
            throw new Error('Asset not found in current assets');
        }
        
        // Remove the asset from the current array
        const assetsWithoutMoved = currentAssets.filter(asset => asset.id !== assetId);
        
        // Insert the asset at the target index
        const newAssets = [
            ...assetsWithoutMoved.slice(0, targetIndex),
            assetToMove,
            ...assetsWithoutMoved.slice(targetIndex)
        ];
        
        // Start transaction
        await db.execAsync('BEGIN TRANSACTION');
        
        // Update order indices for all affected assets
        for (let i = 0; i < newAssets.length; i++) {
            const newOrderIndex = 1000 + (i * 1000);
            await db.runAsync(
                'UPDATE asset SET order_index = ?, updated_at = ? WHERE asset_id = ? AND album_id = ?',
                [newOrderIndex, new Date().toISOString(), newAssets[i].id, albumId]
            );
        }
        
        // Commit transaction
        await db.execAsync('COMMIT');
    } catch (error) {
        // Rollback transaction on error
        try {
            const db = await getDb();
            await db.execAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        console.error('Error reordering asset by index:', error);
        throw error;
    }
};

/**
 * Reorder albums by inserting between existing items
 * @param albumId - The album ID to move
 * @param targetIndex - The target index to move the album to
 * @param currentAlbums - Array of current albums in order
 * @param parentAlbumId - The parent album ID (null for top-level albums)
 */
export const reorderAlbumByIndex = async (
    albumId: string, 
    targetIndex: number, 
    currentAlbums: any[],
    parentAlbumId: string | null
): Promise<void> => {
    try {
        const db = await getDb();
        
        // Find the album to move
        const albumToMove = currentAlbums.find(album => album.album_id === albumId);
        if (!albumToMove) {
            throw new Error('Album not found in current albums');
        }
        
        // Remove the album from the current array
        const albumsWithoutMoved = currentAlbums.filter(album => album.album_id !== albumId);
        
        // Insert the album at the target index
        const newAlbums = [
            ...albumsWithoutMoved.slice(0, targetIndex),
            albumToMove,
            ...albumsWithoutMoved.slice(targetIndex)
        ];
        
        // Start transaction
        await db.execAsync('BEGIN TRANSACTION');
        
        // Update order indices for all affected albums
        for (let i = 0; i < newAlbums.length; i++) {
            const newOrderIndex = 1000 + (i * 1000);
            await db.runAsync(
                'UPDATE album SET order_index = ?, updated_at = ? WHERE album_id = ?',
                [newOrderIndex, new Date().toISOString(), newAlbums[i].album_id]
            );
        }
        
        // Commit transaction
        await db.execAsync('COMMIT');
    } catch (error) {
        // Rollback transaction on error
        try {
            const db = await getDb();
            await db.execAsync('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
        
        console.error('Error reordering album by index:', error);
        throw error;
    }
};

/**
 * Get the current order index of an asset
 * @param assetId - The asset ID
 * @returns The current order index or null if not found
 */
export const getAssetOrderIndex = async (assetId: string): Promise<number | null> => {
    try {
        const db = await getDb();
        
        const result = await db.getAllAsync(
            'SELECT order_index FROM asset WHERE asset_id = ?',
            [assetId]
        );
        
        if (result.length === 0) {
            return null;
        }
        
        return (result[0] as any).order_index;
    } catch (error) {
        console.error('Error getting asset order index:', error);
        return null;
    }
};

/**
 * Get the current order index of an album
 * @param albumId - The album ID
 * @returns The current order index or null if not found
 */
export const getAlbumOrderIndex = async (albumId: string): Promise<number | null> => {
    try {
        const db = await getDb();
        
        const result = await db.getAllAsync(
            'SELECT order_index FROM album WHERE album_id = ?',
            [albumId]
        );
        
        if (result.length === 0) {
            return null;
        }
        
        return (result[0] as any).order_index;
    } catch (error) {
        console.error('Error getting album order index:', error);
        return null;
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all settings
 */
export const getSettings = async (): Promise<Settings> => {
    try {
        const db = await getDb();

        const result = await db.getAllAsync(`
            SELECT * FROM setting
        `);

        if (result && Array.isArray(result) && result.length > 0) {
            return result[0] as Settings;
        }

        return {
            lang: 'en',
            caption_open: 0,
        };
        
    } catch (error) {
        console.error('Error getting settings:', error);
        throw error;
    }
};

/**
 * Update settings
 * @param settings - Partial settings object, only provided fields will be updated
 */
export const updateSettings = async (settings: Partial<Settings>): Promise<void> => {
    try {
        const db = await getDb();

        // Check if settings exist
        const existingSettings = await db.getAllAsync('SELECT COUNT(*) as count FROM setting');
        const hasSettings = (existingSettings[0] as any)?.count > 0;

        if (hasSettings) {
            // Build dynamic update query based on provided fields
            const fields: string[] = [];
            const values: any[] = [];

            if (settings.lang !== undefined) {
                fields.push('lang = ?');
                values.push(settings.lang);
            }

            if (settings.caption_open !== undefined) {
                fields.push('caption_open = ?');
                values.push(settings.caption_open);
            }

            if (fields.length > 0) {
                const query = `UPDATE setting SET ${fields.join(', ')}`;
                const stmt = await db.prepareAsync(query);
                await stmt.executeAsync(values);
                await stmt.finalizeAsync();
            }
        } else {
            // Insert new settings with provided values and defaults
            const stmt = await db.prepareAsync(
                'INSERT INTO setting (lang, caption_open) VALUES (?, ?)'
            );
            await stmt.executeAsync([
                settings.lang || 'en',
                settings.caption_open || false,
            ]);
            await stmt.finalizeAsync();
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
    }
};
