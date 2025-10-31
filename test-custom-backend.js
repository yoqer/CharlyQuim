#!/usr/bin/env node

/**
 * Quick Test Script for Custom Backend Integration
 *
 * This script helps you test your backend API independently before integrating with Void.
 *
 * Usage:
 *   node test-custom-backend.js
 *
 * Or make it executable:
 *   chmod +x test-custom-backend.js
 *   ./test-custom-backend.js
 */

// ============================================================================
// CONFIGURATION - Edit these values to match your backend
// ============================================================================

const CONFIG = {
	endpoint: 'http://localhost:8000',  // Your backend URL
	apiKey: 'your-api-key-here',         // Your API key
	model: 'your-model-name',            // Model to use
	chatPath: '/v1/chat/completions',    // Chat endpoint path
	modelsPath: '/v1/models',            // Models list endpoint path
	stream: true,                         // Test streaming?
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

/**
 * Test 1: Check if backend is reachable
 */
async function testConnection() {
	console.log('\n📡 Test 1: Testing connection to backend...');
	console.log(`   Endpoint: ${CONFIG.endpoint}`);

	try {
		const response = await fetch(CONFIG.endpoint, {
			method: 'GET',
		});

		console.log(`   ✅ Backend is reachable (Status: ${response.status})`);
		return true;
	} catch (error) {
		console.log(`   ❌ Cannot reach backend: ${error.message}`);
		return false;
	}
}

/**
 * Test 2: List available models
 */
async function testListModels() {
	console.log('\n📋 Test 2: Fetching available models...');

	try {
		const response = await fetch(`${CONFIG.endpoint}${CONFIG.modelsPath}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${CONFIG.apiKey}`,
			},
		});

		if (!response.ok) {
			console.log(`   ⚠️  Models endpoint returned ${response.status}`);
			const text = await response.text();
			console.log(`   Response: ${text}`);
			return false;
		}

		const data = await response.json();
		console.log(`   ✅ Successfully fetched models`);
		console.log(`   Available models:`, data);
		return true;
	} catch (error) {
		console.log(`   ⚠️  Could not fetch models: ${error.message}`);
		return false;
	}
}

/**
 * Test 3: Send a simple chat message (non-streaming)
 */
async function testSimpleChat() {
	console.log('\n💬 Test 3: Sending simple chat message (non-streaming)...');

	const requestBody = {
		model: CONFIG.model,
		messages: [
			{ role: 'user', content: 'Say "Hello from custom backend!" and nothing else.' }
		],
		stream: false,
		max_tokens: 50,
	};

	console.log(`   Request:`, JSON.stringify(requestBody, null, 2));

	try {
		const response = await fetch(`${CONFIG.endpoint}${CONFIG.chatPath}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${CONFIG.apiKey}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const text = await response.text();
			console.log(`   ❌ Request failed (${response.status}): ${text}`);
			return false;
		}

		const data = await response.json();
		console.log(`   ✅ Response received:`);
		console.log(`   Full response:`, JSON.stringify(data, null, 2));

		// Try to extract the message content
		const content = data.choices?.[0]?.message?.content ||
			data.content ||
			data.message?.content ||
			'Could not find content in response';

		console.log(`   📝 Message content: "${content}"`);
		return true;
	} catch (error) {
		console.log(`   ❌ Error: ${error.message}`);
		return false;
	}
}

/**
 * Test 4: Send a streaming chat message
 */
async function testStreamingChat() {
	console.log('\n🌊 Test 4: Testing streaming chat...');

	if (!CONFIG.stream) {
		console.log('   ⏭️  Skipped (streaming disabled in config)');
		return true;
	}

	const requestBody = {
		model: CONFIG.model,
		messages: [
			{ role: 'user', content: 'Count from 1 to 5, each number on a new line.' }
		],
		stream: true,
		max_tokens: 50,
	};

	try {
		const response = await fetch(`${CONFIG.endpoint}${CONFIG.chatPath}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${CONFIG.apiKey}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const text = await response.text();
			console.log(`   ❌ Request failed (${response.status}): ${text}`);
			return false;
		}

		console.log(`   ✅ Streaming response started...`);
		console.log(`   📝 Streamed content:`);
		process.stdout.write('   ');

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let chunkCount = 0;

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				const trimmedLine = line.trim();
				if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

				const dataStr = trimmedLine.slice(6);
				if (dataStr === '[DONE]') continue;

				try {
					const data = JSON.parse(dataStr);
					const content = data.choices?.[0]?.delta?.content ||
						data.delta?.content ||
						data.content;

					if (content) {
						process.stdout.write(content);
						chunkCount++;
					}
				} catch (e) {
					// Ignore parse errors for non-JSON lines
				}
			}
		}

		console.log(`\n   ✅ Streaming completed (${chunkCount} chunks received)`);
		return true;
	} catch (error) {
		console.log(`\n   ❌ Error: ${error.message}`);
		return false;
	}
}

