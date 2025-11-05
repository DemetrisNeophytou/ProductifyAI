import { describe, it, expect } from 'vitest';

const API_BASE = process.env.VITE_API_URL || 'http://localhost:5000';

describe('API Health Checks', () => {
  it('GET /api/health should return ok:true', async () => {
    const response = await fetch(`${API_BASE}/api/health`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(true);
  });

  it('GET /api/v2/ai/health should return ok:true with model info', async () => {
    const response = await fetch(`${API_BASE}/api/v2/ai/health`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(true);
    
    // Should have model information
    expect(data).toHaveProperty('model');
    expect(typeof data.model).toBe('string');
  });
});

