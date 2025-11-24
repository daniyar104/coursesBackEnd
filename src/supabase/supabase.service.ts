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

        if (file.mimetype !== 'application/pdf') {
            console.error('File is not PDF:', file.mimetype);
            throw new BadRequestException('Only PDF files are allowed');
        }

        console.log('PDF validation passed, preparing upload...');

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
