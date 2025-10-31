/*--------------------------------------------------------------------------------------
 *  Example Custom Backend Integration for Void
 *
 *  This file shows how to integrate your own backend API with Void.
 *  Copy the relevant parts into the actual Void source files as described in
 *  CUSTOM_BACKEND_INTEGRATION_GUIDE.md
 *--------------------------------------------------------------------------------------*/

// ============================================================================
// STEP 1: Add to voidSettingsTypes.ts
// ============================================================================

// Add 'customBackend' to the ProviderName type
export type ProviderName =
	| 'customBackend'  // <-- Add this
	| 'anthropic'
// ... other providers

// Add your backend's configuration
export type SettingsOfProvider = {
	customBackend: {
		apiKey: string;
		endpoint: string;  // e.g., 'https://api.yourdomain.com'
		// Add any other config fields you need:
		// organization?: string;
		// customHeaders?: Record<string, string>;
	}
	// ... other providers
}

// Add display information for the UI
const displayInfoMap = {
	customBackend: {
		title: 'My Custom Backend',
		canDoFIM: false,  // Set to true if you support Fill-In-Middle (autocomplete)
		needsAPIKey: true,
		requiresExternalToolSupport: false,
		docs: 'https://docs.yourdomain.com',  // Optional: link to your API docs
	},
	// ... other providers
}

// ============================================================================
// STEP 2: Add to sendLLMMessage.impl.ts
// ============================================================================

import { SendChatParams_Internal } from './sendLLMMessage.impl.js';

/**
 * Implementation for sending chat messages to your custom backend
 */
