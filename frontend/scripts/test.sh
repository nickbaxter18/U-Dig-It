#!/bin/bash

# Professional Test Runner Script
# Usage: bash scripts/test.sh [options] [path]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
MODE="run"
COVERAGE=false
WATCH=false
PATH_TO_TEST="src"

# Help message
show_help() {
    echo "Usage: bash scripts/test.sh [options] [path]"
    echo ""
    echo "Options:"
    echo "  -w, --watch       Run in watch mode"
    echo "  -c, --coverage    Generate coverage report"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  bash scripts/test.sh src/lib/__tests__/validation.test.ts"
    echo "  bash scripts/test.sh --watch src/components"
    echo "  bash scripts/test.sh --coverage"
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -w|--watch)
            WATCH=true
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            PATH_TO_TEST="$1"
            shift
            ;;
    esac
done

echo -e "${BLUE}🧪 Running Tests${NC}"
echo -e "${BLUE}=================${NC}"
echo ""

# Build command
CMD="pnpm vitest $PATH_TO_TEST"

if [ "$WATCH" = true ]; then
    CMD="$CMD --watch"
    echo -e "${YELLOW}Mode: Watch${NC}"
elif [ "$COVERAGE" = true ]; then
    CMD="$CMD --coverage"
    echo -e "${YELLOW}Mode: Coverage${NC}"
else
    CMD="$CMD --run"
    echo -e "${YELLOW}Mode: Run${NC}"
fi

echo -e "${YELLOW}Path: $PATH_TO_TEST${NC}"
echo ""

# Run tests
eval $CMD

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Tests passed!${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
fi

exit $EXIT_CODE

