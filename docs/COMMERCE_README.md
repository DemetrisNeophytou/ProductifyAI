# ProductifyAI Commerce System

This document describes the monetization and marketplace features for ProductifyAI.

## Overview

The commerce system enables users to:
- Publish their AI-generated projects to a marketplace
- Sell digital products with Stripe integration
- Manage their library of purchased content
- Clone and modify purchased projects (with permissions)
- Review and rate marketplace listings

## Database Schema

### Core Commerce Tables

#### `listings` - Marketplace Products
```sql
CREATE TABLE listings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' NOT NULL, -- draft, published, archived
  category VARCHAR(50) NOT NULL, -- ebook, course, template, video
  tags JSONB DEFAULT '[]',
  cover_image TEXT,
  preview_images JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '[]',
  file_size INTEGER, -- in bytes
  download_count INTEGER DEFAULT 0 NOT NULL,
  rating NUMERIC(3,2) DEFAULT 0 NOT NULL,
  review_count INTEGER DEFAULT 0 NOT NULL,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### `orders` - Purchase Records
```sql
CREATE TABLE orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id VARCHAR NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  stripe_session_id VARCHAR UNIQUE,
  stripe_payment_intent_id VARCHAR UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, completed, failed, refunded
  payment_method VARCHAR(50),
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(120),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP
);
```

#### `entitlements` - User Ownership
```sql
CREATE TABLE entitlements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  listing_id VARCHAR REFERENCES listings(id) ON DELETE CASCADE,
  order_id VARCHAR REFERENCES orders(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- purchase, clone, free
  status VARCHAR(20) DEFAULT 'active' NOT NULL, -- active, expired, revoked
  permissions JSONB DEFAULT '{"can_download": true, "can_clone": false, "can_share": false, "can_modify": false}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP
);
```

#### `reviews` - User Reviews
```sql
CREATE TABLE reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id VARCHAR NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL, -- 1-5 stars
  title VARCHAR(200),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  helpful_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## API Endpoints

### Marketplace Routes

#### GET /listings
Browse all published listings with filtering and pagination.

**Query Parameters:**
- `category` - Filter by category (ebook, course, template, video)
- `search` - Search in title and description
- `sort` - Sort order (newest, oldest, price_low, price_high, rating, popular)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `rating` - Minimum rating filter
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "ok": true,
  "data": {
    "listings": [
      {
        "id": "listing_123",
        "slug": "productivity-guide-2024",
        "title": "Complete Productivity Guide 2024",
        "description": "A comprehensive guide to productivity...",
        "price": "29.99",
        "currency": "USD",
        "category": "ebook",
        "tags": ["productivity", "self-help", "business"],
        "coverImage": "https://example.com/cover.jpg",
        "rating": 4.5,
        "reviewCount": 23,
        "downloadCount": 156,
        "publishedAt": "2024-01-15T10:30:00Z",
        "owner": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### GET /listings/:slug
Get detailed information about a specific listing.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "listing_123",
    "slug": "productivity-guide-2024",
    "title": "Complete Productivity Guide 2024",
    "description": "A comprehensive guide to productivity...",
    "price": "29.99",
    "currency": "USD",
    "category": "ebook",
    "tags": ["productivity", "self-help", "business"],
    "coverImage": "https://example.com/cover.jpg",
    "previewImages": ["https://example.com/preview1.jpg"],
    "features": ["PDF format", "50+ pages", "Actionable tips"],
    "requirements": ["PDF reader", "Internet connection"],
    "fileSize": 2048576,
    "rating": 4.5,
    "reviewCount": 23,
    "downloadCount": 156,
    "publishedAt": "2024-01-15T10:30:00Z",
    "owner": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "project": {
      "id": "proj_123",
      "type": "ebook",
      "metadata": {...}
    },
    "reviews": [
      {
        "id": "review_123",
        "rating": 5,
        "title": "Excellent guide!",
        "comment": "This guide helped me improve my productivity significantly.",
        "isVerified": true,
        "helpfulCount": 12,
        "createdAt": "2024-01-20T14:30:00Z",
        "user": {
          "name": "Jane Smith"
        }
      }
    ]
  }
}
```

#### GET /listings/categories
Get available categories with counts.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "category": "ebook",
      "count": 45
    },
    {
      "category": "course",
      "count": 23
    },
    {
      "category": "template",
      "count": 67
    },
    {
      "category": "video",
      "count": 15
    }
  ]
}
```

### Checkout Routes

#### POST /checkout/session
Create a Stripe checkout session for a listing.

**Request Body:**
```json
{
  "listingId": "listing_123",
  "successUrl": "https://app.productify.ai/checkout/success",
  "cancelUrl": "https://app.productify.ai/checkout/cancel",
  "email": "buyer@example.com",
  "name": "John Buyer"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "sessionId": "cs_test_123456789",
    "url": "https://checkout.stripe.com/pay/cs_test_123456789",
    "orderId": "order_123"
  }
}
```

#### POST /webhooks/stripe
Handle Stripe webhooks for payment events.

**Events Handled:**
- `checkout.session.completed` - Creates entitlement
- `payment_intent.succeeded` - Confirms payment
- `payment_intent.payment_failed` - Updates order status

### Library Routes

#### GET /me/library
Get user's purchased/owned content.

**Response:**
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "entitlement_123",
        "type": "purchase",
        "status": "active",
        "permissions": {
          "can_download": true,
          "can_clone": false,
          "can_share": false,
          "can_modify": false
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "expiresAt": null,
        "project": {
          "id": "proj_123",
          "title": "Complete Productivity Guide 2024",
          "type": "ebook",
          "metadata": {...},
          "createdAt": "2024-01-10T09:00:00Z"
        },
        "listing": {
          "id": "listing_123",
          "title": "Complete Productivity Guide 2024",
          "description": "A comprehensive guide...",
          "coverImage": "https://example.com/cover.jpg",
          "category": "ebook",
          "price": "29.99",
          "currency": "USD",
          "rating": 4.5,
          "reviewCount": 23
        }
      }
    ],
    "organized": {
      "purchases": [...],
      "clones": [...],
      "free": [...]
    },
    "total": 1
  }
}
```

#### GET /me/library/:projectId
Get specific project from library.

#### POST /me/library/:projectId/download
Download project (if entitled).

### Publish Routes

#### POST /api/projects/:id/publish
Publish a project to the marketplace.

**Request Body:**
```json
{
  "title": "Complete Productivity Guide 2024",
  "description": "A comprehensive guide to productivity techniques...",
  "price": 29.99,
  "currency": "USD",
  "category": "ebook",
  "tags": ["productivity", "self-help", "business"],
  "coverImage": "https://example.com/cover.jpg",
  "previewImages": ["https://example.com/preview1.jpg"],
  "features": ["PDF format", "50+ pages", "Actionable tips"],
  "requirements": ["PDF reader", "Internet connection"]
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "listing": {
      "id": "listing_123",
      "slug": "complete-productivity-guide-2024",
      "title": "Complete Productivity Guide 2024",
      "status": "published",
      "publishedAt": "2024-01-15T10:30:00Z"
    },
    "url": "/listings/complete-productivity-guide-2024"
  }
}
```

#### POST /api/projects/:id/clone
Clone a project (requires clone permission).

**Request Body:**
```json
{
  "title": "My Copy of Productivity Guide",
  "description": "Personalized version of the guide"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "project": {
      "id": "proj_456",
      "title": "My Copy of Productivity Guide",
      "type": "ebook",
      "status": "draft"
    },
    "originalProjectId": "proj_123"
  }
}
```

#### GET /api/projects/:id/status
Get project publication status.

**Response:**
```json
{
  "ok": true,
  "data": {
    "project": {...},
    "listing": {...},
    "isPublished": true,
    "canPublish": false
  }
}
```

## Frontend Integration

### Marketplace Page
```tsx
const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    sort: 'newest',
    minPrice: '',
    maxPrice: '',
    rating: ''
  });

  const fetchListings = async () => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/listings?${params}`);
    const data = await response.json();
    setListings(data.data.listings);
  };

  return (
    <div className="marketplace">
      <Filters filters={filters} onChange={setFilters} />
      <ListingGrid listings={listings} />
    </div>
  );
};
```

