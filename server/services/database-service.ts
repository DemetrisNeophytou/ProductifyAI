// ProductifyAI Database Service
import { db } from '../db';
import { Logger } from '../utils/logger';

export class DatabaseService {
  private static instance: DatabaseService;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await db.execute('SELECT NOW() AS now');
      Logger.info('Database connection test successful', { timestamp: result.rows[0].now });
      return true;
    } catch (error) {
      Logger.error('Database connection test failed', error);
      return false;
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<any> {
    try {
      Logger.debug('Executing database query', { query, params });
      const result = await db.execute(query, params);
      return result;
    } catch (error) {
      Logger.error('Database query failed', { query, error });
      throw error;
    }
  }

  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    service: string;
  }> {
    try {
      const result = await this.executeQuery('SELECT NOW() AS now');
      return {
        status: 'Connected',
        timestamp: result.rows[0].now,
        service: 'ProductifyAI Database'
      };
    } catch (error) {
      Logger.error('Health check failed', error);
      return {
        status: 'Disconnected',
        timestamp: new Date().toISOString(),
        service: 'ProductifyAI Database'
      };
    }
  }
}
