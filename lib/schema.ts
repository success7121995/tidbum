import { z } from 'zod';

/**
 * Schema for creating a new album
 */
export const createAlbumSchema = z.object({
	name: z
		.string()
		.min(1, 'Album name is required')
		.max(50, 'Album name must be less than 50 characters')
		.trim(),
	description: z
		.string()
		.max(200, 'Description must be less than 200 characters')
		.trim()
		.default(''),
});

export type CreateAlbumFormData = z.infer<typeof createAlbumSchema>;

/**
 * Schema for album search/filter
 */
export const albumSearchSchema = z.object({
	query: z.string().trim().optional(),
	category: z.enum(['all', 'photos', 'videos', 'mixed']).default('all'),
	sortBy: z.enum(['date', 'name', 'size']).default('date'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AlbumSearchFormData = z.infer<typeof albumSearchSchema>;

export const albumSchema = z.object({
    name: z
        .string()
        .min(1, 'Album name is required')
        .trim(),
    description: z
        .string()
        .trim()
        .transform(val => val || '')
});

export type AlbumFormData = z.infer<typeof albumSchema>;