const sendCustomBackendChat = async ({
	messages,
	onText,
	onFinalMessage,
	onError,
	settingsOfProvider,
	modelName,
	_setAborter,
	mcpTools,
	separateSystemMessage,
	modelSelectionOptions,
}: SendChatParams_Internal) => {

	const config = settingsOfProvider.customBackend;

	// Validate configuration
	if (!config.endpoint) {
		onError({
			message: 'Custom Backend endpoint not configured. Please set it in Settings.',
			fullError: null
		});
		return;
	}

	if (!config.apiKey) {
		onError({
			message: 'Custom Backend API key not configured. Please set it in Settings.',
			fullError: null
		});
		return;
	}

	// Create abort controller for cancellation
	const controller = new AbortController();
	_setAborter(() => {
		controller.abort();
	});

	try {
		// Prepare the request payload
		// Adjust this structure to match YOUR backend's API
		const requestBody = {
			messages: messages,
			model: modelName,
			stream: true,  // Set to false if your backend doesn't support streaming

			// Optional: Include system message separately if your backend expects it
			...(separateSystemMessage && { system: separateSystemMessage }),

			// Optional: Include tools/functions
			...(mcpTools && mcpTools.length > 0 && { tools: mcpTools }),

			// Optional: Include model parameters
			...(modelSelectionOptions?.temperature !== undefined && {
				temperature: modelSelectionOptions.temperature
			}),
			...(modelSelectionOptions?.maxTokens !== undefined && {
				max_tokens: modelSelectionOptions.maxTokens
			}),
		};

		console.log('Sending request to custom backend:', config.endpoint);

		// Make the API request
		const response = await fetch(`${config.endpoint}/v1/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${config.apiKey}`,
				// Add any custom headers you need
			},
			body: JSON.stringify(requestBody),
			signal: controller.signal,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Backend returned ${response.status}: ${errorText}`);
		}

		// ===== STREAMING RESPONSE =====
		if (requestBody.stream) {
			const reader = response.body?.getReader();
			if (!reader) throw new Error('Response body is not readable');

			const decoder = new TextDecoder();
			let accumulatedText = '';
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || ''; // Keep incomplete line in buffer

				for (const line of lines) {
					const trimmedLine = line.trim();

					// Skip empty lines
					if (!trimmedLine) continue;

					// Handle SSE format: "data: {...}"
					if (trimmedLine.startsWith('data: ')) {
						const dataStr = trimmedLine.slice(6); // Remove "data: " prefix

						// Handle "[DONE]" signal
						if (dataStr === '[DONE]') {
							break;
						}

						try {
							const data = JSON.parse(dataStr);

							// ADJUST THIS BASED ON YOUR BACKEND'S RESPONSE FORMAT
							// Example for OpenAI-compatible format:
							if (data.choices?.[0]?.delta?.content) {
								const newText = data.choices[0].delta.content;
								accumulatedText += newText;
								onText({ newText, fullText: accumulatedText });
							}

							// Handle tool calls (if your backend supports them)
							if (data.choices?.[0]?.delta?.tool_calls) {
								const toolCalls = data.choices[0].delta.tool_calls;
								for (const toolCall of toolCalls) {
									if (toolCall.function) {
										onText({
											toolCall: {
												idx: toolCall.index,
												name: toolCall.function.name,
												params: toolCall.function.arguments,
											}
										});
									}
								}
							}

						} catch (parseError) {
							console.warn('Failed to parse SSE data:', dataStr, parseError);
						}
					}
				}
			}

			// Send final message
			onFinalMessage({ fullText: accumulatedText });
		}
		// ===== NON-STREAMING RESPONSE =====
		else {
			const data = await response.json();

			// ADJUST THIS BASED ON YOUR BACKEND'S RESPONSE FORMAT
			const fullText = data.choices?.[0]?.message?.content || data.content || '';

			onText({ newText: fullText, fullText });
			onFinalMessage({ fullText });
		}

	} catch (error: any) {
		if (error.name === 'AbortError') {
			console.log('Custom backend request aborted');
			onError({ message: 'Request cancelled', fullError: error });
		} else {
			console.error('Custom backend error:', error);
			onError({
				message: error.message || 'Unknown error occurred',
				fullError: error
			});
		}
	}
};

// Add to the provider implementations object
export const sendLLMMessageToProviderImplementation = {
	// ... existing providers
	customBackend: {
		sendChat: sendCustomBackendChat,
		sendFIM: null,  // Implement if you support Fill-In-Middle
		list: null,     // Implement if you support listing models
	},
};

// ============================================================================
// STEP 3: Add to modelCapabilities.ts
// ============================================================================

export const getProviderCapabilities = (providerName: ProviderName) => {
	const map: Record<ProviderName, ProviderCapabilities> = {
		// ... existing providers
		customBackend: {
			doToolCalls: true,         // Set based on your backend's capabilities
			doReasoningEffort: false,  // Set to true if you support reasoning tokens (like o1)
			doStreaming: true,         // Set to true if you support streaming
		},
	}
	return map[providerName]
}

export const getModelCapabilities = (providerName: ProviderName, modelName: string) => {
	// ... existing logic

	if (providerName === 'customBackend') {
		// ADJUST THESE VALUES BASED ON YOUR MODELS
		return {
			maxInputTokens: 128000,      // Context window size
			maxOutputTokens: 8192,       // Max completion tokens
			supportsImages: false,       // Does your model support vision?
			supportsSystemMessage: true,
			contextType: 'long' as const,
		}
	}

	// ... rest of existing logic
}

export const defaultProviderSettings = {
	// ... existing providers
	customBackend: {
		apiKey: '',
		endpoint: 'http://localhost:8000',  // Default endpoint (e.g., for local dev)
	},
}

// ============================================================================
// OPTIONAL: Fill-In-Middle (FIM) for Autocomplete
// ============================================================================

/**
 * Implementation for Fill-In-Middle (autocomplete/inline suggestions)
 * Only needed if you want to support inline code completion
 */
const sendCustomBackendFIM = async ({
	messages,
	onText,
	onFinalMessage,
	onError,
	settingsOfProvider,
	modelName,
	_setAborter,
}: SendFIMParams_Internal) => {

	const config = settingsOfProvider.customBackend;
	const controller = new AbortController();
	_setAborter(() => controller.abort());

	try {
		const { prefix, suffix } = messages;

		const response = await fetch(`${config.endpoint}/v1/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${config.apiKey}`,
			},
			body: JSON.stringify({
				model: modelName,
				prompt: prefix,
				suffix: suffix,
				max_tokens: 256,
				temperature: 0.2,
				stream: false,
			}),
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error(`FIM request failed: ${response.status}`);
		}

		const data = await response.json();
		const completion = data.choices?.[0]?.text || '';

		onText({ newText: completion, fullText: completion });
		onFinalMessage({ fullText: completion });

	} catch (error: any) {
		onError({ message: error.message, fullError: error });
	}
};

// ============================================================================
// OPTIONAL: List Models
// ============================================================================

/**
 * Fetch available models from your backend
 * Used to populate the model dropdown in settings
 */
const customBackendListModels = async ({
	settingsOfProvider,
	onError,
}: ListParams_Internal<any>) => {

	const config = settingsOfProvider.customBackend;

	try {
		const response = await fetch(`${config.endpoint}/v1/models`, {
			headers: {
				'Authorization': `Bearer ${config.apiKey}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to list models: ${response.status}`);
		}

		const data = await response.json();

		// ADJUST THIS BASED ON YOUR BACKEND'S RESPONSE FORMAT
		// Return array of model names
		return data.data?.map((model: any) => model.id) || data.models || [];

	} catch (error: any) {
		onError({ message: error.message, fullError: error });
		return [];
	}
};

// ============================================================================
// EXAMPLE: Different Response Formats
// ============================================================================

/*
Example 1: OpenAI-Compatible Format
{
  "choices": [{
	"delta": {
	  "content": "Hello"
	}
  }]
}

Example 2: Simple Format
{
  "type": "text",
  "content": "Hello"
}

Example 3: Anthropic-Style Format
{
  "type": "content_block_delta",
  "delta": {
	"type": "text_delta",
	"text": "Hello"
  }
}

Adjust the parsing logic in sendCustomBackendChat to match YOUR format!
*/

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

/*
1. Copy relevant code snippets into the actual Void source files:
   - voidSettingsTypes.ts (Step 1)
   - sendLLMMessage.impl.ts (Step 2)
   - modelCapabilities.ts (Step 3)

2. Rebuild the React components:
   $ npm run buildreact

3. Compile TypeScript:
   $ npm run compile

4. Run Void:
   $ ./scripts/code.sh

5. In Void's Settings:
   - Select "My Custom Backend" as the provider
   - Enter your API key
   - Enter your backend endpoint
   - Select a model
   - Start chatting!

6. Debug:
   - Check the Developer Tools console (Help → Toggle Developer Tools)
   - Add console.log() statements in your implementation
   - Test your backend separately with curl first
*/

export { };

