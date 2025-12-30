/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { onceDocumentLoaded } from './events';

const vscode = acquireVsCodeApi();

function getSettings() {
	const element = document.getElementById('simple-browser-settings');
	if (element) {
		const data = element.getAttribute('data-settings');
		if (data) {
			return JSON.parse(data);
		}
	}

	throw new Error(`Could not load settings`);
}

const settings = getSettings();

const iframe = document.querySelector('iframe')!;
const header = document.querySelector('.header')!;
const input = header.querySelector<HTMLInputElement>('.url-input')!;
const forwardButton = header.querySelector<HTMLButtonElement>('.forward-button')!;
const backButton = header.querySelector<HTMLButtonElement>('.back-button')!;
const reloadButton = header.querySelector<HTMLButtonElement>('.reload-button')!;
const homeButton = header.querySelector<HTMLButtonElement>('.home-button')!;
const selectElementButton = header.querySelector<HTMLButtonElement>('.select-element-button')!;
const openExternalButton = header.querySelector<HTMLButtonElement>('.open-external-button')!;

// URL bar elements
const securityIcon = header.querySelector<HTMLElement>('.security-icon')!;
const clearButton = header.querySelector<HTMLButtonElement>('.clear-button')!;

// Navigation constants
const homeUrl = 'https://www.google.com/';
const searchEngineUrl = 'https://www.google.com/search?q=';

// Client-side history management
let historyStack: string[] = [];
let historyIndex = -1;

// Check if input is a valid URL
function isValidUrl(input: string): boolean {
	try {
		const url = new URL(input);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		// Check if it looks like a domain (contains a dot and no spaces)
		if (!input.includes(' ') && input.includes('.')) {
			const parts = input.split('.');
			const lastPart = parts[parts.length - 1].split('/')[0];
			// Check if TLD is at least 2 characters
			if (lastPart.length >= 2) {
				return true;
			}
		}
		return false;
	}
}

// Convert input to URL (either direct URL or search)
function inputToUrl(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) {
		return homeUrl;
	}

	if (isValidUrl(trimmed)) {
		try {
			new URL(trimmed);
			return trimmed;
		} catch {
			// Probably a domain without protocol
			return `https://${trimmed}`;
		}
	}

	// It's a search query
	return searchEngineUrl + encodeURIComponent(trimmed);
}

// Update security icon based on URL
function updateSecurityIcon(url: string): void {
	const iconElement = securityIcon.querySelector('i')!;

	try {
		const urlObj = new URL(url);
		if (urlObj.protocol === 'https:') {
			securityIcon.classList.add('secure');
			securityIcon.classList.remove('insecure');
			securityIcon.title = 'Connection is secure';
			iconElement.className = 'codicon codicon-lock';
		} else {
			securityIcon.classList.remove('secure');
			securityIcon.classList.add('insecure');
			securityIcon.title = 'Connection is not secure';
			iconElement.className = 'codicon codicon-unlock';
		}
	} catch {
		securityIcon.classList.remove('secure', 'insecure');
		securityIcon.title = '';
		iconElement.className = 'codicon codicon-globe';
	}
}

// Update navigation button states
function updateNavigationButtons(): void {
	backButton.disabled = historyIndex <= 0;
	forwardButton.disabled = historyIndex >= historyStack.length - 1;
}

// Navigate to a URL
function navigateToUrl(url: string, addToHistory: boolean = true): void {
	iframe.src = url;
	input.value = url;
	updateSecurityIcon(url);
	vscode.postMessage({ type: 'didNavigate', url });
	if (elementSelectionEnabled) {
		requestSelectionScreenshot();
	}

	if (addToHistory) {
		// Remove any forward history when navigating to a new page
		historyStack = historyStack.slice(0, historyIndex + 1);
		historyStack.push(url);
		historyIndex = historyStack.length - 1;
	}

	updateNavigationButtons();
}

// Go back in history
function goBack(): void {
	if (historyIndex > 0) {
		historyIndex--;
		const url = historyStack[historyIndex];
		navigateToUrl(url, false);
	}
}

// Go forward in history
function goForward(): void {
	if (historyIndex < historyStack.length - 1) {
		historyIndex++;
		const url = historyStack[historyIndex];
		navigateToUrl(url, false);
	}
}

// Reload current page
function reload(): void {
	iframe.src = iframe.src;
	if (elementSelectionEnabled) {
		requestSelectionScreenshot();
	}
}

// Automation overlay elements - disabled for production
// const automationOverlay = document.getElementById('automation-overlay')!;
// const automationAction = automationOverlay.querySelector('.automation-action')!;
// const automationDetails = automationOverlay.querySelector('.automation-details')!;
// let automationTimeout: number | undefined;

