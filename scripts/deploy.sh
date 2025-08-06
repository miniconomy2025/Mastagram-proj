#!/bin/bash

# EC2 Docker Deployment Script
# This script handles the Docker container lifecycle for backend deployment
# Implements container stop, update, and restart logic with error handling

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
LOG_FILE="/tmp/mastagram-deploy.log"
BACKUP_DIR="/tmp/mastagram-backup-$(date +%Y%m%d-%H%M%S)"

# Function to print colored output with timestamps
log_info() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
    echo -e "${GREEN}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

log_warning() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] $1"
    echo -e "${YELLOW}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

log_error() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"
    echo -e "${RED}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

log_step() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] [STEP] $1"
    echo -e "${BLUE}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

# Function to check if Docker is running
check_docker() {
    log_step "Checking Docker availability..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    log_info "Docker and Docker Compose are available"
}

# Function to validate required files
validate_files() {
    log_step "Validating required files..."
    
    local required_files=("$COMPOSE_FILE" "backend/.env" "backend/Dockerfile")
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -ne 0 ]; then
        log_error "Missing required files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        exit 1
    fi
    
    log_info "All required files are present"
}

# Function to create backup of current deployment
create_backup() {
    log_step "Creating backup of current deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup current containers state
    if docker-compose -f "$COMPOSE_FILE" ps --services --filter "status=running" | grep -q .; then
        log_info "Backing up container information..."
        docker-compose -f "$COMPOSE_FILE" ps > "$BACKUP_DIR/containers-state.txt"
        docker-compose -f "$COMPOSE_FILE" logs --tail=100 > "$BACKUP_DIR/containers-logs.txt" 2>/dev/null || true
    fi
    
    # Backup environment file
    if [ -f "backend/.env" ]; then
        cp "backend/.env" "$BACKUP_DIR/.env.backup"
        log_info "Environment file backed up"
    fi
    
    log_info "Backup created at: $BACKUP_DIR"
}

# Function to stop existing containers
stop_containers() {
    log_step "Stopping existing containers..."
    
    # Check if any containers are running
    if docker-compose -f "$COMPOSE_FILE" ps --services --filter "status=running" | grep -q .; then
        log_info "Stopping running containers..."
        
        # Stop containers gracefully with timeout
        if ! timeout 60 docker-compose -f "$COMPOSE_FILE" stop; then
            log_warning "Graceful stop timed out, forcing container shutdown..."
            docker-compose -f "$COMPOSE_FILE" kill
        fi
        
        log_info "Containers stopped successfully"
    else
        log_info "No running containers found"
    fi
    
    # Remove containers to ensure clean state
    log_info "Removing stopped containers..."
    docker-compose -f "$COMPOSE_FILE" rm -f
}

# Function to clean up unused Docker resources
cleanup_docker() {
    log_step "Cleaning up unused Docker resources..."
    
    # Remove dangling images
    local dangling_images
    dangling_images=$(docker images -f "dangling=true" -q)
    if [ -n "$dangling_images" ]; then
        log_info "Removing dangling images..."
        docker rmi $dangling_images || log_warning "Failed to remove some dangling images"
    fi
    
    # Prune unused networks (but keep our custom network)
    log_info "Pruning unused networks..."
    docker network prune -f || log_warning "Failed to prune networks"
    
    log_info "Docker cleanup completed"
}

# Function to build and start containers
start_containers() {
    log_step "Building and starting containers..."
    
    # Build images with no cache to ensure latest code
    log_info "Building backend image..."
    if ! docker-compose -f "$COMPOSE_FILE" build --no-cache backend; then
        log_error "Failed to build backend image"
        exit 1
    fi
    
    # Start services with dependency order
    log_info "Starting services..."
    if ! docker-compose -f "$COMPOSE_FILE" up -d; then
        log_error "Failed to start containers"
        exit 1
    fi
    
    log_info "Containers started successfully"
}

