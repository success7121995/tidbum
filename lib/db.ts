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
                media_type TEXT CHECK(media_type IN ('photo', 'video')) NOT NULL,
                width INTEGER,
                height INTEGER,
                duration INTEGER,
                size INTEGER,
                order_index FLOAT DEFAULT 1000,
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

        console.log('Creating album with ID:', albumId);
        console.log('Album data:', album);

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
        
        console.log('Insert parameters:', insertParams);
        
        const result = await stmt.executeAsync(insertParams);

        console.log('Insert result:', result);
        
        await stmt.finalizeAsync();

        // Check if the album was actually inserted
        const checkResult = await db.getAllAsync('SELECT COUNT(*) as count FROM album WHERE album_id = ?', [albumId]);
        
        console.log('Album count check:', checkResult);

        // Get the created album to verify it was inserted
        const createdAlbum = await getAlbumById(albumId);
        console.log('Created album:', createdAlbum);

        return albumId;
    } catch (error) {
        console.error('Error creating album:', error);
        throw error;
    }
};

/**
 * Get album by ID
 */
export const getAlbumById = async (albumId: string): Promise<Album | null> => {
    try {
        const db = await getDb();
        console.log('Looking for album with ID:', albumId);
        
        const result = await db.getAllAsync('SELECT * FROM album WHERE album_id = ?', [albumId]);
        
        if (result && Array.isArray(result) && result.length > 0) {
            const albumRow = result[0] as Album;

            const album: Album = {
                album_id: albumRow.album_id,
                name: albumRow.name,
                description: albumRow.description || '',
                cover_asset_id: albumRow.cover_asset_id || undefined,
                parent_album_id: albumRow.parent_album_id || undefined
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

        console.log('Final albums array:', albums);
        
        console.log('Final albums array with asset counts:', albums);
        
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

// ============================================================================
// ASSET OPERATIONS
// ============================================================================



// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