// --- Element selection overlay state ---
const elementSelectionOverlay = document.getElementById('element-selection-overlay')!;
const elementSelectionImage = document.getElementById('element-selection-image') as HTMLImageElement;
const elementSelectionImageWrapper = document.getElementById('element-selection-image-wrapper')!;
const elementSelectionHighlight = document.getElementById('element-selection-highlight')!;
const elementSelectionStatus = document.getElementById('element-selection-status')!;

let elementSelectionEnabled = false;
let latestScreenshotDims: { width: number; height: number } | null = null;
let hoverRaf: number | undefined;
let pendingHoverPoint: { x: number; y: number } | null = null;
let scrollDebounce: number | undefined;
let isScreenshotLoading = false;

function setElementSelectionStatus(text: string): void {
	elementSelectionStatus.textContent = text;
}

elementSelectionImage.addEventListener('load', () => {
	if (elementSelectionImage.naturalWidth && elementSelectionImage.naturalHeight) {
		latestScreenshotDims = { width: elementSelectionImage.naturalWidth, height: elementSelectionImage.naturalHeight };
	} else {
		latestScreenshotDims = null;
	}
});

function setHighlight(box: { x: number; y: number; width: number; height: number } | null): void {
	if (!box || !latestScreenshotDims) {
		elementSelectionHighlight.classList.remove('visible');
		return;
	}

	// Use the actual image's bounding rect, not the wrapper's, to match getPointInScreenshot()
	const imageRect = elementSelectionImage.getBoundingClientRect();
	const scaleX = imageRect.width / latestScreenshotDims.width;
	const scaleY = imageRect.height / latestScreenshotDims.height;

	// Position relative to the image's actual position
	const left = Math.max(0, imageRect.left - elementSelectionImageWrapper.getBoundingClientRect().left + box.x * scaleX);
	const top = Math.max(0, imageRect.top - elementSelectionImageWrapper.getBoundingClientRect().top + box.y * scaleY);
	const width = Math.max(0, box.width * scaleX);
	const height = Math.max(0, box.height * scaleY);

	elementSelectionHighlight.style.left = `${left}px`;
	elementSelectionHighlight.style.top = `${top}px`;
	elementSelectionHighlight.style.width = `${width}px`;
	elementSelectionHighlight.style.height = `${height}px`;
	elementSelectionHighlight.classList.add('visible');
}

function getPointInScreenshot(e: MouseEvent): { x: number; y: number } | null {
	const rect = elementSelectionImage.getBoundingClientRect();
	const naturalWidth = elementSelectionImage.naturalWidth;
	const naturalHeight = elementSelectionImage.naturalHeight;

	if (!naturalWidth || !naturalHeight || rect.width <= 0 || rect.height <= 0) {
		return null;
	}

	const x = (e.clientX - rect.left) * (naturalWidth / rect.width);
	const y = (e.clientY - rect.top) * (naturalHeight / rect.height);
	return { x, y };
}

function requestSelectionScreenshot(): void {
	const url = input.value;
	const viewport = { width: iframe.clientWidth, height: iframe.clientHeight };
	isScreenshotLoading = true;
	setElementSelectionStatus('Loading preview…');
	vscode.postMessage({ type: 'elementSelection.start', url, viewport });
}

function enableElementSelection(): void {
	elementSelectionEnabled = true;
	selectElementButton.classList.add('active');
	elementSelectionOverlay.classList.add('active');
	elementSelectionOverlay.setAttribute('aria-hidden', 'false');
	setHighlight(null);
	requestSelectionScreenshot();
}

function disableElementSelection(): void {
	elementSelectionEnabled = false;
	selectElementButton.classList.remove('active');
	elementSelectionOverlay.classList.remove('active');
	elementSelectionOverlay.setAttribute('aria-hidden', 'true');
	setHighlight(null);
	setElementSelectionStatus('');
	vscode.postMessage({ type: 'elementSelection.stop' });
}

function toggleElementSelection(): void {
	if (elementSelectionEnabled) disableElementSelection();
	else enableElementSelection();
}

