#!/bin/bash
# Pre-install MCP server dependencies to prevent Kiro connection timeouts.
#
# Some MCP servers (aws-iac-mcp-server, cloudwatch-mcp-server) have heavy
# Python dependencies (~90 packages) that uvx installs on first run. This
# installation takes longer than Kiro's MCP connection timeout, causing the
# server to fail on first startup. Running this script pre-warms the uvx
# package cache so servers start quickly when Kiro connects.
#
# This is a workaround — once these servers ship lighter or Kiro supports
# longer connection timeouts, this script can be removed.
#
# Usage: ./setup-tools.sh

set -e

echo "=== CIC Repository Template — Tool Setup ==="
echo ""

# Check prerequisites
command -v uvx >/dev/null 2>&1 || { echo "❌ uvx not found. Install uv first: https://docs.astral.sh/uv/getting-started/installation/"; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ npx not found. Install Node.js first: https://nodejs.org/"; exit 1; }

echo "✅ Prerequisites found (uvx, npx)"
echo ""

# Pre-warm uvx package caches for MCP servers that have heavy dependencies.
# This prevents Kiro MCP connection timeouts on first startup.
echo "Pre-installing MCP server packages (this may take a few minutes on first run)..."
echo ""

echo "  → aws-diagram-mcp-server..."
uvx awslabs.aws-diagram-mcp-server@latest --help >/dev/null 2>&1 || true
echo "    ✅ cached"

echo "  → mcp-server-fetch..."
uvx mcp-server-fetch --help >/dev/null 2>&1 || true
echo "    ✅ cached"

echo ""
echo "=== Optional: Pre-install Power dependencies ==="
echo "If you plan to use AWS Powers, pre-install their MCP servers too."
echo "These are the ones most likely to timeout on first Kiro connection."
echo ""

read -p "Pre-install aws-iac-mcp-server (CDK best practices)? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "  → aws-iac-mcp-server (this one is large, ~90 packages)..."
  uvx awslabs.aws-iac-mcp-server@latest --help >/dev/null 2>&1 || true
  echo "    ✅ cached"
fi

read -p "Pre-install cloudwatch-mcp-server (AWS observability)? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "  → cloudwatch-mcp-server..."
  uvx awslabs.cloudwatch-mcp-server@latest --help >/dev/null 2>&1 || true
  echo "    ✅ cached"
fi

read -p "Pre-install aws-documentation-mcp-server? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "  → aws-documentation-mcp-server..."
  uvx awslabs.aws-documentation-mcp-server@latest --help >/dev/null 2>&1 || true
  echo "    ✅ cached"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Open this project in Kiro"
echo "  2. Install recommended Powers from the Powers panel (aws-infrastructure-as-code, etc.)"
echo "  3. Run the 'Validate CIC Tools' hook to verify everything is configured"
echo ""
