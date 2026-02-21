#!/bin/bash

# CincyMuse Chatbot Deployment Script
# This script deploys the complete CincyMuse backend infrastructure and performs post-deployment setup
# Usage: ./deploy.sh <environment> [options]
# Example: ./deploy.sh dev
# Example: ./deploy.sh prod --skip-user-creation

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Function to print colored output
print_info() {
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

# Function to print usage
print_usage() {
    cat << EOF
Usage: $0 <environment> [options]

Arguments:
  environment           Deployment environment (dev, staging, prod)

Options:
  --skip-user-creation  Skip Cognito admin user creation
  --skip-kb-sync        Skip initial Knowledge Base sync
  --github-owner        GitHub repository owner (required for Amplify)
  --github-repo         GitHub repository name (required for Amplify)
  --github-token-arn    GitHub OAuth token secret ARN (required for Amplify)
  -h, --help            Show this help message

Examples:
  $0 dev
  $0 prod --github-owner myorg --github-repo cincymuse --github-token-arn arn:aws:secretsmanager:...
  $0 staging --skip-user-creation

Environment Variables:
  AWS_PROFILE           AWS CLI profile to use (optional)
  AWS_REGION            AWS region for deployment (default: us-east-1)

EOF
}

# Parse arguments
ENVIRONMENT=""
SKIP_USER_CREATION=false
SKIP_KB_SYNC=false
GITHUB_OWNER=""
GITHUB_REPO=""
GITHUB_TOKEN_ARN=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_usage
            exit 0
            ;;
        --skip-user-creation)
            SKIP_USER_CREATION=true
            shift
            ;;
        --skip-kb-sync)
            SKIP_KB_SYNC=true
            shift
            ;;
        --github-owner)
            GITHUB_OWNER="$2"
            shift 2
            ;;
        --github-repo)
            GITHUB_REPO="$2"
            shift 2
            ;;
        --github-token-arn)
            GITHUB_TOKEN_ARN="$2"
            shift 2
            ;;
        dev|staging|prod)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    print_error "Environment is required"
    print_usage
    exit 1
fi

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT (must be dev, staging, or prod)"
    exit 1
fi

# Set AWS region default
AWS_REGION="${AWS_REGION:-us-east-1}"

print_info "=========================================="
print_info "CincyMuse Chatbot Deployment"
print_info "=========================================="
print_info "Environment: $ENVIRONMENT"
print_info "AWS Region: $AWS_REGION"
if [[ -n "$AWS_PROFILE" ]]; then
    print_info "AWS Profile: $AWS_PROFILE"
fi
print_info "=========================================="

# Validate prerequisites
print_info "Validating prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it from https://aws.amazon.com/cli/"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js which includes npm."
    exit 1
fi

# Check CDK CLI
if ! command -v cdk &> /dev/null; then
    print_error "AWS CDK CLI is not installed. Install it with: npm install -g aws-cdk"
    exit 1
fi

# Check jq for JSON parsing
if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed. Some features may not work. Install with: brew install jq (macOS) or apt-get install jq (Linux)"
fi

# Verify AWS credentials
print_info "Verifying AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured or invalid. Run 'aws configure' to set up credentials."
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_success "AWS credentials verified (Account: $AWS_ACCOUNT_ID)"

# Navigate to backend directory
cd "$BACKEND_DIR"

# Install dependencies
print_info "Installing backend dependencies..."
npm install
print_success "Dependencies installed"

# Bootstrap CDK (if needed)
print_info "Checking CDK bootstrap status..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region "$AWS_REGION" &> /dev/null; then
    print_warning "CDK is not bootstrapped in this region. Bootstrapping now..."
    cdk bootstrap "aws://${AWS_ACCOUNT_ID}/${AWS_REGION}"
    print_success "CDK bootstrapped"
else
    print_success "CDK already bootstrapped"
fi

# Build CDK context arguments
CDK_CONTEXT_ARGS="-c environment=$ENVIRONMENT"

if [[ -n "$GITHUB_OWNER" ]]; then
    CDK_CONTEXT_ARGS="$CDK_CONTEXT_ARGS -c githubOwner=$GITHUB_OWNER"
fi

