#!/bin/bash

# EC2 Environment Configuration Setup Script
# This script generates the production .env file on EC2 with sensitive secrets
# and configures environment variables for Docker container deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to validate required parameters
validate_required_params() {
    local missing_params=()
    
    if [ -z "$GOOGLE_CLIENT_ID" ]; then
        missing_params+=("GOOGLE_CLIENT_ID")
    fi
    
    if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
        missing_params+=("GOOGLE_CLIENT_SECRET")
    fi
    
    if [ -z "$AWS_ACCESS_KEY_ID" ]; then
        missing_params+=("AWS_ACCESS_KEY_ID")
    fi
    
    if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        missing_params+=("AWS_SECRET_ACCESS_KEY")
    fi
    
    if [ -z "$ES_NODE_URL" ]; then
        missing_params+=("ES_NODE_URL")
    fi
    
    if [ -z "$ES_API_KEY" ]; then
        missing_params+=("ES_API_KEY")
    fi
    
    if [ -z "$FRONTEND_URL" ]; then
        missing_params+=("FRONTEND_URL")
    fi
    
    if [ ${#missing_params[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for param in "${missing_params[@]}"; do
            echo "  - $param"
        done
        echo ""
        echo "Usage: $0"
        echo "Required environment variables:"
        echo "  GOOGLE_CLIENT_ID         - Google OAuth client ID"
        echo "  GOOGLE_CLIENT_SECRET     - Google OAuth client secret"
        echo "  AWS_ACCESS_KEY_ID        - AWS access key for S3"
        echo "  AWS_SECRET_ACCESS_KEY    - AWS secret key for S3"
        echo "  ES_NODE_URL              - Elasticsearch node URL"
        echo "  ES_API_KEY               - Elasticsearch API key"
        echo "  FRONTEND_URL             - Frontend application URL"
        echo ""
        echo "Optional environment variables:"
        echo "  EC2_PUBLIC_IP            - EC2 public IP (defaults to auto-detection)"
        echo "  AWS_REGION               - AWS region (defaults to eu-north-1)"
        echo "  S3_BUCKET_NAME           - S3 bucket name (defaults to mastergram-storage)"
        exit 1
    fi
}

# Function to detect EC2 public IP
get_ec2_public_ip() {
    if [ -n "$EC2_PUBLIC_IP" ]; then
        echo "$EC2_PUBLIC_IP"
        return
    fi
    
    # Try to get public IP from EC2 metadata service
    local public_ip
    public_ip=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
    
    if [ -n "$public_ip" ]; then
        echo "$public_ip"
    else
        print_warning "Could not auto-detect EC2 public IP. Using localhost as fallback."
        echo "localhost"
    fi
}

# Function to create the production .env file
create_production_env() {
    local env_file="$1"
    local ec2_ip="$2"
    
    print_status "Creating production environment file: $env_file"
    
    # Set default values for optional variables (matching infrastructure stack)
    local aws_region="${AWS_REGION:-eu-north-1}"
    local s3_bucket_name="${S3_BUCKET_NAME:-mastergram-storage}"
    local s3_bucket_url="https://${s3_bucket_name}.s3.${aws_region}.amazonaws.com"
    
    # Create the .env file with all required variables
    cat > "$env_file" << EOF
# Production Environment Configuration
# Generated on $(date)

# Node.js Configuration
NODE_ENV=production
PORT=3500

# Database Configuration (Docker container names)
MONGO_URL=mongodb://mongo:27017
MONGO_DB_NAME=mastagram
REDIS_URL=redis://redis:6379

# Google OAuth Configuration
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL:-http://${ec2_ip}:5000/api/auth/tokens}

# AWS S3 Configuration
AWS_REGION=${aws_region}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
S3_BUCKET_NAME=${s3_bucket_name}
S3_BUCKET_URL=${s3_bucket_url}

# Elasticsearch Configuration
ES_NODE_URL=${ES_NODE_URL}
ES_API_KEY=${ES_API_KEY}

# Federation Configuration
FEDERATION_ORIGIN=${ec2_ip}:5000

# Frontend Configuration
FRONTEND_URL=${FRONTEND_URL}
EOF
    
    # Set secure permissions on the .env file
    chmod 600 "$env_file"
    
    print_status "Environment file created successfully with secure permissions (600)"
}

# Function to validate environment file
validate_env_file() {
    local env_file="$1"
    
    print_status "Validating environment file..."
    
    # Check if file exists and is readable
    if [ ! -r "$env_file" ]; then
        print_error "Environment file is not readable: $env_file"
        return 1
    fi
    
    # Check for required variables in the file
    local required_vars=("NODE_ENV" "PORT" "MONGO_URL" "REDIS_URL" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET" "FRONTEND_URL")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$env_file"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required variables in environment file:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    
    print_status "Environment file validation passed"
    return 0
}

# Main execution
main() {
    print_status "Starting EC2 environment configuration setup..."
    
    # Validate required parameters
    validate_required_params
    
    # Determine target directory (default to current directory)
    local target_dir="${1:-.}"
    local env_file="${target_dir}/backend/.env"
    
    # Create backend directory if it doesn't exist
    mkdir -p "${target_dir}/backend"
    
    # Get EC2 public IP
    local ec2_ip
    ec2_ip=$(get_ec2_public_ip)
    print_status "Using EC2 IP: $ec2_ip"
    
    # Create production environment file
    create_production_env "$env_file" "$ec2_ip"
    
    # Validate the created environment file
    if validate_env_file "$env_file"; then
        print_status "EC2 environment configuration completed successfully!"
        print_status "Environment file location: $env_file"
        echo ""
        print_status "Next steps:"
        echo "  1. Verify the environment variables are correct"
        echo "  2. Run 'docker-compose -f docker-compose.prod.yml up -d' to start services"
        echo "  3. Check container health with 'docker-compose -f docker-compose.prod.yml ps'"
    else
        print_error "Environment file validation failed!"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"