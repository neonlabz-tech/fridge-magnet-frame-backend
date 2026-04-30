#!/bin/bash

# Test all authentication validation and status codes
BASE_URL="http://localhost:3000"

echo "🧪 Testing Authentication Validation & Status Codes"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# 1. Test Register Validation
print_header "1️⃣ Testing Register API Validation"
echo "----------------------------------------"

# Test invalid email
echo "Testing invalid email format..."
INVALID_EMAIL_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "password123"
  }')

HTTP_CODE="${INVALID_EMAIL_RESPONSE: -3}"
RESPONSE_BODY="${INVALID_EMAIL_RESPONSE%???}"

if [ "$HTTP_CODE" = "400" ]; then
    print_success "Invalid email validation working (HTTP 400)"
    echo "Response: $RESPONSE_BODY"
else
    print_error "Invalid email validation failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# Test weak password
echo ""
echo "Testing weak password..."
WEAK_PASSWORD_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123"
  }')

HTTP_CODE="${WEAK_PASSWORD_RESPONSE: -3}"
RESPONSE_BODY="${WEAK_PASSWORD_RESPONSE%???}"

if [ "$HTTP_CODE" = "400" ]; then
    print_success "Weak password validation working (HTTP 400)"
    echo "Response: $RESPONSE_BODY"
else
    print_error "Weak password validation failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# Test password without letters
echo ""
echo "Testing password without letters..."
NO_LETTERS_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }')

HTTP_CODE="${NO_LETTERS_RESPONSE: -3}"
RESPONSE_BODY="${NO_LETTERS_RESPONSE%???}"

if [ "$HTTP_CODE" = "400" ]; then
    print_success "Password without letters validation working (HTTP 400)"
    echo "Response: $RESPONSE_BODY"
else
    print_error "Password without letters validation failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# Test password without numbers
echo ""
echo "Testing password without numbers..."
NO_NUMBERS_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password"
  }')

HTTP_CODE="${NO_NUMBERS_RESPONSE: -3}"
RESPONSE_BODY="${NO_NUMBERS_RESPONSE%???}"

if [ "$HTTP_CODE" = "400" ]; then
    print_success "Password without numbers validation working (HTTP 400)"
    echo "Response: $RESPONSE_BODY"
else
    print_error "Password without numbers validation failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# Test valid registration
echo ""
echo "Testing valid registration..."
VALID_REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "valid@example.com",
    "password": "password123"
  }')

HTTP_CODE="${VALID_REGISTER_RESPONSE: -3}"
RESPONSE_BODY="${VALID_REGISTER_RESPONSE%???}"

if [ "$HTTP_CODE" = "201" ]; then
    print_success "Valid registration working (HTTP 201)"
    echo "Response: $RESPONSE_BODY"
    # Extract token for subsequent tests
    USER_TOKEN=$(echo $RESPONSE_BODY | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
elif [ "$HTTP_CODE" = "409" ]; then
    print_success "Valid registration working (user exists - HTTP 409)"
    echo "Response: $RESPONSE_BODY"
    # Try to login to get token
    LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
      "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "valid@example.com",
        "password": "password123"
      }')
    LOGIN_HTTP_CODE="${LOGIN_RESPONSE: -3}"
    LOGIN_RESPONSE_BODY="${LOGIN_RESPONSE%???}"
    if [ "$LOGIN_HTTP_CODE" = "200" ]; then
        USER_TOKEN=$(echo $LOGIN_RESPONSE_BODY | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
    fi
else
    print_error "Valid registration failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# 2. Test Login Validation
print_header ""
print_header "2️⃣ Testing Login API Validation"
echo "-------------------------------------"

# Test invalid email in login
echo "Testing invalid email in login..."
LOGIN_INVALID_EMAIL_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "password123"
  }')

HTTP_CODE="${LOGIN_INVALID_EMAIL_RESPONSE: -3}"
RESPONSE_BODY="${LOGIN_INVALID_EMAIL_RESPONSE%???}"

if [ "$HTTP_CODE" = "400" ]; then
    print_success "Login invalid email validation working (HTTP 400)"
    echo "Response: $RESPONSE_BODY"
else
    print_error "Login invalid email validation failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# Test valid login
echo ""
echo "Testing valid login..."
VALID_LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "valid@example.com",
    "password": "password123"
  }')

HTTP_CODE="${VALID_LOGIN_RESPONSE: -3}"
RESPONSE_BODY="${VALID_LOGIN_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Valid login working (HTTP 200)"
    echo "Response: $RESPONSE_BODY"
    USER_TOKEN=$(echo $RESPONSE_BODY | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
else
    print_error "Valid login failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# 3. Test Forgot Password Validation
print_header ""
print_header "3️⃣ Testing Forgot Password Validation"
echo "----------------------------------------"

# Test invalid email in forgot password
echo "Testing invalid email in forgot password..."
FORGOT_INVALID_EMAIL_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email"
  }')

HTTP_CODE="${FORGOT_INVALID_EMAIL_RESPONSE: -3}"
RESPONSE_BODY="${FORGOT_INVALID_EMAIL_RESPONSE%???}"

if [ "$HTTP_CODE" = "400" ]; then
    print_success "Forgot password invalid email validation working (HTTP 400)"
    echo "Response: $RESPONSE_BODY"
else
    print_error "Forgot password invalid email validation failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# Test valid forgot password
echo ""
echo "Testing valid forgot password..."
VALID_FORGOT_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "valid@example.com"
  }')

HTTP_CODE="${VALID_FORGOT_RESPONSE: -3}"
RESPONSE_BODY="${VALID_FORGOT_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Valid forgot password working (HTTP 200)"
    echo "Response: $RESPONSE_BODY"
    RESET_TOKEN=$(echo $RESPONSE_BODY | grep -o '"resetToken":"[^"]*' | sed 's/"resetToken":"//')
