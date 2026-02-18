#!/bin/bash

##############################################################################
# Train Tracker API - Complete Testing Script
# 
# This script demonstrates all API endpoints with curl commands
# Run with: bash api-test.sh
#
# Requirements:
# - Server running on http://localhost:3000
# - curl command available
# - jq installed (optional, for pretty printing)
##############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000/api"
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPassword123"
COOKIE_JAR="cookies.txt"

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

##############################################################################
# Helper Functions
##############################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST: $1${NC}"
}

print_request() {
    echo -e "${YELLOW}REQUEST:${NC}"
    echo "  $1"
}

print_response_success() {
    echo -e "${GREEN}RESPONSE (Success):${NC}"
    echo "  $1"
    ((TESTS_PASSED++))
}

print_response_error() {
    echo -e "${RED}RESPONSE (Error):${NC}"
    echo "  $1"
    ((TESTS_FAILED++))
}

print_summary() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}Test Summary${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo -e "${BLUE}Total: $((TESTS_PASSED + TESTS_FAILED))${NC}\n"
}

# Pretty print JSON
pretty_json() {
    if command -v jq &> /dev/null; then
        echo "$1" | jq .
    else
        echo "$1"
    fi
}

##############################################################################
# Authentication Tests
##############################################################################

test_auth() {
    print_header "Authentication Endpoints"
    
    # Test 1: Signup
    print_test "Create new user account (Signup)"
    print_request "POST $BASE_URL/auth/signup"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
        -H "Content-Type: application/json" \
        -d "{
            \"fullName\": \"Test User\",
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        print_response_success "User created successfully"
        pretty_json "$RESPONSE"
    else
        print_response_error "Signup failed"
        pretty_json "$RESPONSE"
    fi
    
    # Test 2: Login
    print_test "Authenticate user (Login)"
    print_request "POST $BASE_URL/auth/login"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -c "$COOKIE_JAR" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        print_response_success "Login successful"
        pretty_json "$RESPONSE"
    else
        print_response_error "Login failed"
        pretty_json "$RESPONSE"
    fi
    
    # Test 3: Login with invalid credentials
    print_test "Login with invalid password (should fail)"
    print_request "POST $BASE_URL/auth/login (invalid password)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"wrongpassword\"
        }")
    
    if echo "$RESPONSE" | grep -q "success.*false"; then
        print_response_success "Correctly rejected invalid credentials"
        pretty_json "$RESPONSE"
    else
        print_response_error "Should have rejected invalid credentials"
        pretty_json "$RESPONSE"
    fi
    
    # Test 4: Signup with existing email
    print_test "Signup with duplicate email (should fail)"
    print_request "POST $BASE_URL/auth/signup (duplicate email)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
        -H "Content-Type: application/json" \
        -d "{
            \"fullName\": \"Another User\",
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"AnotherPassword123\"
        }")
    
    if echo "$RESPONSE" | grep -q "success.*false"; then
        print_response_success "Correctly rejected duplicate email"
        pretty_json "$RESPONSE"
    else
        print_response_error "Should have rejected duplicate email"
        pretty_json "$RESPONSE"
    fi
    
    # Test 5: Signup validation errors
    print_test "Signup with invalid data (validation error)"
    print_request "POST $BASE_URL/auth/signup (missing fields)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"invalid-email\"
        }")
    
    if echo "$RESPONSE" | grep -q "success.*false"; then
        print_response_success "Validation errors returned"
        pretty_json "$RESPONSE"
    else
        print_response_error "Should have returned validation errors"
        pretty_json "$RESPONSE"
    fi
    
    # Test 6: Logout
    print_test "Logout user"
    print_request "POST $BASE_URL/auth/logout"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
        -H "Content-Type: application/json" \
        -b "$COOKIE_JAR")
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        print_response_success "Logout successful"
        pretty_json "$RESPONSE"
    else
        print_response_error "Logout failed"
        pretty_json "$RESPONSE"
    fi
}

##############################################################################
# Train Search Tests
##############################################################################

test_trains() {
    print_header "Train Search Endpoints"
    
    # Test 1: Basic search
    print_test "Search trains with basic query"
    print_request "GET $BASE_URL/trains/search?query=Mumbai"
    
    RESPONSE=$(curl -s -X GET "$BASE_URL/trains/search?query=Mumbai")
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        print_response_success "Search returned results"
        pretty_json "$RESPONSE"
    else
        print_response_error "Search failed"
        pretty_json "$RESPONSE"
    fi
    
    # Test 2: Search with pagination
    print_test "Search trains with pagination"
    print_request "GET $BASE_URL/trains/search?query=Rajdhani&page=1&limit=5"
    
    RESPONSE=$(curl -s -X GET "$BASE_URL/trains/search?query=Rajdhani&page=1&limit=5")
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        print_response_success "Search with pagination returned results"
        pretty_json "$RESPONSE"
    else
        print_response_error "Search with pagination failed"
        pretty_json "$RESPONSE"
    fi
    
    # Test 3: Search with custom limit
    print_test "Search trains with custom limit"
    print_request "GET $BASE_URL/trains/search?query=Express&limit=3"
    
    RESPONSE=$(curl -s -X GET "$BASE_URL/trains/search?query=Express&limit=3")
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        print_response_success "Search with custom limit returned results"
        pretty_json "$RESPONSE"
    else
        print_response_error "Search with custom limit failed"
        pretty_json "$RESPONSE"
    fi
    
    # Test 4: Search with short query (should fail)
    print_test "Search with query too short (should fail)"
    print_request "GET $BASE_URL/trains/search?query=A"
    
    RESPONSE=$(curl -s -X GET "$BASE_URL/trains/search?query=A")
    
    if echo "$RESPONSE" | grep -q "success.*false"; then
        print_response_success "Correctly rejected short query"
        pretty_json "$RESPONSE"
    else
        print_response_error "Should have rejected short query"
        pretty_json "$RESPONSE"
    fi
    
    # Test 5: Search without query parameter
    print_test "Search without query parameter (should fail)"
    print_request "GET $BASE_URL/trains/search"
    
    RESPONSE=$(curl -s -X GET "$BASE_URL/trains/search")
    
    if echo "$RESPONSE" | grep -q "success.*false"; then
        print_response_success "Correctly rejected missing query"
        pretty_json "$RESPONSE"
    else
        print_response_error "Should have rejected missing query"
        pretty_json "$RESPONSE"
    fi
    
    # Test 6: Verify pagination metadata
    print_test "Verify pagination metadata is present"
    print_request "GET $BASE_URL/trains/search?query=Mumbai&page=1&limit=10"
    
    RESPONSE=$(curl -s -X GET "$BASE_URL/trains/search?query=Mumbai&page=1&limit=10")
    
    if echo "$RESPONSE" | grep -q '"page"' && echo "$RESPONSE" | grep -q '"limit"' && \
       echo "$RESPONSE" | grep -q '"total"' && echo "$RESPONSE" | grep -q '"hasMore"'; then
        print_response_success "Pagination metadata is complete"
        pretty_json "$RESPONSE"
    else
        print_response_error "Missing pagination metadata"
        pretty_json "$RESPONSE"
    fi
}