if [[ -n "$GITHUB_REPO" ]]; then
    CDK_CONTEXT_ARGS="$CDK_CONTEXT_ARGS -c githubRepo=$GITHUB_REPO"
fi

if [[ -n "$GITHUB_TOKEN_ARN" ]]; then
    CDK_CONTEXT_ARGS="$CDK_CONTEXT_ARGS -c githubTokenSecretArn=$GITHUB_TOKEN_ARN"
fi

# Synthesize CDK stack
print_info "Synthesizing CDK stack..."
cdk synth $CDK_CONTEXT_ARGS --quiet
print_success "CDK stack synthesized"

# Deploy CDK stack
print_info "Deploying CDK stack to $ENVIRONMENT environment..."
print_warning "This may take 10-15 minutes..."

cdk deploy $CDK_CONTEXT_ARGS --require-approval never --outputs-file "$BACKEND_DIR/cdk-outputs.json"

if [[ $? -ne 0 ]]; then
    print_error "CDK deployment failed"
    exit 1
fi

print_success "CDK stack deployed successfully"

# Parse outputs
if [[ -f "$BACKEND_DIR/cdk-outputs.json" ]]; then
    print_info "Parsing deployment outputs..."
    
    # Extract stack name (first key in outputs)
    STACK_NAME=$(jq -r 'keys[0]' "$BACKEND_DIR/cdk-outputs.json")
    
    # Extract outputs
    USER_POOL_ID=$(jq -r ".\"$STACK_NAME\".UserPoolId // empty" "$BACKEND_DIR/cdk-outputs.json")
    CHAT_FUNCTION_URL=$(jq -r ".\"$STACK_NAME\".ChatFunctionUrl // empty" "$BACKEND_DIR/cdk-outputs.json")
    ADMIN_FUNCTION_URL=$(jq -r ".\"$STACK_NAME\".AdminFunctionUrl // empty" "$BACKEND_DIR/cdk-outputs.json")
    KB_ID=$(jq -r ".\"$STACK_NAME\".KnowledgeBaseId // empty" "$BACKEND_DIR/cdk-outputs.json")
    AMPLIFY_URL=$(jq -r ".\"$STACK_NAME\".AmplifyAppUrl // empty" "$BACKEND_DIR/cdk-outputs.json")
    
    print_success "Deployment outputs parsed"
    echo ""
    print_info "=========================================="
    print_info "Deployment Outputs"
    print_info "=========================================="
    print_info "Chat Function URL: $CHAT_FUNCTION_URL"
    print_info "Admin Function URL: $ADMIN_FUNCTION_URL"
    print_info "Knowledge Base ID: $KB_ID"
    print_info "User Pool ID: $USER_POOL_ID"
    if [[ -n "$AMPLIFY_URL" ]]; then
        print_info "Amplify URL: $AMPLIFY_URL"
    fi
    print_info "=========================================="
    echo ""
else
    print_warning "Could not find cdk-outputs.json. Skipping output parsing."
fi

# Create initial Cognito admin user
if [[ "$SKIP_USER_CREATION" == false ]] && [[ -n "$USER_POOL_ID" ]]; then
    print_info "Creating initial Cognito admin user..."
    
    # Prompt for admin email
    read -p "Enter admin email address: " ADMIN_EMAIL
    
    if [[ -z "$ADMIN_EMAIL" ]]; then
        print_warning "No email provided. Skipping user creation."
    else
        # Generate temporary password
        TEMP_PASSWORD=$(openssl rand -base64 12)
        
        # Create user
        print_info "Creating user $ADMIN_EMAIL..."
        aws cognito-idp admin-create-user \
            --user-pool-id "$USER_POOL_ID" \
            --username "$ADMIN_EMAIL" \
            --user-attributes Name=email,Value="$ADMIN_EMAIL" Name=email_verified,Value=true Name=custom:role,Value=Admin \
            --temporary-password "$TEMP_PASSWORD" \
            --message-action SUPPRESS \
            --region "$AWS_REGION" 2>/dev/null
        
        if [[ $? -eq 0 ]]; then
            print_success "Admin user created successfully"
            print_info "Email: $ADMIN_EMAIL"
            print_info "Temporary Password: $TEMP_PASSWORD"
            print_warning "User must change password on first login"
            
            # Add user to Admin group
            print_info "Adding user to Admin group..."
            aws cognito-idp admin-add-user-to-group \
                --user-pool-id "$USER_POOL_ID" \
                --username "$ADMIN_EMAIL" \
                --group-name Admin \
                --region "$AWS_REGION"
            
            print_success "User added to Admin group"
        else
            print_warning "User may already exist or creation failed"
        fi
    fi
