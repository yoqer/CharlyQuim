/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useEffect, useMemo, useRef } from 'react';
import remarkGfm from 'remark-gfm';

import { MarkdownPlugin } from '@platejs/markdown';
import { BaseBasicBlocksPlugin, BaseBasicMarksPlugin } from '@platejs/basic-nodes';
import { BaseListPlugin } from '@platejs/list';
import { Plate, PlateContent, createPlateEditor } from 'platejs/react';

type PlateMarkdownEditorProps = {
	markdown: string;
	onChange: (markdown: string) => void;
	readOnly?: boolean;
	theme: 'light' | 'dark';
};

const markdownPlugin = MarkdownPlugin.configure({
	options: {
		remarkPlugins: [remarkGfm],
	},
});

const basePlugins = [
	markdownPlugin,
	BaseBasicBlocksPlugin,
	BaseBasicMarksPlugin,
	BaseListPlugin,
];

export const PlateMarkdownEditor: React.FC<PlateMarkdownEditorProps> = ({ markdown, onChange, readOnly, theme }) => {
	const editor = useMemo(() => createPlateEditor({
		plugins: basePlugins,
	}), []);

	const markdownApi = useMemo(() => editor.getApi(MarkdownPlugin).markdown, [editor]);

	const lastSerializedRef = useRef<string>('');
	const skipNextChangeRef = useRef<boolean>(false);

	useEffect(() => {
		const nextMarkdown = markdown ?? '';
		if (nextMarkdown === lastSerializedRef.current) {
			return;
		}

		const deserialized = markdownApi.deserialize(nextMarkdown);
		editor.children = deserialized as any;
		if (editor.history) {
			editor.history = { undos: [], redos: [] } as any;
		}
		lastSerializedRef.current = nextMarkdown;
		skipNextChangeRef.current = true;
		editor.onChange();
	}, [markdown, editor, markdownApi]);

	const handleChange = React.useCallback(() => {
		const serialized = markdownApi.serialize();
		if (skipNextChangeRef.current) {
			skipNextChangeRef.current = false;
			return;
		}

		if (serialized === lastSerializedRef.current) {
			return;
		}

		lastSerializedRef.current = serialized;
		onChange(serialized);
	}, [markdownApi, onChange]);

	return (
		<div className={`void-plate-markdown ${theme === 'dark' ? 'void-plate-markdown--dark' : ''}`}>
			<Plate editor={editor} onChange={handleChange} readOnly={readOnly}>
				<PlateContent />
			</Plate>
		</div>
	);
};