/**
 * Test 5: Test with conversation history
 */
async function testConversation() {
	console.log('\n💭 Test 5: Testing conversation with history...');

	const requestBody = {
		model: CONFIG.model,
		messages: [
			{ role: 'user', content: 'My favorite color is blue.' },
			{ role: 'assistant', content: 'That\'s a nice color!' },
			{ role: 'user', content: 'What is my favorite color?' }
		],
		stream: false,
		max_tokens: 50,
	};

	try {
		const response = await fetch(`${CONFIG.endpoint}${CONFIG.chatPath}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${CONFIG.apiKey}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const text = await response.text();
			console.log(`   ❌ Request failed (${response.status}): ${text}`);
			return false;
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content ||
			data.content ||
			'Could not find content';

		console.log(`   📝 Response: "${content}"`);

		if (content.toLowerCase().includes('blue')) {
			console.log(`   ✅ Model correctly remembered the conversation!`);
			return true;
		} else {
			console.log(`   ⚠️  Model did not mention 'blue' - conversation context might not be working`);
			return false;
		}
	} catch (error) {
		console.log(`   ❌ Error: ${error.message}`);
		return false;
	}
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
	console.log('═══════════════════════════════════════════════════');
	console.log('🧪 Custom Backend Integration Test Suite');
	console.log('═══════════════════════════════════════════════════');

	const results = {
		connection: false,
		models: false,
		simpleChat: false,
		streaming: false,
		conversation: false,
	};

	// Run tests sequentially
	results.connection = await testConnection();

	if (results.connection) {
		results.models = await testListModels();
		results.simpleChat = await testSimpleChat();
		results.streaming = await testStreamingChat();
		results.conversation = await testConversation();
	} else {
		console.log('\n⚠️  Skipping remaining tests (backend not reachable)');
	}

	// Print summary
	console.log('\n═══════════════════════════════════════════════════');
	console.log('📊 Test Summary');
	console.log('═══════════════════════════════════════════════════');
	console.log(`   Connection:     ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
	console.log(`   List Models:    ${results.models ? '✅ PASS' : '⚠️  SKIP/FAIL'}`);
	console.log(`   Simple Chat:    ${results.simpleChat ? '✅ PASS' : '❌ FAIL'}`);
	console.log(`   Streaming:      ${results.streaming ? '✅ PASS' : '⚠️  SKIP/FAIL'}`);
	console.log(`   Conversation:   ${results.conversation ? '✅ PASS' : '❌ FAIL'}`);

	const passedCount = Object.values(results).filter(Boolean).length;
	const totalCount = Object.keys(results).length;

	console.log(`\n   Total: ${passedCount}/${totalCount} tests passed`);

	if (results.connection && results.simpleChat) {
		console.log('\n✅ Your backend is ready to integrate with Void!');
		console.log('\nNext steps:');
		console.log('1. Follow the instructions in CUSTOM_BACKEND_INTEGRATION_GUIDE.md');
		console.log('2. Copy code from CUSTOM_BACKEND_EXAMPLE.ts into the Void source');
		console.log('3. Run: npm run buildreact && npm run compile');
		console.log('4. Launch Void: ./scripts/code.sh');
	} else {
		console.log('\n⚠️  Please fix the failing tests before integrating with Void.');
		console.log('\nTroubleshooting tips:');
		console.log('- Check that your backend is running');
		console.log('- Verify the endpoint URL is correct');
		console.log('- Verify the API key is valid');
		console.log('- Check your backend logs for errors');
		console.log('- Test with curl first:');
		console.log(`  curl -X POST ${CONFIG.endpoint}${CONFIG.chatPath} \\`);
		console.log(`    -H "Authorization: Bearer ${CONFIG.apiKey}" \\`);
		console.log(`    -H "Content-Type: application/json" \\`);
		console.log(`    -d '{"model":"${CONFIG.model}","messages":[{"role":"user","content":"hello"}]}'`);
	}

	console.log('\n═══════════════════════════════════════════════════');
}

// Run the tests
runAllTests().catch(error => {
	console.error('\n💥 Unexpected error:', error);
	process.exit(1);
});

