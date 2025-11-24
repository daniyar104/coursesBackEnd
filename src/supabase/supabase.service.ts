import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        // Use service role key for admin operations (bypasses RLS)
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.warn('Supabase credentials not found in environment variables. File upload will be disabled.');
            return;
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async uploadFile(file: Express.Multer.File, bucket: string = 'materials'): Promise<string> {
        console.log('SupabaseService.uploadFile called');
        if (!this.supabase) {
            console.error('Supabase client not initialized');
            throw new BadRequestException('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY.');
        }

        if (!file) {
            console.error('No file provided to uploadFile');
            throw new BadRequestException('No file provided');
        }

        // Define allowed file types
        const allowedPdfTypes = ['application/pdf'];
        const allowedVideoTypes = [
            'video/mp4',
            'video/quicktime',      // .mov
            'video/x-msvideo',      // .avi
            'video/webm',
            'video/x-matroska',     // .mkv
        ];

        const isPdf = allowedPdfTypes.includes(file.mimetype);
        const isVideo = allowedVideoTypes.includes(file.mimetype);

        if (!isPdf && !isVideo) {
            console.error('Invalid file type:', file.mimetype);
            throw new BadRequestException('Only PDF and video files (mp4, mov, avi, webm, mkv) are allowed');
        }

        // File size validation
        const maxPdfSize = 50 * 1024 * 1024; // 50MB
        const maxVideoSize = 500 * 1024 * 1024; // 500MB

        if (isPdf && file.size > maxPdfSize) {
            throw new BadRequestException('PDF file size must not exceed 50MB');
        }

        if (isVideo && file.size > maxVideoSize) {
            throw new BadRequestException('Video file size must not exceed 500MB');
        }

        console.log('File validation passed, preparing upload...', {
            type: isPdf ? 'PDF' : 'Video',
            size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        });

        // Create a unique file path
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log('Uploading to Supabase:', { bucket, filePath, size: file.size });

        try {
            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false,
                });

            if (error) {
                console.error('Supabase upload error:', error);
                throw new BadRequestException(`File upload failed: ${error.message}`);
            }

            console.log('Upload successful, getting public URL...');

            // Get public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            console.log('Public URL generated:', publicUrl);

            return publicUrl;
        } catch (error) {
            console.error('Upload exception:', error);
            throw error;
        }
    }

    /**
     * Get a signed URL for accessing a file in Supabase storage
     * @param filePath - The path to the file in the bucket
     * @param bucket - The bucket name (default: 'materials')
     * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
     * @returns Signed URL string
     */
    async getSignedUrl(filePath: string, bucket: string = 'materials', expiresIn: number = 3600): Promise<string> {
        if (!this.supabase) {
            throw new BadRequestException('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY.');
        }

        if (!filePath) {
            throw new BadRequestException('File path is required');
        }

        try {
            const { data, error } = await this.supabase.storage
                .from(bucket)
                .createSignedUrl(filePath, expiresIn);

            if (error) {
                console.error('Supabase signed URL error:', error);
                throw new BadRequestException(`Failed to generate signed URL: ${error.message}`);
            }

            return data.signedUrl;
        } catch (error) {
            console.error('Signed URL exception:', error);
            throw error;
        }
    }
}
