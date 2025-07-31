
export interface Album {
    album_id?: string;
    name: string;
    description?: string;
    cover_asset_id?: string;
    parent_album_id?: string;
    totalAssets?: number;
    assets?: Asset[];
    subAlbums?: Album[];
}