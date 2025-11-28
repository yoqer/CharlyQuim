export const styles = (primaryColor: string) => `
  :root {
    --ai-widget-primary: ${primaryColor};
    --ai-widget-text: #1f2937;
    --ai-widget-text-light: #6b7280;
    --ai-widget-bg: #ffffff;
    --ai-widget-bg-light: #f9fafb;
    --ai-widget-border: #e5e7eb;
    --ai-widget-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .ai-widget-container {
    position: fixed;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  .ai-widget-container[data-position="bottom-right"] {
    bottom: 20px;
    right: 20px;
  }

  .ai-widget-container[data-position="bottom-left"] {
    bottom: 20px;
    left: 20px;
  }

  .ai-widget-button {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--ai-widget-primary);
    border: none;
    color: white;
    cursor: pointer;
    box-shadow: var(--ai-widget-shadow);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .ai-widget-button:hover {
    transform: scale(1.05);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
  }

  .ai-widget-button:active {
    transform: scale(0.95);
  }

  .ai-widget-panel {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 380px;
    max-width: calc(100vw - 40px);
    height: 600px;
    max-height: calc(100vh - 120px);
    background: var(--ai-widget-bg);
    border-radius: 12px;
    box-shadow: var(--ai-widget-shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ai-widget-container[data-position="bottom-left"] .ai-widget-panel {
    left: 0;
    right: auto;
  }

  .ai-widget-header {
    background: var(--ai-widget-primary);
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ai-widget-header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 16px;
  }

  .ai-widget-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;
    transition: opacity 0.2s;
  }

  .ai-widget-close:hover {
    opacity: 1;
  }

  .ai-widget-mode-selector {
    padding: 30px 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .ai-widget-mode-selector h3 {
    margin: 0;
    font-size: 20px;
    color: var(--ai-widget-text);
  }

  .ai-widget-mode-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ai-widget-mode-option {
    background: var(--ai-widget-bg-light);
    border: 2px solid var(--ai-widget-border);
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s;
    text-align: left;
  }

  .ai-widget-mode-option:hover {
    border-color: var(--ai-widget-primary);
    background: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .ai-widget-mode-option svg {
    color: var(--ai-widget-primary);
    flex-shrink: 0;
  }

  .ai-widget-mode-option span {
    font-size: 15px;
    font-weight: 500;
    color: var(--ai-widget-text);
  }

  .ai-widget-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ai-widget-message {
    display: flex;
    gap: 8px;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ai-widget-message-user {
    justify-content: flex-end;
  }

  .ai-widget-message-assistant {
    justify-content: flex-start;
  }

  .ai-widget-message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--ai-widget-bg-light);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--ai-widget-primary);
  }

  .ai-widget-message-content {
    max-width: 70%;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.5;
    word-wrap: break-word;
  }

  .ai-widget-message-user .ai-widget-message-content {
    background: var(--ai-widget-primary);
    color: white;
    border-bottom-right-radius: 4px;
  }

  .ai-widget-message-assistant .ai-widget-message-content {
    background: var(--ai-widget-bg-light);
    color: var(--ai-widget-text);
    border-bottom-left-radius: 4px;
  }

  .ai-widget-input-container {
    border-top: 1px solid var(--ai-widget-border);
    padding: 16px 20px;
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }

  .ai-widget-input {
    flex: 1;
    border: 1px solid var(--ai-widget-border);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    min-height: 40px;
    max-height: 120px;
    outline: none;
    transition: border-color 0.2s;
  }

  .ai-widget-input:focus {
    border-color: var(--ai-widget-primary);
  }

  .ai-widget-send {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--ai-widget-primary);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }

  .ai-widget-send:hover {
    opacity: 0.9;
  }

  .ai-widget-send:active {
    transform: scale(0.95);
  }

  .ai-widget-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
  }

  /* Mobile responsiveness */
  @media (max-width: 480px) {
    .ai-widget-panel {
      width: calc(100vw - 40px);
      height: calc(100vh - 100px);
      bottom: 70px;
    }

    .ai-widget-button {
      width: 56px;
      height: 56px;
    }
  }
`;
