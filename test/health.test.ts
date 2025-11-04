/**
 * Health Endpoint Tests
 * 
 * Tests for /healthz, /readyz, and /api/health endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5050';

describe('Health Endpoints', () => {
  describe('GET /healthz (Liveness Probe)', () => {
    it('should return 200 status', async () => {
      const response = await fetch(`${API_URL}/healthz`);
      expect(response.status).toBe(200);
    });

    it('should return JSON with status ok', async () => {
      const response = await fetch(`${API_URL}/healthz`);
      const data = await response.json();
      
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('service');
    });

    it('should have valid timestamp format', async () => {
      const response = await fetch(`${API_URL}/healthz`);
      const data = await response.json();
      
      const timestamp = new Date(data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should have positive uptime', async () => {
      const response = await fetch(`${API_URL}/healthz`);
      const data = await response.json();
      
      expect(data.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /readyz (Readiness Probe)', () => {
    it('should return 200 or 503 status', async () => {
      const response = await fetch(`${API_URL}/readyz`);
      expect([200, 503]).toContain(response.status);
    });

    it('should return JSON with status and checks', async () => {
      const response = await fetch(`${API_URL}/readyz`);
      const data = await response.json();
      
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('checks');
      expect(data).toHaveProperty('responseTime');
    });

    it('should check database connectivity', async () => {
      const response = await fetch(`${API_URL}/readyz`);
      const data = await response.json();
      
      expect(data.checks).toHaveProperty('database');
      expect(data.checks.database).toHaveProperty('status');
    });

    it('should check environment configuration', async () => {
      const response = await fetch(`${API_URL}/readyz`);
      const data = await response.json();
      
      expect(data.checks).toHaveProperty('environment');
      expect(data.checks.environment).toHaveProperty('status');
    });

    it('should check memory usage', async () => {
      const response = await fetch(`${API_URL}/readyz`);
      const data = await response.json();
      
      expect(data.checks).toHaveProperty('memory');
      expect(data.checks.memory).toHaveProperty('heapUsed');
      expect(data.checks.memory).toHaveProperty('heapTotal');
    });

    it('should have reasonable response time', async () => {
      const response = await fetch(`${API_URL}/readyz`);
      const data = await response.json();
      
      expect(data.responseTime).toBeLessThan(5000); // Less than 5 seconds
    });
  });

  describe('GET /api/health (Comprehensive Health)', () => {
    it('should return 200 or 503 status', async () => {
      const response = await fetch(`${API_URL}/api/health`);
      expect([200, 503]).toContain(response.status);
    });

    it('should return comprehensive health information', async () => {
      const response = await fetch(`${API_URL}/api/health`);
      const data = await response.json();
      
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('services');
      expect(data).toHaveProperty('system');
    });

    it('should check all required services', async () => {
      const response = await fetch(`${API_URL}/api/health`);
      const data = await response.json();
      
      expect(data.services).toHaveProperty('database');
      expect(data.services).toHaveProperty('stripe');
      expect(data.services).toHaveProperty('openai');
      expect(data.services).toHaveProperty('email');
    });

    it('should include system metrics', async () => {
      const response = await fetch(`${API_URL}/api/health`);
      const data = await response.json();
      
      expect(data.system).toHaveProperty('memory');
      expect(data.system).toHaveProperty('cpu');
      expect(data.system).toHaveProperty('uptime');
    });

    it('should report memory usage in MB', async () => {
      const response = await fetch(`${API_URL}/api/health`);
      const data = await response.json();
      
      expect(data.system.memory.heapUsed).toBeGreaterThan(0);
      expect(data.system.memory.heapTotal).toBeGreaterThan(0);
    });
  });

  describe('GET /api/health/ping (Simple Ping)', () => {
    it('should return 200 status', async () => {
      const response = await fetch(`${API_URL}/api/health/ping`);
      expect(response.status).toBe(200);
    });

    it('should return pong message', async () => {
      const response = await fetch(`${API_URL}/api/health/ping`);
      const data = await response.json();
      
      expect(data).toHaveProperty('ok', true);
      expect(data).toHaveProperty('message', 'pong');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/health/version (Version Info)', () => {
    it('should return 200 status', async () => {
      const response = await fetch(`${API_URL}/api/health/version`);
      expect(response.status).toBe(200);
    });

    it('should return version information', async () => {
      const response = await fetch(`${API_URL}/api/health/version`);
      const data = await response.json();
      
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('node');
      expect(data).toHaveProperty('platform');
      expect(data).toHaveProperty('arch');
    });

    it('should have valid Node.js version', async () => {
      const response = await fetch(`${API_URL}/api/health/version`);
      const data = await response.json();
      
      expect(data.node).toMatch(/^v\d+\.\d+\.\d+$/);
    });
  });

  describe('Health Endpoint Performance', () => {
    it('/healthz should respond quickly (< 100ms)', async () => {
      const start = Date.now();
      await fetch(`${API_URL}/healthz`);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    it('/api/health/ping should respond quickly (< 50ms)', async () => {
      const start = Date.now();
      await fetch(`${API_URL}/api/health/ping`);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Health Endpoint Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const response = await fetch(`${API_URL}/api/health`);
      const data = await response.json();
      
      // Even if database is down, should return a response
      expect(data).toHaveProperty('services');
      expect(data.services).toHaveProperty('database');
      
      if (data.services.database.status === 'error') {
        expect(data.status).not.toBe('healthy');
        expect(data.services.database).toHaveProperty('error');
      }
    });

    it('readyz should return 503 if critical services are down', async () => {
      const response = await fetch(`${API_URL}/readyz`);
      const data = await response.json();
      
      if (data.status === 'not_ready') {
        expect(response.status).toBe(503);
        expect(data.checks).toBeDefined();
      }
    });
  });
});