##############################################################################
# Contact Request Tests
##############################################################################

test_contact() {
    print_header "Contact Request Endpoints"
    
    # Test 1: Basic contact request
    print_test "Submit basic contact request"
    print_request "POST $BASE_URL/contact"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/contact" \
        -H "Content-Type: application/json" \
        -d "{
            \"category\": \"technical\",
            \"fullName\": \"Test User\",
            \"email\": \"test@example.com\",
            \"hasTicket\": false,
            \"message\": \"I need help with my booking\"
        }")
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        print_response_success "Contact request submitted"
        pretty_json "$RESPONSE"
    else
        print_response_error "Contact request failed"
        pretty_json "$RESPONSE"
    fi
    
    # Test 2: Contact request with ticket
    print_test "Submit contact request with ticket reference"
    print_request "POST $BASE_URL/contact (with ticket)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/contact" \
        -H "Content-Type: application/json" \
        -d "{
            \"category\": \"billing\",
            \"fullName\": \"Jane Smith\",
            \"email\": \"jane@example.com\",
            \"hasTicket\": true,
            \"referenceCode\": \"TKT-2026021800123\",
            \"message\": \"I was charged incorrectly\"
        }")
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        print_response_success "Contact with ticket submitted"
        pretty_json "$RESPONSE"
    else
        print_response_error "Contact with ticket failed"
        pretty_json "$RESPONSE"
    fi
    
    # Test 3: Contact with missing required fields
    print_test "Contact request with missing fields (should fail)"
    print_request "POST $BASE_URL/contact (missing fields)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/contact" \
        -H "Content-Type: application/json" \
        -d "{
            \"category\": \"general\",
            \"fullName\": \"Incomplete User\"
        }")
    
    if echo "$RESPONSE" | grep -q "success.*false"; then
        print_response_success "Correctly rejected incomplete request"
        pretty_json "$RESPONSE"
    else
        print_response_error "Should have rejected incomplete request"
        pretty_json "$RESPONSE"
    fi
    
    # Test 4: Contact with invalid email
    print_test "Contact request with invalid email (should fail)"
    print_request "POST $BASE_URL/contact (invalid email)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/contact" \
        -H "Content-Type: application/json" \
        -d "{
            \"category\": \"general\",
            \"fullName\": \"User\",
            \"email\": \"not-an-email\",
            \"hasTicket\": false,
            \"message\": \"Help me\"
        }")
    
    if echo "$RESPONSE" | grep -q "success.*false"; then
        print_response_success "Correctly rejected invalid email"
        pretty_json "$RESPONSE"
    else
        print_response_error "Should have rejected invalid email"
        pretty_json "$RESPONSE"
    fi
    
    # Test 5: Contact with ticket but missing reference code
    print_test "Contact with ticket=true but missing reference (should fail)"
    print_request "POST $BASE_URL/contact (missing reference)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/contact" \
        -H "Content-Type: application/json" \
        -d "{
            \"category\": \"billing\",
            \"fullName\": \"User\",
            \"email\": \"user@example.com\",
            \"hasTicket\": true,
            \"message\": \"Help with billing\"
        }")
    
    if echo "$RESPONSE" | grep -q "success.*false"; then
        print_response_success "Correctly rejected missing reference"
        pretty_json "$RESPONSE"
    else
        print_response_error "Should have rejected missing reference"
        pretty_json "$RESPONSE"
    fi
}

##############################################################################
# Main Test Execution
##############################################################################

main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║  Train Tracker API - Test Suite        ║"
    echo "║  Base URL: $BASE_URL"
    echo "║  Generated: $(date)           ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check if server is running
    echo -e "${YELLOW}Checking server connectivity...${NC}"
    if ! curl -s -m 2 "$BASE_URL/trains/search?query=test" > /dev/null 2>&1; then
        echo -e "${RED}Error: Cannot connect to server at $BASE_URL${NC}"
        echo -e "${RED}Make sure the server is running (npm run dev)${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Server is running${NC}\n"
    
    # Run all tests
    test_auth
    test_trains
    test_contact
    
    # Clean up
    rm -f "$COOKIE_JAR"
    
    # Print summary
    print_summary
}

# Run main function
main
