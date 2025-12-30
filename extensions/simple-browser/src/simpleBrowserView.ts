/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Disposable } from './dispose';
import { AutomationResult } from './automation/automationTypes';
import { generateSessionId } from './automation/utils';
import { buildHoverScript, buildPickScript, ElementBoundingBox, ElementSelectionHoverData, ElementSelectionPickData } from './automation/elementSelection';


export interface ShowOptions {
	readonly preserveFocus?: boolean;
	readonly viewColumn?: vscode.ViewColumn;
}

export class SimpleBrowserView extends Disposable {

	public static readonly viewType = 'simpleBrowser.view';
	private static readonly title = vscode.l10n.t("Simple Browser");

	private static getWebviewLocalResourceRoots(extensionUri: vscode.Uri): readonly vscode.Uri[] {
		return [
			vscode.Uri.joinPath(extensionUri, 'media')
		];
	}

	private static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
		return {
			enableScripts: true,
			enableForms: true,
			localResourceRoots: SimpleBrowserView.getWebviewLocalResourceRoots(extensionUri),
		};
	}

	private readonly _webviewPanel: vscode.WebviewPanel;
	private _isInitialized = false;

	private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());
	public readonly onDispose = this._onDidDispose.event;

	private currentUrl: string = '';

	// --- Element selection (Cursor-style) ---
	private elementSelectionSessionId: string | undefined;
	private elementSelectionViewport: { width: number; height: number } | undefined;
	private elementSelectionLastUrl: string | undefined;
	private elementSelectionHoverRequestId = 0;

	public static create(
		extensionUri: vscode.Uri,
		url: string,
		showOptions?: ShowOptions
	): SimpleBrowserView {
		const webview = vscode.window.createWebviewPanel(SimpleBrowserView.viewType, SimpleBrowserView.title, {
			viewColumn: showOptions?.viewColumn ?? vscode.ViewColumn.Active,
			preserveFocus: showOptions?.preserveFocus
		}, {
			retainContextWhenHidden: true,
			...SimpleBrowserView.getWebviewOptions(extensionUri)
		});
		return new SimpleBrowserView(extensionUri, url, webview);
	}

	public static restore(
		extensionUri: vscode.Uri,
		url: string,
		webviewPanel: vscode.WebviewPanel,
	): SimpleBrowserView {
		return new SimpleBrowserView(extensionUri, url, webviewPanel);
	}

	private constructor(
		private readonly extensionUri: vscode.Uri,
		url: string,
		webviewPanel: vscode.WebviewPanel,
	) {
		super();

		this._webviewPanel = this._register(webviewPanel);
		this._webviewPanel.webview.options = SimpleBrowserView.getWebviewOptions(extensionUri);

		this._register(this._webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'openExternal':
					try {
						const url = vscode.Uri.parse(e.url);
						vscode.env.openExternal(url);
					} catch {
						// Noop
					}
					break;
				case 'didNavigate':
					if (typeof e.url === 'string') {
						this.currentUrl = e.url;
						this.elementSelectionLastUrl = e.url;
					}
					break;
				case 'elementSelection.start':
					this.handleStartElementSelection(e).catch(err => {
						this._webviewPanel.webview.postMessage({ type: 'elementSelection.error', message: err instanceof Error ? err.message : String(err) });
					});
					break;
				case 'elementSelection.stop':
					this.closeElementSelectionSession().then(() => {
						this._webviewPanel.webview.postMessage({ type: 'elementSelection.stopped' });
					}, () => {
						this._webviewPanel.webview.postMessage({ type: 'elementSelection.stopped' });
					});
					break;
				case 'elementSelection.hover':
					this.handleElementSelectionHover(e).catch(() => {
						// Ignore hover errors to keep UI responsive
					});
					break;
				case 'elementSelection.pick':
					this.handleElementSelectionPick(e).catch(err => {
						this._webviewPanel.webview.postMessage({ type: 'elementSelection.error', message: err instanceof Error ? err.message : String(err) });
					});
					break;
				case 'elementSelection.scroll':
					this.handleElementSelectionScroll(e).catch(() => {
						// Ignore scroll errors; selection UI can retry
					});
					break;
			}
		}));

		this._register(this._webviewPanel.onDidDispose(() => {
			this.dispose();
		}));

		this._register(vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('simpleBrowser.focusLockIndicator.enabled')) {
				const configuration = vscode.workspace.getConfiguration('simpleBrowser');
				this._webviewPanel.webview.postMessage({
					type: 'didChangeFocusLockIndicatorEnabled',
					focusLockEnabled: configuration.get<boolean>('focusLockIndicator.enabled', true)
				});
			}
		}));

		this.show(url);
	}

	public override dispose() {
		this.closeElementSelectionSession().then(() => { }, () => { });
		this._onDidDispose.fire();
		super.dispose();
	}

	public show(url: string, options?: ShowOptions) {
		this.currentUrl = url;
		// Only regenerate HTML on first call
		if (!this._isInitialized) {
			this._webviewPanel.webview.html = this.getHtml(url);
			this._isInitialized = true;
		} else {
			// Navigate the iframe to new URL
			this._webviewPanel.webview.postMessage({
				type: 'navigate',
				url
			});
		}
		this._webviewPanel.reveal(options?.viewColumn, options?.preserveFocus);
	}

	/**
	 * Show automation activity overlay
	 * Disabled for production - no popups
	 */
	public showAutomationActivity(_action: string, _details?: string) {
		// Disabled to prevent distracting UI popups during automation
		// this._webviewPanel.webview.postMessage({
		// 	type: 'automation-activity',
		// 	action,
		// 	details
		// });
	}

	/**
	 * Sync with automation navigation
	 */
	public syncAutomationNavigation(url: string) {
		if (url && url !== this.currentUrl) {
			this.show(url);
		}
	}

	/**
	 * Get current URL
	 */
	public getCurrentUrl(): string {
		return this.currentUrl;
	}

	// --- Element selection helpers ---

	private async ensureElementSelectionSession(url: string, viewport?: { width: number; height: number }): Promise<string> {
		const shouldRecreateSession = !!(this.elementSelectionSessionId && viewport && this.elementSelectionViewport &&
			(viewport.width !== this.elementSelectionViewport.width || viewport.height !== this.elementSelectionViewport.height));

		if (shouldRecreateSession && this.elementSelectionSessionId) {
			await vscode.commands.executeCommand<AutomationResult<void>>('_browserAutomation.closeSession', { sessionId: this.elementSelectionSessionId });
			this.elementSelectionSessionId = undefined;
		}

		if (!this.elementSelectionSessionId) {
			const sessionId = generateSessionId();
			const result = await vscode.commands.executeCommand<AutomationResult<string>>('_browserAutomation.createSession', { sessionId, url, options: viewport ? { viewport } : undefined });
			if (!result?.success) {
				throw new Error(result?.error || 'Failed to create browser automation session');
			}
			this.elementSelectionSessionId = sessionId;
			this.elementSelectionViewport = viewport;
			this.elementSelectionLastUrl = url;
			return sessionId;
		}

		// Navigate the session if needed
		if (this.elementSelectionLastUrl !== url) {
			const navRes = await vscode.commands.executeCommand<AutomationResult<string>>('_browserAutomation.navigate', { sessionId: this.elementSelectionSessionId, url, options: { waitUntil: 'load', timeout: 10000 } });
			if (!navRes?.success) {
				throw new Error(navRes?.error || 'Failed to navigate automation session');
			}
			this.elementSelectionLastUrl = url;
		}

		return this.elementSelectionSessionId;
	}

	private async closeElementSelectionSession(): Promise<void> {
		if (!this.elementSelectionSessionId) return;
		try {
			await vscode.commands.executeCommand<AutomationResult<void>>('_browserAutomation.closeSession', { sessionId: this.elementSelectionSessionId });
		} finally {
			this.elementSelectionSessionId = undefined;
			this.elementSelectionViewport = undefined;
			this.elementSelectionLastUrl = undefined;
		}
	}

	private async screenshotSession(sessionId: string, options?: any): Promise<string> {
		const res = await vscode.commands.executeCommand<AutomationResult<string>>('_browserAutomation.screenshot', { sessionId, options });
		if (!res?.success || !res.data) {
			throw new Error(res?.error || 'Failed to capture screenshot');
		}
		return res.data;
	}

	private async evaluateInSession<T>(sessionId: string, script: string): Promise<T> {
		const res = await vscode.commands.executeCommand<AutomationResult<T>>('_browserAutomation.evaluate', { sessionId, script });
		if (!res?.success) {
			throw new Error(res?.error || 'Failed to evaluate script');
		}
		return res.data as T;
	}

	private clampClip(boundingBox: ElementBoundingBox, viewport: { width: number; height: number }, padding: number): { x: number; y: number; width: number; height: number } | null {
		const pad = Math.max(0, Math.round(padding));
		const vpW = Math.max(0, Math.round(viewport.width));
		const vpH = Math.max(0, Math.round(viewport.height));
		if (!vpW || !vpH) return null;

		const rawX = Math.floor(boundingBox.x) - pad;
		const rawY = Math.floor(boundingBox.y) - pad;
		const rawW = Math.ceil(boundingBox.width) + pad * 2;
		const rawH = Math.ceil(boundingBox.height) + pad * 2;

		const x = Math.max(0, rawX);
		const y = Math.max(0, rawY);
		const width = Math.min(vpW - x, rawW);
		const height = Math.min(vpH - y, rawH);

		if (width <= 1 || height <= 1) return null;
		return { x, y, width, height };
	}

	private async handleStartElementSelection(e: any): Promise<void> {
		const url = typeof e.url === 'string' ? e.url : this.currentUrl;
		const viewport = e.viewport && typeof e.viewport.width === 'number' && typeof e.viewport.height === 'number'
			? { width: e.viewport.width, height: e.viewport.height }
			: undefined;

		const sessionId = await this.ensureElementSelectionSession(url, viewport);
		const screenshot = await this.screenshotSession(sessionId, { type: 'png' });
		await this._webviewPanel.webview.postMessage({ type: 'elementSelection.screenshot', data: screenshot });
	}

	private async handleElementSelectionHover(e: any): Promise<void> {
		if (!this.elementSelectionSessionId) return;
		if (typeof e.x !== 'number' || typeof e.y !== 'number') return;

		const requestId = ++this.elementSelectionHoverRequestId;
		const hoverData = await this.evaluateInSession<ElementSelectionHoverData>(this.elementSelectionSessionId, buildHoverScript(e.x, e.y));
		if (requestId !== this.elementSelectionHoverRequestId) return;

		await this._webviewPanel.webview.postMessage({ type: 'elementSelection.hoverResult', data: hoverData });
	}

	private async handleElementSelectionPick(e: any): Promise<void> {
		if (!this.elementSelectionSessionId) return;
		if (typeof e.x !== 'number' || typeof e.y !== 'number') return;

		const pickData = await this.evaluateInSession<ElementSelectionPickData>(this.elementSelectionSessionId, buildPickScript(e.x, e.y));
		if (!pickData || !pickData.selector || !pickData.elementData?.tagName) {
			return;
		}

		if (pickData.isSensitive) {
			vscode.window.showWarningMessage('Refusing to capture sensitive fields (e.g. password inputs).');
			return;
		}

		let elementScreenshot: string | null = null;
		if (pickData.boundingBox) {
			const clip = this.clampClip(pickData.boundingBox, pickData.viewport, 4);
			if (clip) {
				try {
					elementScreenshot = await this.screenshotSession(this.elementSelectionSessionId, { type: 'png', clip });
				} catch {
					elementScreenshot = null;
				}
			}
		}

		const payload = {
			type: 'BrowserElement' as const,
			selector: pickData.selector,
			selectorChain: pickData.selectorChain,
			pageUrl: pickData.pageUrl,
			elementData: pickData.elementData,
			screenshot: elementScreenshot,
			timestamp: Date.now(),
		};

		try {
			await vscode.commands.executeCommand('void.addBrowserElementSelection', payload);
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to add element to chat selections: ${err instanceof Error ? err.message : String(err)}`);
		}

		await this._webviewPanel.webview.postMessage({ type: 'elementSelection.picked', data: { label: pickData.elementData.tagName, selector: pickData.selector } });
	}

	private async handleElementSelectionScroll(e: any): Promise<void> {
		if (!this.elementSelectionSessionId) return;
		if (typeof e.deltaY !== 'number') return;

		// Scroll and then refresh screenshot (debounced on the webview side)
		const deltaY = Math.max(-2000, Math.min(2000, Math.round(e.deltaY)));
		await this.evaluateInSession(this.elementSelectionSessionId, `(() => { window.scrollBy(0, ${deltaY}); return { y: window.scrollY }; })()`);
		await new Promise<void>(resolve => setTimeout(() => resolve(), 50));
		const screenshot = await this.screenshotSession(this.elementSelectionSessionId, { type: 'png' });
		await this._webviewPanel.webview.postMessage({ type: 'elementSelection.screenshot', data: screenshot });
	}

	private getHtml(url: string) {
		const configuration = vscode.workspace.getConfiguration('simpleBrowser');

		const nonce = getNonce();

		const mainJs = this.extensionResourceUrl('media', 'index.js');
		const mainCss = this.extensionResourceUrl('media', 'main.css');
		const codiconsUri = this.extensionResourceUrl('media', 'codicon.css');

		return /* html */ `<!DOCTYPE html>
			<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">

				<meta http-equiv="Content-Security-Policy" content="
					default-src 'none';
					font-src data: ${this._webviewPanel.webview.cspSource};
					style-src ${this._webviewPanel.webview.cspSource} 'unsafe-inline';
					script-src 'nonce-${nonce}';
					frame-src *;
					img-src ${this._webviewPanel.webview.cspSource} data:;
					">

				<meta id="simple-browser-settings" data-settings="${escapeAttribute(JSON.stringify({
			url: url,
			focusLockEnabled: configuration.get<boolean>('focusLockIndicator.enabled', true)
		}))}">

				<link rel="stylesheet" type="text/css" href="${mainCss}">
				<link rel="stylesheet" type="text/css" href="${codiconsUri}">
			</head>
			<body>
				<header class="header">
					<nav class="controls">
						<button
							title="${vscode.l10n.t("Back")}"
							class="back-button icon"><i class="codicon codicon-arrow-left"></i></button>

						<button
							title="${vscode.l10n.t("Forward")}"
							class="forward-button icon"><i class="codicon codicon-arrow-right"></i></button>

						<button
							title="${vscode.l10n.t("Reload")}"
							class="reload-button icon"><i class="codicon codicon-refresh"></i></button>

						<button
							title="${vscode.l10n.t("Home")}"
							class="home-button icon"><i class="codicon codicon-home"></i></button>

						<button
							title="${vscode.l10n.t("Select Element")}"
							class="select-element-button icon"><i class="codicon codicon-target"></i></button>
					</nav>

					<div class="url-bar">
						<span class="url-bar-icon security-icon" title="${vscode.l10n.t("Connection is secure")}">
							<i class="codicon codicon-lock"></i>
						</span>
						<input class="url-input" type="text" placeholder="${vscode.l10n.t("Search or enter URL")}">
						<button class="url-bar-icon clear-button" title="${vscode.l10n.t("Clear")}">
							<i class="codicon codicon-close"></i>
						</button>
					</div>

					<nav class="controls">
						<button
							title="${vscode.l10n.t("Open in browser")}"
							class="open-external-button icon"><i class="codicon codicon-link-external"></i></button>
					</nav>
				</header>
				<div class="content">
					<div class="iframe-focused-alert">${vscode.l10n.t("Focus Lock")}</div>
					<div class="automation-overlay" id="automation-overlay">
						<div class="automation-indicator">
							<i class="codicon codicon-zap"></i>
							<span class="automation-action"></span>
							<span class="automation-details"></span>
						</div>
					</div>
					<div class="element-selection-overlay" id="element-selection-overlay" aria-hidden="true">
						<div class="element-selection-banner">
							<span class="element-selection-title">${vscode.l10n.t("Element Selection")}</span>
							<span class="element-selection-hint">${vscode.l10n.t("Move to highlight, click to add to chat. Press Esc to exit.")}</span>
						</div>
						<div class="element-selection-stage">
							<div class="element-selection-image-wrapper" id="element-selection-image-wrapper">
								<img class="element-selection-image" id="element-selection-image" alt="Element selection preview">
								<div class="element-selection-highlight" id="element-selection-highlight"></div>
							</div>
						</div>
						<div class="element-selection-status" id="element-selection-status"></div>
					</div>
					<iframe sandbox="allow-scripts allow-forms allow-same-origin allow-downloads allow-popups allow-popups-to-escape-sandbox allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-top-navigation allow-top-navigation-by-user-activation allow-storage-access-by-user-activation"></iframe>
				</div>

				<script src="${mainJs}" nonce="${nonce}"></script>
			</body>
			</html>`;
	}

	private extensionResourceUrl(...parts: string[]): vscode.Uri {
		return this._webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...parts));
	}
}

function escapeAttribute(value: string | vscode.Uri): string {
	return value.toString().replace(/"/g, '&quot;');
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 64; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
