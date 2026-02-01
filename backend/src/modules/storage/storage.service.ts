import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
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
      throw new ServiceUnavailableException(
        'Storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.',
      );
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

  async uploadVideo(key: string, videoBuffer: Buffer, format: 'webm' | 'mov' | 'mp4'): Promise<string> {
    const contentType =
      format === 'webm' ? 'video/webm' : format === 'mp4' ? 'video/mp4' : 'video/quicktime';
    return this.uploadFile(key, videoBuffer, contentType);
  }

  /**
   * Extract storage key from a Supabase public URL
   * Example: https://xxx.supabase.co/storage/v1/object/public/mascots/path/to/file.png
   * Returns: path/to/file.png
   */
  private extractKeyFromUrl(url: string): string | null {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      // Supabase storage URLs have format: /storage/v1/object/public/{bucket}/{key}
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf(this.bucket);
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      // Fallback: try to extract from path
      const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
      return match ? match[1] : null;
    } catch (error) {
      this.logger.warn(`Failed to extract key from URL: ${url}`, error);
      return null;
    }
  }

  /**
   * Delete a file from storage by URL
   */
  async deleteFileByUrl(url: string): Promise<void> {
    if (!this.useSupabase || !this.supabase) {
      this.logger.warn('Storage not configured, skipping file deletion');
      return;
    }

    const key = this.extractKeyFromUrl(url);
    if (!key) {
      this.logger.warn(`Could not extract key from URL: ${url}`);
      return;
    }

    try {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([key]);

      if (error) {
        this.logger.error(`Failed to delete file ${key}:`, error);
        // Don't throw - file might already be deleted
      } else {
        this.logger.log(`Successfully deleted file ${key} from storage`);
      }
    } catch (error) {
      this.logger.error(`Error deleting file ${key}:`, error);
      // Don't throw - continue with entity deletion even if file deletion fails
    }
  }

  /**
   * Delete multiple files from storage by URLs
   */
  async deleteFilesByUrls(urls: (string | null | undefined)[]): Promise<void> {
    const validUrls = urls.filter((url): url is string => !!url);
    if (validUrls.length === 0) return;

    if (!this.useSupabase || !this.supabase) {
      this.logger.warn('Storage not configured, skipping file deletions');
      return;
    }

    const keys = validUrls
      .map(url => this.extractKeyFromUrl(url))
      .filter((key): key is string => !!key);

    if (keys.length === 0) {
      this.logger.warn('No valid keys extracted from URLs');
      return;
    }

    try {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove(keys);

      if (error) {
        this.logger.error(`Failed to delete files:`, error);
      } else {
        this.logger.log(`Successfully deleted ${keys.length} file(s) from storage`);
      }
    } catch (error) {
      this.logger.error(`Error deleting files:`, error);
    }
  }
}
