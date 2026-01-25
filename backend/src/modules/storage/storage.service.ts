import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient | null = null;
  private bucket: string;
  private useSupabase: boolean;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.bucket = this.configService.get<string>('SUPABASE_BUCKET') || 'mascots';
    
    // Use Supabase if credentials are provided, otherwise fall back to AWS
    if (supabaseUrl && supabaseKey) {
      this.useSupabase = true;
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('StorageService initialized with Supabase Storage');
    } else {
      this.useSupabase = false;
      this.logger.warn('[StorageService] Supabase credentials not configured. Image uploads will fail.');
      this.logger.warn('[StorageService] Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway');
    }
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.useSupabase || !this.supabase) {
      throw new Error('Storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(key, buffer, {
          contentType,
          upsert: true, // Overwrite if exists
        });

      if (error) {
        this.logger.error(`Failed to upload file ${key}:`, error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(key);

      this.logger.log(`Successfully uploaded ${key} to Supabase Storage`);
      return urlData.publicUrl;
    } catch (error) {
      this.logger.error(`Error uploading file ${key}:`, error);
      throw error;
    }
  }

  async uploadImage(key: string, imageBuffer: Buffer): Promise<string> {
    return this.uploadFile(key, imageBuffer, 'image/png');
  }

  async uploadVideo(key: string, videoBuffer: Buffer, format: 'webm' | 'mov'): Promise<string> {
    const contentType = format === 'webm' ? 'video/webm' : 'video/quicktime';
    return this.uploadFile(key, videoBuffer, contentType);
  }
}
