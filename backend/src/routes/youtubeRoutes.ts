import express from 'express';
import { streamYouTubeAudio } from '../controllers/youtubeController';

const router = express.Router();

// Public audio endpoint
router.get('/audio', streamYouTubeAudio);

export default router;
