import { Router } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  const userId = req.query.userId || (req as any).user?.id;
  
  if (!userId) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId as string)).limit(1);
  
  if (!user) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  res.json({
    ok: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      plan: user.plan || 'free',
      role: user.role || 'user',
      trialEndsAt: user.trialEndDate,
      subscriptionStatus: user.subscriptionStatus,
      usage: {
        tokensThisMonth: user.aiTokensUsed || 0,
        aiRequestsThisMonth: 0, // Mock
      },
    },
  });
});

export default router;



