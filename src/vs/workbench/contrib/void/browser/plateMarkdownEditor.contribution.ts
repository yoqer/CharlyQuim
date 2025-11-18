/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { extname } from '../../../../base/common/resources.js';
import { URI } from '../../../../base/common/uri.js';
import { localize } from '../../../../nls.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { EditorExtensions, IEditorFactoryRegistry } from '../../../common/editor.js';
import { IWorkbenchContribution, WorkbenchPhase, registerWorkbenchContribution2 } from '../../../common/contributions.js';
import { RegisteredEditorPriority, IEditorResolverService } from '../../../services/editor/common/editorResolverService.js';
import { PlateMarkdownEditorPane, PlateMarkdownFileInput, PLATE_MARKDOWN_EDITOR_ID, PLATE_MARKDOWN_EDITOR_INPUT_ID } from './plateMarkdownEditor.js';
import { FileEditorInputSerializer } from '../../files/browser/editors/fileEditorHandler.js';

const PLATE_MARKDOWN_DISPLAY_NAME = localize('plateMarkdownEditor.displayName', "Markdown (Rich)");

Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
 EditorPaneDescriptor.create(PlateMarkdownEditorPane, PlateMarkdownEditorPane.ID, PLATE_MARKDOWN_DISPLAY_NAME),
 [new SyncDescriptor(PlateMarkdownFileInput)]
);

Registry.as<IEditorFactoryRegistry>(EditorExtensions.EditorFactory).registerEditorSerializer(
 PLATE_MARKDOWN_EDITOR_INPUT_ID,
 FileEditorInputSerializer
);

class PlateMarkdownResolverContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.plateMarkdownResolver';

	constructor(
		@IEditorResolverService editorResolverService: IEditorResolverService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
	) {
		super();
		this.registerPattern(editorResolverService, '*.md');
		this.registerPattern(editorResolverService, '*.mdx');
	}

	private registerPattern(editorResolverService: IEditorResolverService, pattern: string) {
		this._register(editorResolverService.registerEditor(
			pattern,
			{
				id: PLATE_MARKDOWN_EDITOR_ID,
				label: PLATE_MARKDOWN_DISPLAY_NAME,
				detail: localize('plateMarkdownEditor.detail', "Edit Markdown notes with Plate"),
				priority: RegisteredEditorPriority.exclusive,
			},
			{
				singlePerResource: true,
				canSupportResource: resource => PlateMarkdownResolverContribution.isMarkdownResource(resource),
			},
			{
				createEditorInput: ({ resource }) => {
					const input = this.instantiationService.createInstance(PlateMarkdownFileInput, resource, resource, undefined, undefined, undefined, undefined, undefined);
					return { editor: input };
				},
			}
		));
	}

	private static isMarkdownResource(resource: URI): boolean {
		const extension = extname(resource);
		return extension === '.md' || extension === '.MD' || extension === '.mdx' || extension === '.MDX';
	}
}

registerWorkbenchContribution2(PlateMarkdownResolverContribution.ID, PlateMarkdownResolverContribution, WorkbenchPhase.BlockStartup);
