#!/usr/bin/env node
/**
 * HyperZ MCP Server — CLI Entry Point
 *
 * Usage:
 *   npx tsx bin/hyperz-mcp.ts          # Start with stdio transport (for Claude Desktop, Cursor, etc.)
 *   npx tsx bin/hyperz-mcp.ts --http   # Start with Streamable HTTP transport (for web agents)
 *
 * Configuration for Claude Desktop (claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "hyperz": {
 *         "command": "npx",
 *         "args": ["tsx", "bin/hyperz-mcp.ts"],
 *         "cwd": "/path/to/your/hyperz/project"
 *       }
 *     }
 *   }
 */

import { startStdioServer } from '../src/mcp/MCPServer.js';

const args = process.argv.slice(2);

if (args.includes('--http')) {
    console.log('⚡ HyperZ MCP Server — Streamable HTTP mode');
    console.log('   HTTP transport is integrated into the main server at /mcp');
    console.log('   Start the main server: npm run dev');
    process.exit(0);
}

// Default: stdio transport
startStdioServer().catch((err) => {
    console.error('Failed to start MCP server:', err);
    process.exit(1);
});
