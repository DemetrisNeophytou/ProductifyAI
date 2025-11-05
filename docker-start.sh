#!/bin/bash

# ProductifyAI Docker Startup Script
# This script helps you start the ProductifyAI application with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_warning "Docker is not running. Falling back to non-Docker local dev with mocks."
        print_status "Starting ProductifyAI locally: API (MOCK_DB=true) + Vite client"
        # NOTE: When Docker Desktop is installed, remove this fallback and run containers below
        (npm run dev &) || {
          print_error "Failed to start local dev. Ensure Node.js deps are installed."
          exit 1
        }
        print_success "Local non-Docker dev started. API on http://localhost:5050, Client on http://localhost:5173"
        exit 0
    fi
    print_success "Docker is running"
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed. Please install docker-compose and try again."
        exit 1
    fi
    print_success "docker-compose is available"
}

# Function to create .env file if it doesn't exist
setup_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f env.example ]; then
            cp env.example .env
            print_success "Created .env file from template"
            print_warning "Please edit .env file with your configuration before starting the application"
            return 1
        else
            print_error "env.example file not found. Cannot create .env file."
            exit 1
        fi
    else
        print_success ".env file exists"
    fi
}

# Function to create SSL certificates for development
setup_ssl() {
    if [ ! -d "nginx/ssl" ]; then
        print_status "Creating SSL certificates for development..."
        mkdir -p nginx/ssl
        
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        print_success "SSL certificates created"
    else
        print_success "SSL certificates exist"
    fi
}

# Function to start services
start_services() {
    local profile=""
    if [ "$1" = "production" ]; then
        profile="--profile production"
        print_status "Starting services in production mode..."
    else
        print_status "Starting services in development mode..."
    fi
    
    # Pull latest images
    print_status "Pulling latest images..."
    docker-compose pull
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose $profile up --build -d
    
    print_success "Services started successfully!"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    docker-compose ps
    
    echo ""
    print_status "Service URLs:"
    echo "  Frontend:    http://localhost:3000"
    echo "  Backend API: http://localhost:5050"
    echo "  Database:    localhost:5432"
    echo "  Redis:       localhost:6379"
    
    if [ -f docker-compose.yml ] && grep -q "profiles:" docker-compose.yml && docker-compose ps nginx 2>/dev/null | grep -q "Up"; then
        echo "  Nginx:       https://localhost (with SSL)"
    fi
}

# Function to show logs
show_logs() {
    local service=""
    if [ ! -z "$1" ]; then
        service="$1"
        print_status "Showing logs for $service..."
        docker-compose logs -f "$service"
    else
        print_status "Showing logs for all services..."
        docker-compose logs -f
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
}

# Function to show help
show_help() {
    echo "ProductifyAI Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start [production]  Start all services (optionally in production mode)"
    echo "  stop               Stop all services"
    echo "  restart [production] Restart all services"
    echo "  status             Show service status"
    echo "  logs [service]     Show logs (optionally for specific service)"
    echo "  cleanup            Stop services and clean up resources"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start           # Start in development mode"
    echo "  $0 start production # Start in production mode with SSL"
    echo "  $0 logs backend    # Show backend logs"
    echo "  $0 status          # Show service status"
}

# Main script logic
main() {
    case "${1:-start}" in
        "start")
            check_docker
            check_docker_compose
            if setup_env; then
                setup_ssl
                start_services "$2"
                show_status
            else
                print_error "Please configure .env file before starting services"
                exit 1
            fi
            ;;
        "stop")
            check_docker
            check_docker_compose
            stop_services
            ;;
        "restart")
            check_docker
            check_docker_compose
            stop_services
            sleep 2
            if setup_env; then
                setup_ssl
                start_services "$2"
                show_status
            else
                print_error "Please configure .env file before starting services"
                exit 1
            fi
            ;;
        "status")
            check_docker
            check_docker_compose
            show_status
            ;;
        "logs")
            check_docker
            check_docker_compose
            show_logs "$2"
            ;;
        "cleanup")
            check_docker
            check_docker_compose
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
