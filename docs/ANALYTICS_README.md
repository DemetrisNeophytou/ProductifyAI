# Product Analytics System

This document describes the analytics and metrics tracking system for ProductifyAI.

## Overview

The analytics system allows you to:
- Track user interactions and events
- Monitor product performance metrics
- Generate detailed reports and summaries
- Visualize data with charts and graphs

## Database Schema

### metrics_events Table
```sql
CREATE TABLE metrics_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  kind VARCHAR(40) NOT NULL,
  value NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id` - Unique identifier (auto-increment)
- `user_id` - Associated user (optional until auth implemented)
- `project_id` - Associated project (required)
- `kind` - Event type (e.g., 'view', 'click', 'lead', 'sale', 'revenue')
- `value` - Numeric value associated with the event
- `metadata` - Additional event data (JSON)
- `created_at` - Event timestamp

## API Endpoints

### POST /api/analytics/event

Track a new analytics event.

**Request Body:**
```json
{
  "projectId": "proj_1234567890_abc123",
  "kind": "view",
  "value": 1,
  "metadata": {
    "source": "dashboard",
    "page": "home"
  }
}
```

**Parameters:**
- `projectId` (string, required) - Project ID to track event for
- `kind` (string, required) - Event type (max 40 characters)
- `value` (number, optional) - Numeric value associated with event
- `metadata` (object, optional) - Additional event data

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "projectId": "proj_1234567890_abc123",
    "userId": null,
    "kind": "view",
    "value": 1,
    "metadata": {
      "source": "dashboard",
      "page": "home"
    },
    "createdAt": "2025-10-17T15:30:00Z"
  }
}
```

### GET /api/analytics/summary

Get analytics summary for a project.

**Query Parameters:**
- `projectId` (string, required) - Project ID to get summary for
- `startDate` (string, optional) - Start date filter (YYYY-MM-DD)
- `endDate` (string, optional) - End date filter (YYYY-MM-DD)

**Response:**
```json
{
  "ok": true,
  "data": {
    "summary": [
      {
        "kind": "view",
        "count": "150",
        "total_value": "150",
        "avg_value": "1.0000",
        "min_value": "1",
        "max_value": "1"
      },
      {
        "kind": "click",
        "count": "45",
        "total_value": "45",
        "avg_value": "1.0000",
        "min_value": "1",
        "max_value": "1"
      }
    ],
    "totals": {
      "total_events": "195",
      "total_leads": "12",
      "total_sales": "3",
      "total_revenue": "299.97",
      "total_views": "150",
      "total_clicks": "45"
    },
    "dailyMetrics": [
      {
        "date": "2025-10-17",
        "kind": "view",
        "count": "25",
        "total_value": "25"
      }
    ]
  }
}
```

### GET /api/analytics/events

Get raw events for a project.

**Query Parameters:**
- `projectId` (string, required) - Project ID to get events for
- `kind` (string, optional) - Filter by event type
- `limit` (number, optional) - Number of events to return (default: 100)
- `offset` (number, optional) - Number of events to skip (default: 0)

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "projectId": "proj_1234567890_abc123",
      "userId": null,
      "kind": "view",
      "value": 1,
      "metadata": {
        "source": "dashboard"
      },
      "createdAt": "2025-10-17T15:30:00Z"
    }
  ]
}
```

## Event Types

### Standard Event Types
- `view` - Page or content view
- `click` - Button or link click
- `lead` - Lead generation (email signup, form submission)
- `sale` - Purchase or conversion
- `revenue` - Revenue amount (use value field)
- `download` - File download
- `share` - Content sharing
- `like` - Content like/favorite

### Custom Event Types
You can create custom event types as needed. Use descriptive names that clearly indicate what the event represents.

## Usage Examples

### 1. Track a Page View
```bash
curl -X POST "http://localhost:5050/api/analytics/event" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_1234567890_abc123",
    "kind": "view",
    "value": 1,
    "metadata": {
      "page": "home",
      "source": "web"
    }
  }'
```

