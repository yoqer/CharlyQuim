const { contextBridge, ipcRenderer } = require('electron');

let isInspectMode = false;
let inspectStyle = null;

ipcRenderer.on('hypno-toggle-inspect', () => {
	isInspectMode = !isInspectMode;
	if (isInspectMode) {
		inspectStyle = document.createElement('style');
		inspectStyle.textContent = '* { cursor: crosshair !important; }';
		document.head.appendChild(inspectStyle);
	} else {
		if (inspectStyle) inspectStyle.remove();
	}
});

window.addEventListener('keydown', (e) => {
	if (e.key === 'Escape' && isInspectMode) {
		isInspectMode = false;
		if (inspectStyle) inspectStyle.remove();
		ipcRenderer.send('vscode:hypno-browser-inspect-disabled');
	}
});

window.addEventListener('mousedown', (e) => {
	// Alt + Left Click OR Inspect Mode + Left Click
	if ((e.altKey && e.button === 0) || (isInspectMode && e.button === 0)) {
		e.preventDefault();
		e.stopPropagation();

		if (isInspectMode) {
			isInspectMode = false;
			if (inspectStyle) inspectStyle.remove();
			ipcRenderer.send('vscode:hypno-browser-inspect-disabled');
		}

		const el = e.target;
		if (!el) return;

		let html = el.outerHTML;
		if (html.length > 2000) {
			html = html.substring(0, 2000) + '... (truncated)';
		}

		const data = {
			html: html,
			css: getRelevantStyles(el),
			xpath: getXPath(el),
			url: window.location.href
		};

		ipcRenderer.send('vscode:hypno-browser-click', data);
	}
}, true);

function getRelevantStyles(el) {
	const styles = window.getComputedStyle(el);
	const relevant = {};
	const props = ['color', 'background-color', 'font-size', 'margin', 'padding', 'display', 'border', 'flex', 'grid'];

	for (const prop of styles) {
		if (props.some(p => prop.includes(p)) || props.includes(prop)) {
			relevant[prop] = styles.getPropertyValue(prop);
		}
	}
	return relevant;
}

function getXPath(element) {
	if (element.id !== '') return 'id("' + element.id + '")';
	if (element === document.body) return element.tagName;

	let ix = 0;
	const siblings = element.parentNode.childNodes;
	for (let i = 0; i < siblings.length; i++) {
		const sibling = siblings[i];
		if (sibling === element) return getXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
		if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
	}
}
