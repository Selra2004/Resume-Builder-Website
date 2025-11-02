import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger.js';

export class UploadService {
  private static uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
  
  static async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  static async processAndSaveProfilePhoto(
    buffer: Buffer, 
    userId: number, 
    userType: 'user' | 'coordinator' | 'company' | 'admin' = 'user'
  ): Promise<string> {
    try {
      await this.ensureUploadDir();

      const filename = `${userType}_${userId}_${Date.now()}.webp`;
      const filepath = path.join(this.uploadDir, filename);

      // Process image: resize and convert to WebP
      await sharp(buffer)
        .resize(400, 400, { 
          fit: 'cover',
          position: 'center'
        })
        .webp({ 
          quality: 85,
          effort: 4
        })
        .toFile(filepath);

      logger.info(`Profile photo processed and saved: ${filename}`);
      
      // Return relative path for database storage
      return `uploads/profiles/${filename}`;
    } catch (error) {
      logger.error('Error processing profile photo:', error);
      throw new Error('Failed to process profile photo');
    }
  }

  static async deleteProfilePhoto(photoPath: string): Promise<void> {
    if (!photoPath) return;
    
    try {
      const fullPath = path.join(process.cwd(), photoPath);
      await fs.unlink(fullPath);
      logger.info(`Deleted profile photo: ${photoPath}`);
    } catch (error) {
      logger.warn(`Failed to delete profile photo: ${photoPath}`, error);
    }
  }

  static getPhotoUrl(photoPath: string | null): string | null {
    if (!photoPath) return null;
    
    // If photoPath is already a full URL, return it as-is
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return `${baseUrl}/api/uploads/${photoPath.replace('uploads/', '')}`;
  }
}
