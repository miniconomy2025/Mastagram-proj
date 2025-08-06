#!/bin/bash

# Script to verify Docker setup on EC2 instance
# This script should be run after EC2 instance is launched to verify Docker configuration

echo "=== Docker Setup Verification ==="

# Check if Docker is installed
echo "Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "✓ Docker is installed: $(docker --version)"
else
    echo "✗ Docker is not installed"
    exit 1
fi

# Check if Docker Compose is installed
echo "Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    echo "✓ Docker Compose is installed: $(docker-compose --version)"
else
    echo "✗ Docker Compose is not installed"
    exit 1
fi

# Check if Docker service is running
echo "Checking Docker service status..."
if systemctl is-active --quiet docker; then
    echo "✓ Docker service is running"
else
    echo "✗ Docker service is not running"
    exit 1
fi

# Check if Docker service is enabled to start on boot
echo "Checking Docker service boot configuration..."
if systemctl is-enabled --quiet docker; then
    echo "✓ Docker service is enabled to start on boot"
else
    echo "✗ Docker service is not enabled to start on boot"
    exit 1
fi

# Check if current user can run Docker commands (without sudo)
echo "Checking Docker permissions for current user..."
if docker ps &> /dev/null; then
    echo "✓ Current user can run Docker commands without sudo"
else
    echo "✗ Current user cannot run Docker commands without sudo"
    echo "  Note: You may need to log out and log back in for group membership to take effect"
fi

# Check if user is in docker group
echo "Checking Docker group membership..."
if groups | grep -q docker; then
    echo "✓ Current user is in the docker group"
else
    echo "✗ Current user is not in the docker group"
fi

# Test basic Docker functionality
echo "Testing basic Docker functionality..."
if docker run --rm hello-world &> /dev/null; then
    echo "✓ Docker can run containers successfully"
else
    echo "✗ Docker cannot run containers"
fi

echo "=== Verification Complete ==="