window.addEventListener('message', e => {
	switch (e.data.type) {
		case 'focus':
			iframe.focus();
			break;
		case 'didChangeFocusLockIndicatorEnabled':
			toggleFocusLockIndicatorEnabled(e.data.enabled);
			break;
		case 'navigate':
			// Navigate from extension (e.g., when show is called with new URL)
			navigateToUrl(e.data.url);
			break;
		case 'automation-activity':
			// Disabled for production - no automation overlays
			// showAutomationActivity(e.data.action, e.data.details);
			break;
		case 'elementSelection.screenshot': {
			const base64 = e.data.data as string | undefined;
			if (!base64) break;
			elementSelectionImage.src = `data:image/png;base64,${base64}`;
			isScreenshotLoading = false;
			setHighlight(null);
			setElementSelectionStatus('Hover to highlight. Click to add to chat.');
			break;
		}
		case 'elementSelection.hoverResult': {
			const data = e.data.data as { boundingBox: { x: number; y: number; width: number; height: number } | null; label: string | null } | undefined;
			if (!data) break;
			setHighlight(data.boundingBox);
			if (data.label && !isScreenshotLoading) {
				setElementSelectionStatus(data.label);
			}
			break;
		}
		case 'elementSelection.picked': {
			const data = e.data.data as { label?: string; selector?: string } | undefined;
			const label = data?.selector || data?.label || 'Element added';
			setElementSelectionStatus(`Added: ${label}`);
			break;
		}
		case 'elementSelection.error': {
			const msg = (e.data.message as string | undefined) || 'Element selection error';
			setElementSelectionStatus(msg);
			break;
		}
	}
});

onceDocumentLoaded(() => {
	setInterval(() => {
		const iframeFocused = document.activeElement?.tagName === 'IFRAME';
		document.body.classList.toggle('iframe-focused', iframeFocused);
	}, 50);

	input.addEventListener('change', e => {
		const inputValue = (e.target as HTMLInputElement).value;
		const url = inputToUrl(inputValue);
		navigateToUrl(url);
	});

	// Handle Enter key press
	input.addEventListener('keydown', e => {
		if (e.key === 'Enter') {
			const url = inputToUrl(input.value);
			navigateToUrl(url);
			input.blur();
		} else if (e.key === 'Escape') {
			input.blur();
		}
	});

	// Select all text when focusing the input
	input.addEventListener('focus', () => {
		setTimeout(() => input.select(), 0);
	});

	// Clear button handler
	clearButton.addEventListener('click', () => {
		input.value = '';
		input.focus();
	});

	forwardButton.addEventListener('click', () => {
		goForward();
	});

	backButton.addEventListener('click', () => {
		goBack();
	});

	homeButton.addEventListener('click', () => {
		navigateToUrl(homeUrl);
	});

	selectElementButton.addEventListener('click', () => {
		toggleElementSelection();
	});

	openExternalButton.addEventListener('click', () => {
		vscode.postMessage({
			type: 'openExternal',
			url: input.value
		});
	});

	reloadButton.addEventListener('click', () => {
		reload();
	});

	// Initial page load
	const initialUrl = settings.url || homeUrl;
	navigateToUrl(initialUrl);

	toggleFocusLockIndicatorEnabled(settings.focusLockEnabled);
});

function toggleFocusLockIndicatorEnabled(enabled: boolean) {
	document.body.classList.toggle('enable-focus-lock-indicator', enabled);
}

// Element selection interactions (hover + click + scroll)
elementSelectionImageWrapper.addEventListener('mousemove', (e) => {
	if (!elementSelectionEnabled) return;
	if (isScreenshotLoading) return;
	const pt = getPointInScreenshot(e);
	if (!pt) return;
	pendingHoverPoint = pt;

	if (hoverRaf) return;
	hoverRaf = window.requestAnimationFrame(() => {
		hoverRaf = undefined;
		if (!pendingHoverPoint) return;
		vscode.postMessage({ type: 'elementSelection.hover', x: pendingHoverPoint.x, y: pendingHoverPoint.y });
		pendingHoverPoint = null;
	});
});

elementSelectionImageWrapper.addEventListener('mouseleave', () => {
	if (!elementSelectionEnabled) return;
	setHighlight(null);
});

elementSelectionImageWrapper.addEventListener('click', (e) => {
	if (!elementSelectionEnabled) return;
	if (isScreenshotLoading) return;
	const pt = getPointInScreenshot(e);
	if (!pt) return;
	vscode.postMessage({ type: 'elementSelection.pick', x: pt.x, y: pt.y });
});

elementSelectionOverlay.addEventListener('wheel', (e) => {
	if (!elementSelectionEnabled) return;
	e.preventDefault();

	const deltaY = e.deltaY;
	if (scrollDebounce) {
		clearTimeout(scrollDebounce);
	}
	scrollDebounce = window.setTimeout(() => {
		scrollDebounce = undefined;
		isScreenshotLoading = true;
		setElementSelectionStatus('Scrolling…');
		vscode.postMessage({ type: 'elementSelection.scroll', deltaY });
	}, 60);
}, { passive: false });

window.addEventListener('keydown', (e) => {
	if (!elementSelectionEnabled) return;
	if (e.key === 'Escape') {
		disableElementSelection();
	}
});