### 2. Track a Sale
```bash
curl -X POST "http://localhost:5050/api/analytics/event" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_1234567890_abc123",
    "kind": "sale",
    "value": 1,
    "metadata": {
      "product": "ebook",
      "price": 29.99
    }
  }'
```

### 3. Track Revenue
```bash
curl -X POST "http://localhost:5050/api/analytics/event" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_1234567890_abc123",
    "kind": "revenue",
    "value": 29.99,
    "metadata": {
      "currency": "USD",
      "payment_method": "stripe"
    }
  }'
```

### 4. Get Analytics Summary
```bash
curl "http://localhost:5050/api/analytics/summary?projectId=proj_1234567890_abc123"
```

### 5. Get Events with Date Filter
```bash
curl "http://localhost:5050/api/analytics/summary?projectId=proj_1234567890_abc123&startDate=2025-10-01&endDate=2025-10-31"
```

## Frontend Integration

### React Hook for Analytics
```tsx
const useAnalytics = () => {
  const trackEvent = async (projectId: string, kind: string, value?: number, metadata?: any) => {
    try {
      const response = await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          kind,
          value,
          metadata
        })
      });
      return response.json();
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  return { trackEvent };
};
```

### Tracking Page Views
```tsx
import { useEffect } from 'react';
import { useAnalytics } from './hooks/useAnalytics';

const ProductPage = ({ projectId }) => {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent(projectId, 'view', 1, {
      page: 'product',
      timestamp: Date.now()
    });
  }, [projectId]);

  return <div>Product content...</div>;
};
```

### Tracking Button Clicks
```tsx
const CTAButton = ({ projectId, action }) => {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent(projectId, 'click', 1, {
      button: action,
      location: 'header'
    });
    // Perform action...
  };

  return <button onClick={handleClick}>Click Me</button>;
};
```

## Dashboard Integration

The analytics system integrates with the main dashboard to provide:

### Key Metrics Cards
- Total Events
- Leads Generated
- Sales Completed
- Revenue Earned

### Event Breakdown
- Detailed metrics by event type
- Count, total value, average value
- Min/max values for each event type

### Daily Metrics
- Recent activity by day
- Event counts and values over time
- Trend analysis

## Best Practices

### 1. Consistent Event Naming
Use consistent, descriptive names for event types:
- ✅ `page_view`, `button_click`, `form_submit`
- ❌ `pv`, `btn`, `submit`

### 2. Meaningful Values
Use the value field appropriately:
- Count events: `value: 1`
- Revenue: `value: 29.99`
- Duration: `value: 120` (seconds)

### 3. Rich Metadata
Include relevant context in metadata:
```json
{
  "kind": "purchase",
  "value": 29.99,
  "metadata": {
    "product_id": "ebook_123",
    "product_name": "Productivity Guide",
    "currency": "USD",
    "payment_method": "stripe",
    "user_segment": "premium"
  }
}
```

### 4. Privacy Considerations
- Don't track personally identifiable information
- Use hashed or anonymized user identifiers
- Comply with privacy regulations (GDPR, CCPA)

## Performance Considerations

### 1. Batch Events
For high-volume tracking, consider batching events:
```tsx
const batchEvents = async (events) => {
  await fetch('/api/analytics/events/batch', {
    method: 'POST',
    body: JSON.stringify({ events })
  });
};
```

### 2. Async Tracking
Don't block user interactions for analytics:
```tsx
const trackEventAsync = (event) => {
  // Fire and forget
  fetch('/api/analytics/event', {
    method: 'POST',
    body: JSON.stringify(event)
  }).catch(console.error);
};
```

### 3. Rate Limiting
The API includes rate limiting to prevent abuse:
- 100 events per minute per IP
- 1000 events per hour per project

## Future Enhancements

1. **Real-time Analytics**
   - WebSocket connections for live updates
   - Real-time dashboard updates

2. **Advanced Filtering**
   - Complex date ranges
   - Custom event type filters
   - User segmentation

3. **Data Export**
   - CSV/JSON export functionality
   - Scheduled reports
   - API data access

4. **Machine Learning**
   - Predictive analytics
   - Anomaly detection
   - User behavior patterns

---

*Last updated: October 17, 2025*
