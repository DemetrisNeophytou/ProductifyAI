import { Router } from 'express';
import { db } from '../db';
import { aiFeedback } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

router.post('/', async (req, res) => {
  const { userId, messageId, rating, comment } = req.body;

  if (!userId || !messageId || !rating) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }

  await db.insert(aiFeedback).values({
    userId,
    messageId,
    rating: rating === 'up' ? 5 : 1,
    helpful: rating === 'up' ? 1 : 0,
    notes: comment || null,
  });

  res.json({ ok: true });
});

router.get('/:messageId', async (req, res) => {
  const { messageId } = req.params;

  const feedback = await db
    .select()
    .from(aiFeedback)
    .where(eq(aiFeedback.messageId, messageId));

  const up = feedback.filter((f) => f.helpful === 1).length;
  const down = feedback.filter((f) => f.helpful === 0).length;

  res.json({ ok: true, data: { up, down } });
});

export default router;

