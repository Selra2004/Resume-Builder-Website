import express from 'express';
import multer from 'multer';
import { authenticateForProfileCompletion, AuthRequest } from '../middleware/auth.js';
import { UploadService } from '../services/uploadService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Upload profile photo
router.post('/profile-photo', authenticateForProfileCompletion, upload.single('profilePhoto'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo file provided' });
    }

    const userId = req.user!.id;
    const userType = req.user!.role === 'admin' ? 'admin' : 
                    req.user!.role === 'coordinator' ? 'coordinator' : 
                    req.user!.role === 'company' ? 'company' : 'user';

    // Process and save the profile photo
    const photoPath = await UploadService.processAndSaveProfilePhoto(
      req.file.buffer,
      userId,
      userType as 'user' | 'coordinator' | 'company' | 'admin'
    );

    // Return the full URL for the photo using UploadService for consistency
    const photoUrl = UploadService.getPhotoUrl(photoPath);

    res.json({
      message: 'Profile photo uploaded successfully',
      photoUrl: photoUrl,
      path: photoPath
    });

  } catch (error: any) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to upload profile photo' 
    });
  }
}));

export default router;