# Function to wait for services to be healthy
wait_for_health() {
    log_step "Waiting for services to become healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        # Check if all services are healthy
        local unhealthy_services
        unhealthy_services=$(docker-compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}" | grep -v "Up.*healthy" | grep "Up" | wc -l)
        
        if [ "$unhealthy_services" -eq 0 ]; then
            log_info "All services are healthy!"
            return 0
        fi
        
        log_info "Waiting for services to become healthy... ($unhealthy_services services still starting)"
        sleep 10
        ((attempt++))
    done
    
    log_warning "Some services may not be fully healthy yet. Check container status manually."
    return 1
}

# Function to verify deployment
verify_deployment() {
    log_step "Verifying deployment..."
    
    # Check container status
    log_info "Container status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    # Check if backend is responding
    log_info "Testing backend health endpoint..."
    local backend_health=false
    for i in {1..5}; do
        if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
            backend_health=true
            break
        fi
        log_info "Backend health check attempt $i/5 failed, retrying in 5 seconds..."
        sleep 5
    done
    
    if [ "$backend_health" = true ]; then
        log_info "Backend health check passed"
    else
        log_warning "Backend health check failed - service may still be starting"
    fi
    
    # Show resource usage
    log_info "Container resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker-compose -f "$COMPOSE_FILE" ps -q) || true
}

# Function to handle rollback
rollback_deployment() {
    log_error "Deployment failed, attempting rollback..."
    
    # Stop current containers
    docker-compose -f "$COMPOSE_FILE" stop || true
    docker-compose -f "$COMPOSE_FILE" rm -f || true
    
    # Restore environment file if backup exists
    if [ -f "$BACKUP_DIR/.env.backup" ]; then
        cp "$BACKUP_DIR/.env.backup" "backend/.env"
        log_info "Environment file restored from backup"
    fi
    
    log_error "Rollback completed. Check logs for details: $LOG_FILE"
    log_error "Backup location: $BACKUP_DIR"
}

# Function to show deployment summary
show_summary() {
    log_step "Deployment Summary"
    echo ""
    echo "=== Mastagram Backend Deployment Complete ==="
    echo "Timestamp: $(date)"
    echo "Log file: $LOG_FILE"
    echo "Backup location: $BACKUP_DIR"
    echo ""
    echo "Services:"
    docker-compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "To view logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "To check status: docker-compose -f $COMPOSE_FILE ps"
    echo "To stop services: docker-compose -f $COMPOSE_FILE stop"
    echo ""
}

# Main deployment function
main() {
    log_info "Starting Mastagram backend deployment..."
    log_info "Log file: $LOG_FILE"
    
    # Initialize log file
    echo "=== Mastagram Deployment Log - $(date) ===" > "$LOG_FILE"
    
    # Set up error handling
    trap 'log_error "Deployment failed at line $LINENO"; rollback_deployment; exit 1' ERR
    
    # Pre-deployment checks
    check_docker
    validate_files
    
    # Create backup
    create_backup
    
    # Stop existing containers
    stop_containers
    
    # Clean up Docker resources
    cleanup_docker
    
    # Start new containers
    start_containers
    
    # Wait for services to be healthy
    wait_for_health || log_warning "Health check timeout - services may still be starting"
    
    # Verify deployment
    verify_deployment
    
    # Show summary
    show_summary
    
    log_info "Deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Mastagram Backend Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --logs         Show recent container logs"
        echo "  --status       Show container status"
        echo "  --stop         Stop all containers"
        echo ""
        echo "This script will:"
        echo "  1. Stop existing containers"
        echo "  2. Create a backup"
        echo "  3. Build and start new containers"
        echo "  4. Verify the deployment"
        echo ""
        exit 0
        ;;
    --logs)
        docker-compose -f "$COMPOSE_FILE" logs -f
        exit 0
        ;;
    --status)
        docker-compose -f "$COMPOSE_FILE" ps
        exit 0
        ;;
    --stop)
        log_info "Stopping all containers..."
        docker-compose -f "$COMPOSE_FILE" stop
        log_info "Containers stopped"
        exit 0
        ;;
    "")
        # No arguments, run main deployment
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac