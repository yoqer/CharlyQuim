/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronDown, Copy, ExternalLink, Globe } from 'lucide-react';
import { ToolMessage } from '../../../../../common/chatThreadServiceTypes.js';
import {
	BrowserToolName,
	BrowserToolVariant,
	getPrimaryContent,
	hasExpandablePreview,
	getMetaInfo,
	getToolTitle,
	getVariantBorderColor,
} from './BrowserToolHelpers.js';
import { BrowserToolStateIndicator } from './BrowserToolStates.js';
import { BrowserToolPreview } from './BrowserToolPreview.js';
import { CopyButton } from '../markdown/ApplyBlockHoverButtons.js';
import { useAccessor } from '../util/services.js';

interface BrowserToolBarProps<T extends BrowserToolName> {
	toolMessage: Exclude<ToolMessage<T>, { type: 'invalid_params' }>;
	variant: BrowserToolVariant;
}

export function BrowserToolBar<T extends BrowserToolName>({
	toolMessage,
	variant,
}: BrowserToolBarProps<T>) {
	const accessor = useAccessor();
	const commandService = accessor.get('ICommandService');

	const [isExpanded, setIsExpanded] = useState(false);

	const { name, type } = toolMessage;

	// Auto-collapse when state changes from success
	useEffect(() => {
		if (type !== 'success') {
			setIsExpanded(false);
		}
	}, [type]);

	// Memoized content extraction
	const primaryContent = useMemo(() => getPrimaryContent(toolMessage), [toolMessage]);
	const metaInfo = useMemo(() => getMetaInfo(toolMessage), [toolMessage]);
	const canExpand = useMemo(() => hasExpandablePreview(toolMessage), [toolMessage]);
	const title = useMemo(() => getToolTitle(name), [name]);

	// Don't render for tool_request
	if (type === 'tool_request') return null;

	// Get border color based on variant
	const variantBorderClass = getVariantBorderColor(variant);

	// Determine if we should show the shimmer animation
	const isRunning = type === 'running_now';
	const isError = type === 'tool_error';
	const isSuccess = type === 'success';
	const isRejected = type === 'rejected';

	// Get URL for navigation tools
	const url = useMemo(() => {
		if (type === 'success') {
			const result = toolMessage.result as any;
			if (name === 'browser_navigate' || name === 'browser_get_url') {
				return result.url;
			}
		}
		if (type !== 'tool_request' && (name === 'browser_navigate')) {
			return (toolMessage.params as any).url;
		}
		return null;
	}, [toolMessage, name, type]);

	// Get copyable content
	const copyableContent = useMemo(() => {
		if (type === 'success') {
			const result = toolMessage.result as any;
			switch (name) {
				case 'browser_navigate':
				case 'browser_get_url':
					return result.url;
				case 'browser_screenshot':
					return result.base64;
				case 'browser_get_content':
					return result.html;
				case 'browser_extract_text':
					return result.text;
				case 'browser_evaluate':
					return typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2);
				default:
					return primaryContent;
			}
		}
		if (type === 'rejected' && name === 'browser_navigate') {
			return (toolMessage.params as any).url;
		}
		return primaryContent;
	}, [toolMessage, name, type, primaryContent]);

	return (
		<div className="w-full">
			{/* Main horizontal bar */}
			<motion.div
				className={`
					flex flex-row items-center gap-2 px-2 py-1.5 rounded
					border border-void-border-2 bg-void-bg-3
					hover:border-void-border-1 transition-colors duration-150
					border-l-2 ${variantBorderClass}
					${isError ? 'border-l-red-500/50' : ''}
					${isSuccess ? 'border-l-green-500/50' : ''}
				`}
				animate={
					isRunning
						? {
								boxShadow: [
									'0 0 0 0 rgba(250, 204, 21, 0.3)',
									'0 0 0 2px rgba(250, 204, 21, 0.1)',
									'0 0 0 0 rgba(250, 204, 21, 0.3)',
								],
						  }
						: {}
				}
				transition={isRunning ? { duration: 2, repeat: Infinity } : {}}
			>
				{/* State indicator icon */}
				<BrowserToolStateIndicator toolMessage={toolMessage} variant={variant} />

				{/* Tool title */}
				<span className="text-[12px] text-void-fg-3 opacity-70 flex-shrink-0">
					{title}:
				</span>

				{/* Primary content */}
				{primaryContent && (
					<span
						className="text-[12px] text-void-fg-2 truncate cursor-pointer hover:text-void-fg-1 hover:underline flex-1 min-w-0"
						title={primaryContent}
						onClick={() => {
							if (url) {
								commandService.executeCommand('simpleBrowser.show', url);
							}
						}}
					>
						{primaryContent}
					</span>
				)}

				{/* Spacer */}
				<div className="flex-1 min-w-0" />

				{/* Action buttons */}
				<div className="flex items-center gap-1 flex-shrink-0">
					{/* Expand/collapse button (only for tools with preview) */}
					{canExpand && (
						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className="p-1 rounded hover:bg-void-bg-4 transition-colors"
							aria-label={isExpanded ? 'Collapse preview' : 'Expand preview'}
							aria-expanded={isExpanded}
						>
							{isExpanded ? (
								<ChevronDown size={14} className="text-void-fg-3" />
							) : (
								<ChevronRight size={14} className="text-void-fg-3" />
							)}
						</button>
					)}

					{/* Copy button */}
					{copyableContent && (
						<div className="flex-shrink-0">
							<CopyButton
								codeStr={copyableContent}
								toolTipName={
									name === 'browser_screenshot'
										? 'Copy base64'
										: name === 'browser_get_content'
										? 'Copy HTML'
										: 'Copy content'
								}
							/>
						</div>
					)}

					{/* Open in browser button (for navigation tools) */}
					{url && (
						<button
							onClick={() => commandService.executeCommand('simpleBrowser.show', url)}
							className="p-1 rounded hover:bg-void-bg-4 transition-colors"
							aria-label="Open in browser"
							title="Open in browser"
						>
							<Globe size={14} className="text-void-fg-3 hover:text-void-fg-1" />
						</button>
					)}

					{/* Meta info */}
					{metaInfo && (
						<span className="text-[10px] text-void-fg-4 opacity-60 ml-1">
							{metaInfo}
						</span>
					)}
				</div>
			</motion.div>

			{/* Expandable preview section */}
			{canExpand && (
				<BrowserToolPreview toolMessage={toolMessage} isExpanded={isExpanded} />
			)}
		</div>
	);
}