else
    print_info "Skipping Cognito user creation"
fi

# Trigger initial Knowledge Base sync
if [[ "$SKIP_KB_SYNC" == false ]] && [[ -n "$KB_ID" ]]; then
    print_info "Triggering initial Knowledge Base sync..."
    print_warning "This will start ingestion jobs for all data sources. The process may take 30-60 minutes to complete."
    
    # Get data source IDs from stack outputs
    WEB_DATA_SOURCE_IDS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='WebDataSourceIds'].OutputValue" \
        --output text \
        --region "$AWS_REGION" 2>/dev/null)
    
    PDF_DATA_SOURCE_ID=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='PDFDataSourceId'].OutputValue" \
        --output text \
        --region "$AWS_REGION" 2>/dev/null)
    
    PODCAST_DATA_SOURCE_ID=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='PodcastDataSourceId'].OutputValue" \
        --output text \
        --region "$AWS_REGION" 2>/dev/null)
    
    # Start ingestion jobs for web crawlers
    if [[ -n "$WEB_DATA_SOURCE_IDS" ]]; then
        IFS=',' read -ra DATA_SOURCE_ARRAY <<< "$WEB_DATA_SOURCE_IDS"
        for DATA_SOURCE_ID in "${DATA_SOURCE_ARRAY[@]}"; do
            print_info "Starting ingestion job for web data source: $DATA_SOURCE_ID"
            aws bedrock-agent start-ingestion-job \
                --knowledge-base-id "$KB_ID" \
                --data-source-id "$DATA_SOURCE_ID" \
                --region "$AWS_REGION" 2>/dev/null || print_warning "Failed to start ingestion job for $DATA_SOURCE_ID"
        done
    fi
    
    # Start ingestion job for PDFs (may be empty initially)
    if [[ -n "$PDF_DATA_SOURCE_ID" ]]; then
        print_info "Starting ingestion job for PDF data source: $PDF_DATA_SOURCE_ID"
        aws bedrock-agent start-ingestion-job \
            --knowledge-base-id "$KB_ID" \
            --data-source-id "$PDF_DATA_SOURCE_ID" \
            --region "$AWS_REGION" 2>/dev/null || print_warning "PDF data source may be empty"
    fi
    
    # Start ingestion job for podcasts (may be empty initially)
    if [[ -n "$PODCAST_DATA_SOURCE_ID" ]]; then
        print_info "Starting ingestion job for podcast data source: $PODCAST_DATA_SOURCE_ID"
        aws bedrock-agent start-ingestion-job \
            --knowledge-base-id "$KB_ID" \
            --data-source-id "$PODCAST_DATA_SOURCE_ID" \
            --region "$AWS_REGION" 2>/dev/null || print_warning "Podcast data source may be empty"
    fi
    
    print_success "Knowledge Base sync jobs started"
    print_info "Monitor sync progress in AWS Console: Bedrock > Knowledge Bases > $KB_ID"
else
    print_info "Skipping Knowledge Base sync"
fi

# Final summary
echo ""
print_success "=========================================="
print_success "Deployment Complete!"
print_success "=========================================="
print_info "Environment: $ENVIRONMENT"
print_info "Region: $AWS_REGION"
echo ""
print_info "Next Steps:"
print_info "1. Wait for Knowledge Base sync to complete (30-60 minutes)"
print_info "2. Test the Chat Function URL with a sample query"
print_info "3. Log in to the Admin Dashboard with the created user"
if [[ -n "$AMPLIFY_URL" ]]; then
    print_info "4. Access the frontend at: $AMPLIFY_URL"
fi
print_info "5. Review CloudWatch logs for any errors"
echo ""
print_info "For troubleshooting, see: docs/deploymentGuide.md"
print_success "=========================================="
