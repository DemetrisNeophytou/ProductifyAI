# ProductifyAI Docker Setup

This document provides comprehensive instructions for running ProductifyAI using Docker in both development and production environments.

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for Docker
- 10GB free disk space

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd ProductifyAI

# Copy environment template
cp env.example .env

# Edit environment variables
nano .env  # or use your preferred editor
```

### 2. Configure Environment

Edit the `.env` file with your configuration:

```bash
# Required: Database
POSTGRES_PASSWORD=your_secure_password_here

# Required: OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Required: Supabase (if using Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Optional: Security
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters
SESSION_SECRET=your_session_secret_key_here_minimum_32_characters
```

### 3. Start Services

#### Development Mode
```bash
# Using the startup script (recommended)
./docker-start.sh start

# Or using docker-compose directly
docker-compose up --build -d
```

#### Production Mode
```bash
# Using the startup script with SSL
./docker-start.sh start production

# Or using docker-compose directly
docker-compose --profile production up --build -d
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5050
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Production HTTPS**: https://localhost (with SSL)

## 📁 Project Structure

```
ProductifyAI/
├── docker-compose.yml          # Main orchestration file
├── Dockerfile.backend          # Backend container definition
├── Dockerfile.frontend         # Frontend container definition
├── docker-start.sh            # Startup script
├── .dockerignore              # Docker build exclusions
├── env.example                # Environment template
├── nginx/
│   └── nginx.conf             # Production reverse proxy
├── server/
│   └── init.sql               # Database initialization
└── client/
    └── nginx.conf             # Frontend nginx config
```

## 🐳 Docker Services

### Backend Service
- **Image**: Custom Node.js 18 Alpine
- **Port**: 5050
- **Features**:
  - TypeScript compilation
  - Production optimizations
  - Health checks
  - Non-root user security

### Frontend Service
- **Image**: Custom React + Nginx Alpine
- **Port**: 3000
- **Features**:
  - Vite build optimization
  - Nginx static serving
  - Gzip compression
  - Security headers

### PostgreSQL Database
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Features**:
  - Persistent data volume
  - Automatic initialization
  - Health checks
  - Performance indexes

### Redis Cache
- **Image**: redis:7-alpine
- **Port**: 6379
- **Features**:
  - Password authentication
  - Persistent data volume
  - Health checks
  - Future queue system ready

### Nginx Reverse Proxy (Production)
- **Image**: nginx:alpine
- **Ports**: 80, 443
- **Features**:
  - SSL termination
  - Load balancing
  - Rate limiting
  - Security headers

## 🛠️ Management Commands

### Using the Startup Script

```bash
# Start services
./docker-start.sh start                    # Development mode
./docker-start.sh start production         # Production mode

# Stop services
./docker-start.sh stop

# Restart services
./docker-start.sh restart
./docker-start.sh restart production

# Check status
./docker-start.sh status

# View logs
./docker-start.sh logs                     # All services
./docker-start.sh logs backend             # Specific service

# Cleanup everything
./docker-start.sh cleanup
```

### Using Docker Compose Directly

```bash
# Start services
docker-compose up --build -d

# Start with production profile
docker-compose --profile production up --build -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
docker-compose logs -f backend

# Check status
docker-compose ps

# Execute commands in containers
docker-compose exec backend npm run db:migrate
docker-compose exec postgres psql -U postgres -d productifyai
```

## 🔧 Development Workflow

### 1. Making Changes

```bash
# Make code changes
# Rebuild and restart affected services
docker-compose up --build -d backend frontend

# Or restart all services
./docker-start.sh restart
```

### 2. Database Operations

```bash
# Access database
docker-compose exec postgres psql -U postgres -d productifyai

# Run migrations (when implemented)
docker-compose exec backend npm run db:migrate

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### 3. Debugging

```bash
# View service logs
./docker-start.sh logs backend

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh

# Check service health
./docker-start.sh status
```

## 🚀 Production Deployment

### 1. Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
POSTGRES_PASSWORD=<strong-password>
JWT_SECRET=<32-char-random-string>
SESSION_SECRET=<32-char-random-string>
OPENAI_API_KEY=<your-openai-key>
```

### 2. SSL Certificates

```bash
# Generate SSL certificates (for development)
./docker-start.sh start production

# For production, replace with real certificates:
# Place cert.pem and key.pem in nginx/ssl/
```

### 3. Production Startup

```bash
# Start in production mode
./docker-start.sh start production

# Or manually
docker-compose --profile production up --build -d
```

### 4. Monitoring

```bash
# Check all service health
docker-compose ps

# Monitor logs
docker-compose logs -f

# Check resource usage
docker stats
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique passwords
- Rotate API keys regularly
- Use environment-specific configurations

### 2. Container Security
- All containers run as non-root users
- Minimal Alpine Linux base images
- Security headers configured
- Rate limiting enabled

### 3. Network Security
- Internal Docker network isolation
- SSL/TLS encryption in production
- CORS properly configured
- Input validation and sanitization

## 📊 Performance Optimization

### 1. Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### 2. Caching

- Frontend assets cached for 1 year
- API responses cached where appropriate
- Redis for session and data caching
- Nginx gzip compression enabled

### 3. Database Optimization

- Connection pooling configured
- Indexes on frequently queried columns
- Regular database maintenance
- Backup strategies implemented

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check what's using ports
netstat -tulpn | grep :5050
netstat -tulpn | grep :3000

# Stop conflicting services
sudo systemctl stop <service-name>
```

#### 2. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x docker-start.sh
```

#### 3. Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Test database connection
docker-compose exec backend npm run db:test
```

#### 4. Memory Issues
```bash
# Check Docker resources
docker system df
docker system prune -f

# Increase Docker memory limit in Docker Desktop
```

### Health Checks

All services include health checks:

```bash
# Check service health
curl http://localhost:5050/health/db
curl http://localhost:3000/health

# Docker health status
docker-compose ps
```

### Logs and Debugging

```bash
# Real-time logs
docker-compose logs -f

# Service-specific logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs redis

# Container inspection
docker-compose exec backend env
docker-compose exec backend ps aux
```

## 📈 Scaling

### Horizontal Scaling

```yaml
# Scale backend services
docker-compose up --scale backend=3

# Load balancer configuration needed
```

### Vertical Scaling

```yaml
# Increase resource limits
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '1.0'
```

## 🔄 Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres productifyai > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres productifyai < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v productifyai_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

## 📝 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)

## 🤝 Contributing

When adding new services or modifying the Docker setup:

1. Update this documentation
2. Test in both development and production modes
3. Ensure health checks are included
4. Add proper logging and monitoring
5. Update the startup script if needed

## 📞 Support

For issues with the Docker setup:

1. Check the troubleshooting section
2. Review service logs
3. Verify environment configuration
4. Check Docker and Docker Compose versions
5. Create an issue with detailed logs and configuration
