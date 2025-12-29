/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { BrowserAutomationService } from '../browserAutomationService';
import { WaitForSelectorOptions, NavigationOptions } from '../automationTypes';

export function registerEvaluationCommands(
	context: vscode.ExtensionContext,
	automationService: BrowserAutomationService
) {
	// Evaluate JavaScript
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'simpleBrowser.automation.evaluate',
			async (sessionId?: string, script?: string) => {
				if (!sessionId) {
					sessionId = automationService.getActiveSessionId();
					if (!sessionId) {
						return { success: false, error: 'No active session' };
					}
				}
				if (!script) {
					script = await vscode.window.showInputBox({
						prompt: 'Enter JavaScript to evaluate',
						placeHolder: 'document.title'
					});
					if (!script) {
						return { success: false, error: 'No script provided' };
					}
				}
				return automationService.evaluate(sessionId, script);
			}
		)
	);

	// Wait for selector
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'simpleBrowser.automation.waitForSelector',
			async (sessionId?: string, selector?: string, options?: WaitForSelectorOptions) => {
				if (!sessionId) {
					sessionId = automationService.getActiveSessionId();
					if (!sessionId) {
						return { success: false, error: 'No active session' };
					}
				}
				if (!selector) {
					selector = await vscode.window.showInputBox({
						prompt: 'Enter CSS selector to wait for',
						placeHolder: '.results'
					});
					if (!selector) {
						return { success: false, error: 'No selector provided' };
					}
				}
				return automationService.waitForSelector(sessionId, selector, options);
			}
		)
	);

	// Wait for navigation
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'simpleBrowser.automation.waitForNavigation',
			async (sessionId?: string, options?: NavigationOptions) => {
				if (!sessionId) {
					sessionId = automationService.getActiveSessionId();
					if (!sessionId) {
						return { success: false, error: 'No active session' };
					}
				}
				return automationService.waitForNavigation(sessionId, options);
			}
		)
	);
}
