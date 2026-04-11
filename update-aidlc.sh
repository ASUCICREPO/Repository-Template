#!/bin/bash
set -e

# Update AI-DLC rules from the latest GitHub release
# Your custom extensions (e.g., extensions/asu-cic/) are preserved

REPO="awslabs/aidlc-workflows"
TMP_DIR=$(mktemp -d)
ZIP_PATH="$TMP_DIR/aidlc-rules.zip"
EXTRACT_DIR="$TMP_DIR/extract"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "Fetching latest release info..."
ZIP_URL=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | python3 -c "import sys,json; print([a['browser_download_url'] for a in json.load(sys.stdin)['assets'] if 'ai-dlc-rules' in a['name']][0])")
VERSION=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | python3 -c "import sys,json; print(json.load(sys.stdin)['tag_name'])")

echo "Downloading AI-DLC $VERSION..."
curl -sL "$ZIP_URL" -o "$ZIP_PATH"

echo "Extracting..."
mkdir -p "$EXTRACT_DIR"
unzip -qo "$ZIP_PATH" -d "$EXTRACT_DIR"

SRC="$EXTRACT_DIR/aidlc-rules"

echo "Updating core steering rules..."
cp -R "$SRC/aws-aidlc-rules/"* "$PROJECT_ROOT/.kiro/steering/aws-aidlc-rules/"

echo "Updating rule details (preserving custom extensions)..."
for dir in common inception construction operations; do
  if [ -d "$SRC/aws-aidlc-rule-details/$dir" ]; then
    mkdir -p "$PROJECT_ROOT/.kiro/aws-aidlc-rule-details/$dir"
    cp -R "$SRC/aws-aidlc-rule-details/$dir/"* "$PROJECT_ROOT/.kiro/aws-aidlc-rule-details/$dir/"
  fi
done

echo "Updating upstream extensions only..."
for ext_dir in "$SRC/aws-aidlc-rule-details/extensions/"*/; do
  ext_name=$(basename "$ext_dir")
  mkdir -p "$PROJECT_ROOT/.kiro/aws-aidlc-rule-details/extensions/$ext_name"
  cp -R "$ext_dir"* "$PROJECT_ROOT/.kiro/aws-aidlc-rule-details/extensions/$ext_name/"
  echo "  Updated extension: $ext_name"
done

echo "Cleaning up..."
rm -rf "$TMP_DIR"

echo ""
echo "AI-DLC updated to $VERSION"
echo "Your custom extensions are untouched."
