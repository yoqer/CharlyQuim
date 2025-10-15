#!/usr/bin/env node

// Mock AI Server for CorteXIDE Testing
// This simulates a local AI model for testing the Chat → Edit → Diff → Apply loop

const http = require('http');
const url = require('url');

const PORT = 1234; // LM Studio default port

// Mock responses for different types of requests
const mockResponses = {
	// Chat completion response
	chat: {
		choices: [{
			message: {
				role: "assistant",
				content: "I'll help you edit that file. Let me make the requested changes."
			},
			finish_reason: "stop"
		}],
		usage: {
			prompt_tokens: 50,
			completion_tokens: 20,
			total_tokens: 70
		}
	},

	// Tool call response (for edit_file)
	toolCall: {
		choices: [{
			message: {
				role: "assistant",
				content: "I'll edit the file as requested.",
				tool_calls: [{
					id: "call_123",
					type: "function",
					function: {
						name: "edit_file",
						arguments: JSON.stringify({
							uri: "file:///Users/tajudeentajudeen/CodeBase/cortexide/test-file.js",
							searchReplaceBlocks: "function hello() {\n    console.log(\"Hello, CorteXIDE!\");\n}"
						})
					}
				}]
			},
			finish_reason: "tool_calls"
		}],
		usage: {
			prompt_tokens: 100,
			completion_tokens: 30,
			total_tokens: 130
		}
	}
};

const server = http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url, true);

	// Set CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	if (req.method === 'OPTIONS') {
		res.writeHead(200);
		res.end();
		return;
	}

	console.log(`${req.method} ${req.url}`);

	if (parsedUrl.pathname === '/v1/chat/completions') {
		let body = '';
		req.on('data', chunk => {
			body += chunk.toString();
		});

		req.on('end', () => {
			try {
				const requestData = JSON.parse(body);
				console.log('Request:', JSON.stringify(requestData, null, 2));

				// Check if this is a tool call request
				const hasTools = requestData.tools && requestData.tools.length > 0;
				const response = hasTools ? mockResponses.toolCall : mockResponses.chat;

				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(response));
			} catch (error) {
				console.error('Error parsing request:', error);
				res.writeHead(400, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Invalid JSON' }));
			}
		});
	} else if (parsedUrl.pathname === '/v1/models') {
		// Return available models
		const models = {
			object: "list",
			data: [
				{
					id: "mock-model",
					object: "model",
					created: Date.now(),
					owned_by: "cortexide-mock"
				}
			]
		};

		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(models));
	} else {
		res.writeHead(404, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'Not found' }));
	}
});

server.listen(PORT, () => {
	console.log(`🤖 Mock AI Server running on http://localhost:${PORT}`);
	console.log('📝 This simulates a local AI model for testing CorteXIDE');
	console.log('🔧 Configure CorteXIDE to use LM Studio provider with endpoint: http://localhost:1234');
	console.log('⏹️  Press Ctrl+C to stop');
});

server.on('error', (err) => {
	if (err.code === 'EADDRINUSE') {
		console.log(`❌ Port ${PORT} is already in use. Please stop any existing LM Studio server.`);
	} else {
		console.error('Server error:', err);
	}
});