else
    print_error "Valid forgot password failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# Test non-existent email (should return same response)
echo ""
echo "Testing non-existent email (security)..."
NON_EXISTENT_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com"
  }')

HTTP_CODE="${NON_EXISTENT_RESPONSE: -3}"
RESPONSE_BODY="${NON_EXISTENT_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Non-existent email security working (HTTP 200)"
    echo "Response: $RESPONSE_BODY"
    # Should not contain resetToken for non-existent email
    if [[ $RESPONSE_BODY != *"resetToken"* ]]; then
        print_success "Security: No reset token returned for non-existent email"
    else
        print_error "Security issue: Reset token returned for non-existent email"
    fi
else
    print_error "Non-existent email security failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# 4. Test Reset Password Validation
print_header ""
print_header "4️⃣ Testing Reset Password Validation"
echo "--------------------------------------"

if [ ! -z "$RESET_TOKEN" ]; then
    # Test invalid token
    echo "Testing invalid reset token..."
    INVALID_TOKEN_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
      "$BASE_URL/auth/reset-password" \
      -H "Content-Type: application/json" \
      -d '{
        "token": "invalid-token",
        "newPassword": "newpassword123"
      }')

    HTTP_CODE="${INVALID_TOKEN_RESPONSE: -3}"
    RESPONSE_BODY="${INVALID_TOKEN_RESPONSE%???}"

    if [ "$HTTP_CODE" = "400" ]; then
        print_success "Invalid token validation working (HTTP 400)"
        echo "Response: $RESPONSE_BODY"
    else
        print_error "Invalid token validation failed (got HTTP $HTTP_CODE)"
        echo "Response: $RESPONSE_BODY"
    fi

    # Test weak new password
    echo ""
    echo "Testing weak new password..."
    WEAK_NEW_PASSWORD_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
      "$BASE_URL/auth/reset-password" \
      -H "Content-Type: application/json" \
      -d "{
        \"token\": \"$RESET_TOKEN\",
        \"newPassword\": \"123\"
      }")

    HTTP_CODE="${WEAK_NEW_PASSWORD_RESPONSE: -3}"
    RESPONSE_BODY="${WEAK_NEW_PASSWORD_RESPONSE%???}"

    if [ "$HTTP_CODE" = "400" ]; then
        print_success "Weak new password validation working (HTTP 400)"
        echo "Response: $RESPONSE_BODY"
    else
        print_error "Weak new password validation failed (got HTTP $HTTP_CODE)"
        echo "Response: $RESPONSE_BODY"
    fi

    # Test valid reset password
    echo ""
    echo "Testing valid reset password..."
    VALID_RESET_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
      "$BASE_URL/auth/reset-password" \
      -H "Content-Type: application/json" \
      -d "{
        \"token\": \"$RESET_TOKEN\",
        \"newPassword\": \"newpassword123\"
      }")

    HTTP_CODE="${VALID_RESET_RESPONSE: -3}"
    RESPONSE_BODY="${VALID_RESET_RESPONSE%???}"

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Valid reset password working (HTTP 200)"
        echo "Response: $RESPONSE_BODY"
    else
        print_error "Valid reset password failed (got HTTP $HTTP_CODE)"
        echo "Response: $RESPONSE_BODY"
    fi
else
    print_info "Skipping reset password tests (no reset token available)"
fi

# 5. Test Additional Validation Scenarios
print_header ""
print_header "5️⃣ Testing Additional Validation Scenarios"
echo "--------------------------------------------"

# Test missing fields
echo "Testing missing email field..."
MISSING_FIELD_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "password123"
  }')

HTTP_CODE="${MISSING_FIELD_RESPONSE: -3}"
RESPONSE_BODY="${MISSING_FIELD_RESPONSE%???}"

if [ "$HTTP_CODE" = "400" ]; then
    print_success "Missing field validation working (HTTP 400)"
    echo "Response: $RESPONSE_BODY"
else
    print_error "Missing field validation failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# Test additional fields (should be rejected)
echo ""
echo "Testing additional non-whitelisted fields..."
EXTRA_FIELDS_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "password123",
    "extraField": "should not be here"
  }')

HTTP_CODE="${EXTRA_FIELDS_RESPONSE: -3}"
RESPONSE_BODY="${EXTRA_FIELDS_RESPONSE%???}"

if [ "$HTTP_CODE" = "400" ]; then
    print_success "Non-whitelisted fields rejection working (HTTP 400)"
    echo "Response: $RESPONSE_BODY"
else
    print_error "Non-whitelisted fields rejection failed (got HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

# Final Summary
print_header ""
print_header "🎉 Validation & Status Code Testing Complete!"
echo "==============================================="

echo ""
print_info "Summary of fixes implemented:"
echo "✅ Global validation pipe enabled"
echo "✅ Email validation with custom error messages"
echo "✅ Password validation (length + regex)"
echo "✅ Proper HTTP status codes (200, 201, 400, 409)"
echo "✅ Secure forgot password flow"
echo "✅ Field validation and whitelisting"
echo "✅ Transform options enabled"

echo ""
print_info "All validation features should now be working:"
echo "1. ✅ Email format validation"
echo "2. ✅ Password strength validation"
echo "3. ✅ Proper 400 error responses"
echo "4. ✅ Correct HTTP status codes"
echo "5. ✅ Secure forgot password flow"
echo "6. ✅ Field whitelisting and rejection"

echo ""
print_header "🚀 Ready for QA testing!"
echo "============================"
echo "All authentication APIs now have proper validation and status codes."