### Publish Modal
```tsx
const PublishModal = ({ projectId, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    category: 'ebook',
    tags: []
  });

  const handlePublish = async () => {
    const response = await fetch(`/api/projects/${projectId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      onClose();
      // Redirect to marketplace or show success
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2>Publish to Marketplace</h2>
      <form onSubmit={handlePublish}>
        <input 
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="Product title"
        />
        <textarea 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Product description"
        />
        <input 
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
          placeholder="Price"
        />
        <button type="submit">Publish</button>
      </form>
    </Modal>
  );
};
```

### My Library Page
```tsx
const MyLibrary = () => {
  const [libraryItems, setLibraryItems] = useState([]);

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    const response = await fetch('/me/library');
    const data = await response.json();
    setLibraryItems(data.data.items);
  };

  return (
    <div className="library">
      <h1>My Library</h1>
      <div className="library-grid">
        {libraryItems.map(item => (
          <LibraryItem 
            key={item.id} 
            item={item}
            onDownload={() => downloadProject(item.project.id)}
            onClone={() => cloneProject(item.project.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

## Stripe Integration

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Webhook Setup
1. Create webhook endpoint in Stripe Dashboard
2. Set URL to `https://yourdomain.com/checkout/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to environment variables

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## Permissions System

### Entitlement Types
- **purchase** - Bought from marketplace
- **clone** - Cloned from another project
- **free** - Free download or demo

### Permission Levels
- **can_download** - Download the project files
- **can_clone** - Create a copy for modification
- **can_share** - Share with others (future feature)
- **can_modify** - Edit the original project

### Usage Examples
```typescript
// Check if user can download
const canDownload = entitlement.permissions.can_download;

// Check if user can clone
const canClone = entitlement.permissions.can_clone;

// Check if entitlement is active
const isActive = entitlement.status === 'active';
```

## Security Considerations

### Input Validation
- All inputs validated with Zod schemas
- Price limits and currency validation
- File type and size restrictions
- XSS protection for user-generated content

### Access Control
- User authentication required for all operations
- Ownership verification for publish/delete operations
- Entitlement checks for download/clone operations
- Rate limiting on API endpoints

### Payment Security
- Stripe handles all payment processing
- Webhook signature verification
- No sensitive payment data stored locally
- PCI compliance through Stripe

## Future Enhancements

1. **Advanced Analytics**
   - Sales tracking and reporting
   - Revenue analytics for creators
   - Popular content insights

2. **Social Features**
   - User profiles and portfolios
   - Following creators
   - Social sharing

3. **Advanced Permissions**
   - Time-limited access
   - Usage-based licensing
   - Team/organization sharing

4. **Content Management**
   - Version control for published content
   - Update notifications for buyers
   - Content moderation tools

5. **Monetization Options**
   - Subscription models
   - Bundle deals
   - Discount codes
   - Affiliate programs

---

*Last updated: October 17, 2025*
