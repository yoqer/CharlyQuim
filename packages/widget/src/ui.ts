import type { WidgetConfig, Message, ConversationMode } from '@ai-feedback-widget/shared';
import { styles } from './styles';

interface UICallbacks {
  onOpen: () => void;
  onClose: () => void;
  onModeSelect: (mode: ConversationMode) => void;
  onMessageSend: (content: string) => void;
  onEndConversation: () => void;
}

export class WidgetUI {
  private config: WidgetConfig;
  private callbacks: UICallbacks;
  private container: HTMLDivElement;
  private chatPanel: HTMLDivElement;
  private messagesContainer: HTMLDivElement;
  private inputField: HTMLTextAreaElement;
  private modeSelector: HTMLDivElement;
  private currentMode: ConversationMode | null = null;

  constructor(config: WidgetConfig, callbacks: UICallbacks) {
    this.config = config;
    this.callbacks = callbacks;

    // Inject styles
    this.injectStyles();

    // Create widget container
    this.container = this.createContainer();
    document.body.appendChild(this.container);

    // Create chat panel
    this.chatPanel = this.createChatPanel();
    this.container.appendChild(this.chatPanel);

    // Create mode selector
    this.modeSelector = this.createModeSelector();
    this.chatPanel.appendChild(this.modeSelector);

    // Create messages container
    this.messagesContainer = this.createMessagesContainer();

    // Create input field
    this.inputField = this.createInputField();
  }

  private injectStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles(this.config.primaryColor!);
    document.head.appendChild(styleSheet);
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'ai-widget-container';
    container.dataset.position = this.config.position;

    // Create floating button
    const button = document.createElement('button');
    button.className = 'ai-widget-button';
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    button.addEventListener('click', () => this.callbacks.onOpen());
    container.appendChild(button);

    return container;
  }

  private createChatPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'ai-widget-panel';
    panel.style.display = 'none';

    // Header
    const header = document.createElement('div');
    header.className = 'ai-widget-header';
    header.innerHTML = `
      <div class="ai-widget-header-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Support</span>
      </div>
      <button class="ai-widget-close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    const closeButton = header.querySelector('.ai-widget-close') as HTMLButtonElement;
    closeButton.addEventListener('click', () => this.callbacks.onClose());

    panel.appendChild(header);

    return panel;
  }

  private createModeSelector(): HTMLDivElement {
    const selector = document.createElement('div');
    selector.className = 'ai-widget-mode-selector';
    selector.innerHTML = `
      <h3>How can we help?</h3>
      <div class="ai-widget-mode-options">
        <button class="ai-widget-mode-option" data-mode="documentation">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>Ask a question</span>
        </button>
        <button class="ai-widget-mode-option" data-mode="bug_report">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="8" y="6" width="8" height="12" rx="1"></rect>
            <path d="M15 6v-2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2"></path>
            <path d="M3 6h18"></path>
          </svg>
          <span>Report a bug</span>
        </button>
        <button class="ai-widget-mode-option" data-mode="feedback">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span>Give feedback</span>
        </button>
      </div>
    `;

    const options = selector.querySelectorAll('.ai-widget-mode-option');
    options.forEach((option) => {
      option.addEventListener('click', () => {
        const mode = (option as HTMLElement).dataset.mode as ConversationMode;
        this.currentMode = mode;
        this.callbacks.onModeSelect(mode);
      });
    });

    return selector;
  }

  private createMessagesContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'ai-widget-messages';
    return container;
  }

  private createInputField(): HTMLTextAreaElement {
    const inputContainer = document.createElement('div');
    inputContainer.className = 'ai-widget-input-container';

    const textarea = document.createElement('textarea');
    textarea.className = 'ai-widget-input';
    textarea.placeholder = 'Type your message...';
    textarea.rows = 1;

    const sendButton = document.createElement('button');
    sendButton.className = 'ai-widget-send';
    sendButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    `;

    sendButton.addEventListener('click', () => this.handleSend());

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Auto-resize textarea
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });

    inputContainer.appendChild(textarea);
    inputContainer.appendChild(sendButton);

    return textarea;
  }

  private handleSend() {
    const content = this.inputField.value.trim();
    if (!content) return;

    // Add user message to UI immediately
    this.addUserMessage(content);

    // Send to backend
    this.callbacks.onMessageSend(content);

    // Clear input
    this.inputField.value = '';
    this.inputField.style.height = 'auto';
  }

  private addUserMessage(content: string) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-widget-message ai-widget-message-user';
    messageDiv.innerHTML = `
      <div class="ai-widget-message-content">${this.escapeHtml(content)}</div>
    `;
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  addMessage(message: Message) {
    if (message.role === 'user') {
      // User messages are added immediately in handleSend
      return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-widget-message ai-widget-message-assistant';
    messageDiv.innerHTML = `
      <div class="ai-widget-message-avatar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="4"></circle>
        </svg>
      </div>
      <div class="ai-widget-message-content">${this.escapeHtml(message.content)}</div>
    `;
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  showChat() {
    // Hide mode selector
    this.modeSelector.style.display = 'none';

    // Show messages and input
    this.chatPanel.appendChild(this.messagesContainer);
    this.chatPanel.appendChild(this.inputField.parentElement!);

    // Focus input
    setTimeout(() => this.inputField.focus(), 100);
  }

  show() {
    this.chatPanel.style.display = 'flex';
  }

  hide() {
    this.chatPanel.style.display = 'none';
  }

  reset() {
    this.currentMode = null;
    this.messagesContainer.innerHTML = '';
    this.inputField.value = '';
    this.modeSelector.style.display = 'block';
    if (this.messagesContainer.parentElement) {
      this.chatPanel.removeChild(this.messagesContainer);
    }
    if (this.inputField.parentElement?.parentElement) {
      this.chatPanel.removeChild(this.inputField.parentElement);
    }
  }

  updatePrimaryColor(color: string) {
    const root = document.documentElement;
    root.style.setProperty('--ai-widget-primary', color);
  }

  showError(error: string) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'ai-widget-error';
    errorDiv.textContent = error;
    this.messagesContainer.appendChild(errorDiv);
    this.scrollToBottom();

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  private scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
