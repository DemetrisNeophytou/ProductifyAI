import { storage } from './storage';

// Initialize Phase 5 feature flags
export async function seedPhase5Features() {
  try {
    // Check if AI Agents feature flag already exists
    const existingFlag = await storage.getFeatureFlag('FEATURE_AGENTS');
    
    if (!existingFlag) {
      // Create AI Agents feature flag (disabled by default in production)
      await storage.createFeatureFlag({
        name: 'FEATURE_AGENTS',
        description: 'Enable AI Agents (Builder, Design, Content)',
        enabled: process.env.NODE_ENV === 'development' ? 1 : 0, // Enabled in dev, disabled in prod
        metadata: {
          allowedTiers: ['pro', 'premium', 'trial'], // Available for these tiers
          defaultCredits: 100, // Default credits for new users
        },
      });
      console.log('[Seed] Created FEATURE_AGENTS flag');
    }

    // Check for Video Builder feature flag
    const videoFlag = await storage.getFeatureFlag('FEATURE_VIDEO_BUILDER');
    
    if (!videoFlag) {
      await storage.createFeatureFlag({
        name: 'FEATURE_VIDEO_BUILDER',
        description: 'Enable Video Builder (MakeClips-style)',
        enabled: process.env.NODE_ENV === 'development' ? 1 : 0,
        metadata: {
          allowedTiers: ['pro', 'premium'],
          costPerVideo: 50, // Credits per video
        },
      });
      console.log('[Seed] Created FEATURE_VIDEO_BUILDER flag');
    }

    console.log('[Seed] Phase 5 features initialized successfully');
  } catch (error) {
    console.error('[Seed] Error initializing Phase 5 features:', error);
  }
}

// Give initial credits to user (called during signup/onboarding)
export async function grantInitialCredits(userId: string) {
  try {
    const currentCredits = await storage.getUserCredits(userId);
    
    // Only grant if user has 0 credits (first time)
    if (currentCredits === 0) {
      await storage.refillCredits(userId, 100, 'Welcome bonus - Initial credits');
      console.log(`[Credits] Granted 100 initial credits to user ${userId}`);
    }
  } catch (error) {
    console.error('[Credits] Error granting initial credits:', error);
  }
}
