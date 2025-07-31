import { Asset } from '@/types/asset';
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
        
        // Create album table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS album (
                album_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                cover_asset_id TEXT,
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

        console.log('Database initialized successfully');
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
};

/**
 * Get the database instance
 * Initializes the database if not already done
 */
export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        return await initDb();
    }
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

        const stmt = await db.prepareAsync(
            'INSERT INTO album (album_id, name, description, parent_album_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);'
        );
        
        const insertParams = [
            albumId, 
            album.name, 
            album.description || '', 
            album.parent_album_id || null, 
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
 */
export const getAlbumById = async (albumId: string): Promise<Album | null> => {
    try {
        const db = await getDb();
        
        // Get the album with cover asset
        const albumResult = await db.getAllAsync(`
            SELECT 
                a.*,
                cover.uri as cover_uri,
                cover.name as cover_name,
                cover.media_type as cover_media_type
            FROM album a
            LEFT JOIN asset cover ON a.cover_asset_id = cover.asset_id
            WHERE a.album_id = ?
        `, [albumId]);
        
        if (albumResult && Array.isArray(albumResult) && albumResult.length > 0) {
            const albumRow = albumResult[0] as Album;

            // Get all assets in this album
            const assetsResult = await db.getAllAsync(`
                SELECT 
                    a.*,
                    CASE 
                        WHEN a.media_type LIKE 'photo/%' THEN 'photo'
                        WHEN a.media_type LIKE 'video/%' THEN 'video'
                        ELSE 'other'
                    END as asset_type
                FROM asset a
                WHERE a.album_id = ?
                ORDER BY a.added_at DESC
            `, [albumId]);

            // Get all sub-albums
            const subAlbumsResult = await db.getAllAsync(`
                SELECT 
                    a.*,
                    cover.uri as cover_uri,
                    cover.name as cover_name,
                    cover.media_type as cover_media_type,
                    (SELECT COUNT(*) FROM asset WHERE album_id = a.album_id) as total_assets
                FROM album a
                LEFT JOIN asset cover ON a.cover_asset_id = cover.asset_id
                WHERE a.parent_album_id = ?
                ORDER BY a.name ASC
            `, [albumId]);


            const album: Album = {
                album_id: albumRow.album_id,
                name: albumRow.name,
                description: albumRow.description || '',
                cover_asset_id: albumRow.cover_asset_id || undefined,
                parent_album_id: albumRow.parent_album_id || undefined,
                assets: assetsResult as any[] || [],
                subAlbums: subAlbumsResult as any[] || []
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
 * Get all top-level albums
 */
export const getTopLevelAlbums = async (): Promise<(Album & { totalAssets: number })[]> => {
    try {
        const db = await getDb();
        
        // First, let's check if there are any albums at all
        const checkResult = await db.getAllAsync('SELECT COUNT(*) as count FROM album');
        
        // Get all top-level albums (where parent_album_id IS NULL)
        const result = await db.getAllAsync(`
            SELECT 
                a.album_id,
                a.name,
                a.description,
                a.cover_asset_id,
                a.parent_album_id,
                a.order_index,
                cover.uri as cover_uri,
                cover.name as cover_name,
                cover.media_type as cover_media_type
            FROM album a
            LEFT JOIN asset cover ON a.cover_asset_id = cover.asset_id
            WHERE a.parent_album_id IS NULL 
            ORDER BY a.order_index DESC
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
                    cover_asset_id: albumRow.cover_asset_id || undefined,
                    parent_album_id: albumRow.parent_album_id || undefined
                };
                
                // Add cover photo info if it exists
                if (albumRow.cover_uri) {
                    album.cover_asset_id = albumRow.cover_asset_id;
                }
                
                // Get total asset count for this album (including sub-albums)
                const totalAssets = await getAlbumTotalAssetCount(albumRow.album_id);
                
                albums.push({
                    ...album,
                    totalAssets
                });
            }
        } else {
            console.log('Result is not an array:', typeof result, result);
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
            'UPDATE album SET name = ?, description = ?, cover_asset_id = ?, updated_at = ? WHERE album_id = ?',
            [
                album.name,
                album.description || '',
                album.cover_asset_id || null,
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
// ASSET OPERATIONS
// ============================================================================

/**
 * Insert multiple media assets to the database at once
 * @param albumId - The album ID to associate with
 * @param mediaAssets - Array of media assets to insert
 * @param startOrderIndex - Starting order index for the assets (defaults to 1000.0)
 * @returns Array of inserted asset IDs
 */
export const insertAssets = async (albumId: string, mediaAssets: Asset[], startOrderIndex: number = 1000.0): Promise<string[]> => {
    try {
        const db = await getDb();
        
        // Start transaction for better performance
        await db.execAsync('BEGIN TRANSACTION');
        
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
            const orderIndex = startOrderIndex + (i * 1000.0); // Large increment for flexible sorting
            
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
                orderIndex, // order_index - dynamic value for sorting
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
            
            await stmt.executeAsync(insertParams);
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
            ORDER BY creation_time DESC
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


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

