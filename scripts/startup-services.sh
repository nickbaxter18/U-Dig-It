#!/bin/bash
# ===========================================
# Kubota Rental Platform - Auto-Startup Script
# ===========================================
# This script ensures services start on correct ports
# and handles port conflicts automatically

set -e

echo "🚀 Kubota Rental Platform - Auto-Startup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to kill process on specific port
kill_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Killing existing process on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${BLUE}Waiting for $service_name to be ready...${NC}"

    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi

        echo -e "${YELLOW}Attempt $attempt/$max_attempts: $service_name not ready yet...${NC}"
        sleep 2
        ((attempt++))
    done

    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

echo -e "${BLUE}📋 Preparing startup environment...${NC}"

# Kill any existing processes on our ports
kill_port 3000
kill_port 3001

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "apps/web/node_modules" ] || [ ! -d "apps/api/node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pnpm install
    cd apps/web && pnpm install && cd ../..
    cd apps/api && pnpm install && cd ../..
fi

echo -e "${GREEN}✅ Environment ready${NC}"
echo ""

# Start services in background with proper port management
echo -e "${BLUE}🎯 Starting Backend API on port 3001...${NC}"
cd apps/api
pnpm run start:simple > /tmp/backend-startup.log 2>&1 &
BACKEND_PID=$!
cd ../..

# Wait for backend to initialize
sleep 8

# Verify backend started successfully
if wait_for_service "http://localhost:3001/health" "Backend API"; then
    echo -e "${GREEN}✅ Backend API: http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Backend failed to start. Check /tmp/backend-startup.log${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""

echo -e "${BLUE}🎨 Starting Frontend on port 3000...${NC}"
cd apps/web
pnpm run dev > /tmp/frontend-startup.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Wait for frontend to initialize
sleep 5

# Verify frontend started successfully
if wait_for_service "http://localhost:3000" "Frontend"; then
    echo -e "${GREEN}✅ Frontend: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend failed to start. Check /tmp/frontend-startup.log${NC}"
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 SUCCESS! All services are running:${NC}"
echo -e "${GREEN}   🌐 Frontend:  http://localhost:3000${NC}"
echo -e "${GREEN}   🔗 Backend:   http://localhost:3001${NC}"
echo -e "${GREEN}   💊 Health:    http://localhost:3001/health${NC}"
echo ""
echo -e "${YELLOW}📋 Service Status:${NC}"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}💡 Services will auto-restart on file changes${NC}"
echo -e "${YELLOW}💡 Press Ctrl+C to stop all services${NC}"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID

