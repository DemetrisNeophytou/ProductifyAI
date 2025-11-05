import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp } from '../server/app';

let appInitialized = false;
let expressApp: any;

export default async (req: VercelRequest, res: VercelResponse) => {
  if (!appInitialized) {
    const { app } = await initializeApp();
    expressApp = app;
    appInitialized = true;
  }
  
  return expressApp(req, res);
};
