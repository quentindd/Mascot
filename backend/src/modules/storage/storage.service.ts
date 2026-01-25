import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private cdnBaseUrl: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
    
    if (!accessKeyId || !secretAccessKey) {
      console.warn('[StorageService] AWS credentials not configured. Image uploads will fail.');
    }
    
    this.s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
    this.bucket = this.configService.get('AWS_S3_BUCKET');
    this.cdnBaseUrl = this.configService.get('CDN_BASE_URL');
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    // Return CDN URL
    return `${this.cdnBaseUrl}/${key}`;
  }

  async uploadImage(key: string, imageBuffer: Buffer): Promise<string> {
    return this.uploadFile(key, imageBuffer, 'image/png');
  }

  async uploadVideo(key: string, videoBuffer: Buffer, format: 'webm' | 'mov'): Promise<string> {
    const contentType = format === 'webm' ? 'video/webm' : 'video/quicktime';
    return this.uploadFile(key, videoBuffer, contentType);
  }
}
