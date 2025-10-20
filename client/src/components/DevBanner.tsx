/**
 * Development Mode Banner
 * Shows environment status in development mode
 */

import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export function DevBanner() {
  const showBanner = import.meta.env.VITE_SHOW_DEV_BANNER === 'true';
  const isDev = import.meta.env.DEV;

  if (!showBanner || !isDev) {
    return null;
  }

  const mockDB = import.meta.env.VITE_MOCK_DB === 'true';
  const mockStripe = import.meta.env.VITE_MOCK_STRIPE === 'true';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold text-yellow-700 dark:text-yellow-400">
            Development Mode
          </span>
        </div>
        <div className="space-y-1 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              ENV: {import.meta.env.MODE}
            </Badge>
            <Badge variant={mockDB ? 'secondary' : 'default'} className="text-xs">
              MOCK_DB: {mockDB ? 'ON' : 'OFF'}
            </Badge>
            <Badge variant={mockStripe ? 'secondary' : 'default'} className="text-xs">
              MOCK_STRIPE: {mockStripe ? 'ON' : 'OFF'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

