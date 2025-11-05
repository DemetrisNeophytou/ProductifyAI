import { Router } from 'express';

const router = Router();

router.get('/summary', async (req, res) => {
  // Mock data for development
  res.json({
    ok: true,
    data: {
      requests: 127,
      tokens: 12450,
      byFeature: [
        { name: 'AI Mentor', value: 45 },
        { name: 'Voice Mode', value: 23 },
        { name: 'Content Builder', value: 59 },
      ],
    },
    mock: true,
  });
});

export default router;

