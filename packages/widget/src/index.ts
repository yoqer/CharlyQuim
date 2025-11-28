/**
 * AI Feedback Widget
 *
 * Usage:
 * <script src="widget.js"></script>
 * <script>
 *   AIFeedbackWidget.init({
 *     botId: 'your-bot-id',
 *     apiUrl: 'http://localhost:3000'
 *   });
 * </script>
 */

import type { WidgetConfig } from '@ai-feedback-widget/shared';
import { Widget } from './widget';

// Global namespace
declare global {
  interface Window {
    AIFeedbackWidget: {
      init: (config: WidgetConfig) => void;
    };
  }
}

window.AIFeedbackWidget = {
  init: (config: WidgetConfig) => {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        new Widget(config);
      });
    } else {
      new Widget(config);
    }
  },
};
