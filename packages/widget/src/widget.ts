import type { WidgetConfig, ConversationMode } from '@ai-feedback-widget/shared';
import { WidgetUI } from './ui';
import { WebSocketClient } from './websocket-client';

export class Widget {
  private config: WidgetConfig;
  private ui: WidgetUI;
  private ws: WebSocketClient;
  private isOpen = false;

  constructor(config: WidgetConfig) {
    this.config = {
      position: 'bottom-right',
      primaryColor: '#3b82f6',
      ...config,
    };

    this.ui = new WidgetUI(this.config, {
      onOpen: () => this.handleOpen(),
      onClose: () => this.handleClose(),
      onModeSelect: (mode) => this.handleModeSelect(mode),
      onMessageSend: (content) => this.handleMessageSend(content),
      onEndConversation: () => this.handleEndConversation(),
    });

    this.ws = new WebSocketClient(this.config.apiUrl, {
      onMessage: (message) => this.ui.addMessage(message),
      onReady: () => console.log('Widget ready'),
      onError: (error) => this.ui.showError(error),
    });

    this.initialize();
  }

  private async initialize() {
    try {
      // Fetch bot configuration
      const response = await fetch(`${this.config.apiUrl}/api/bots/${this.config.botId}`);
      if (!response.ok) {
        throw new Error('Failed to load bot configuration');
      }

      const botConfig = await response.json();

      // Update UI with bot configuration
      if (botConfig.appearance?.primaryColor) {
        this.config.primaryColor = botConfig.appearance.primaryColor;
        this.ui.updatePrimaryColor(botConfig.appearance.primaryColor);
      }

      // Initialize WebSocket
      this.ws.connect(this.config.botId);
    } catch (error) {
      console.error('Failed to initialize widget:', error);
      this.ui.showError('Failed to initialize chat widget');
    }
  }

  private handleOpen() {
    this.isOpen = true;
    this.ui.show();
  }

  private handleClose() {
    this.isOpen = false;
    this.ui.hide();
  }

  private handleModeSelect(mode: ConversationMode) {
    this.ws.startConversation(mode);
    this.ui.showChat();
  }

  private handleMessageSend(content: string) {
    this.ws.sendMessage(content);
  }

  private handleEndConversation() {
    this.ws.endConversation();
    this.ui.reset();
  }
}
