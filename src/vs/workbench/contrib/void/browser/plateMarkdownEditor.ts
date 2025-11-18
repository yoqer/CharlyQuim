/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { IDisposable } from '../../../../base/common/lifecycle.js';
import { Dimension } from '../../../../base/browser/dom.js';
import { EndOfLinePreference } from '../../../../editor/common/model.js';
import { EditOperation } from '../../../../editor/common/core/editOperation.js';
import { ITextFileEditorModel, ITextFileService } from '../../../services/textfile/common/textfiles.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';
import { IEditorDescriptor, IEditorOpenContext, IEditorPane } from '../../../common/editor.js';
import { FileEditorInput } from '../../files/browser/editors/fileEditorInput.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { mountPlateMarkdownEditor } from './react/out/plate-markdown-editor/index.js';
import { ColorScheme } from '../../../../platform/theme/common/theme.js';
import { ITextEditorOptions } from '../../../../platform/editor/common/editor.js';
import { URI } from '../../../../base/common/uri.js';
import { ITextModelService } from '../../../../editor/common/services/resolverService.js';
import { ILabelService } from '../../../../platform/label/common/label.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { IFilesConfigurationService } from '../../../services/filesConfiguration/common/filesConfigurationService.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { IPathService } from '../../../services/path/common/pathService.js';
import { ITextResourceConfigurationService } from '../../../../editor/common/services/textResourceConfiguration.js';
import { ICustomEditorLabelService } from '../../../services/editor/common/customEditorLabelService.js';

type MountHandle = {
	dispose: () => void;
	rerender: (props: any) => void;
};

export const PLATE_MARKDOWN_EDITOR_ID = 'workbench.editor.voidPlateMarkdown';
export const PLATE_MARKDOWN_EDITOR_INPUT_ID = 'workbench.input.voidPlateMarkdown';

export class PlateMarkdownEditorPane extends EditorPane {

	static readonly ID = PLATE_MARKDOWN_EDITOR_ID;

	private container!: HTMLElement;
	private mountHandle: MountHandle | undefined;

	private model: ITextFileEditorModel | undefined;
	private modelListener: IDisposable | undefined;
	private ignoreModelContentChange = false;

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
	) {
		super(PlateMarkdownEditorPane.ID, group, telemetryService, themeService, storageService);

		this._register(this.themeService.onDidColorThemeChange(() => {
			this.scheduleRerender();
		}));
	}

	protected createEditor(parent: HTMLElement): void {
		this.container = document.createElement('div');
		this.container.className = 'plate-markdown-editor-container';
		this.container.style.height = '100%';
		this.container.style.width = '100%';
		parent.appendChild(this.container);
	}

	override layout(dimension: Dimension): void {
		if (this.container) {
			this.container.style.height = `${dimension.height}px`;
			this.container.style.width = `${dimension.width}px`;
		}
	}

	override async setInput(input: FileEditorInput, options: ITextEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);

		const resolved = await input.resolve(options);
		if (token.isCancellationRequested) {
			return;
		}

		if (!this.isTextFileEditorModel(resolved)) {
			throw new Error('Plate Markdown editor only supports text file models.');
		}

		this.bindModel(resolved);
		this.renderWithCurrentModel();
	}

	override clearInput(): void {
		super.clearInput();
		this.disposeModelListener();
		this.model = undefined;
		this.scheduleRerender('');
	}

	private bindModel(model: ITextFileEditorModel): void {
		if (this.model === model) {
			return;
		}

		this.disposeModelListener();
		this.model = model;

		const textModel = model.textEditorModel;
		if (textModel) {
			this.modelListener = this._register(textModel.onDidChangeContent(() => {
				if (this.ignoreModelContentChange) {
					this.ignoreModelContentChange = false;
					return;
				}

				this.renderWithCurrentModel();
			}));
		}
	}

	private disposeModelListener(): void {
		if (this.modelListener) {
			this.modelListener.dispose();
			this.modelListener = undefined;
		}
	}

	private getCurrentMarkdown(): string {
		const textModel = this.model?.textEditorModel;
		if (!textModel) {
			return '';
		}

		return textModel.getValue(EndOfLinePreference.TextDefined);
	}

	private renderWithCurrentModel(): void {
		this.scheduleRerender(this.getCurrentMarkdown());
	}

	private scheduleRerender(markdown?: string): void {
		if (!this.container) {
			return;
		}

		const props = this.createComponentProps(markdown ?? this.getCurrentMarkdown());
		if (!this.mountHandle) {
			this.mountHandle = this.instantiationService.invokeFunction(accessor => {
				return mountPlateMarkdownEditor(this.container, accessor, props) as MountHandle;
			});
		} else {
			this.mountHandle.rerender(props);
		}
	}

	private createComponentProps(markdown: string) {
		const colorTheme = this.themeService.getColorTheme();
		const theme = colorTheme.type === ColorScheme.DARK ? 'dark' : 'light';
		const readOnlyCandidate = this.input?.isReadonly();
		const readOnly = typeof readOnlyCandidate === 'boolean' ? readOnlyCandidate : false;

		return {
			markdown,
			onChange: (value: string) => this.onMarkdownChanged(value),
			readOnly,
			theme,
		};
	}

	private onMarkdownChanged(markdown: string): void {
		if (!this.model) {
			return;
		}

		const textModel = this.model?.textEditorModel;
		if (!textModel) {
			return;
		}

		const currentValue = textModel.getValue(EndOfLinePreference.TextDefined);
		if (currentValue === markdown) {
			return;
		}

		this.ignoreModelContentChange = true;
		const fullRange = textModel.getFullModelRange();
		textModel.pushEditOperations(
			null,
			[EditOperation.replace(fullRange, markdown)],
			() => null
		);
		this.ignoreModelContentChange = false;
	}

	private isTextFileEditorModel(model: unknown): model is ITextFileEditorModel {
		return !!model && typeof (model as ITextFileEditorModel).textEditorModel === 'object';
	}

	override dispose(): void {
		this.mountHandle?.dispose();
		this.mountHandle = undefined;
		super.dispose();
	}
}

export class PlateMarkdownFileInput extends FileEditorInput {
	static readonly TYPE_ID = PLATE_MARKDOWN_EDITOR_INPUT_ID;

	override get typeId(): string {
		return PlateMarkdownFileInput.TYPE_ID;
	}

	override get editorId(): string | undefined {
		return PlateMarkdownEditorPane.ID;
	}

	constructor(
		resource: URI,
		preferredResource: URI | undefined,
		preferredName: string | undefined,
		preferredDescription: string | undefined,
		preferredEncoding: string | undefined,
		preferredLanguageId: string | undefined,
		preferredContents: string | undefined,
		@IInstantiationService instantiationService: IInstantiationService,
		@ITextFileService textFileService: ITextFileService,
		@ITextModelService textModelService: ITextModelService,
		@ILabelService labelService: ILabelService,
		@IFileService fileService: IFileService,
		@IFilesConfigurationService filesConfigurationService: IFilesConfigurationService,
		@IEditorService editorService: IEditorService,
		@IPathService pathService: IPathService,
		@ITextResourceConfigurationService textResourceConfigurationService: ITextResourceConfigurationService,
		@ICustomEditorLabelService customEditorLabelService: ICustomEditorLabelService
	) {
		super(resource, preferredResource, preferredName, preferredDescription, preferredEncoding, preferredLanguageId, preferredContents, instantiationService, textFileService, textModelService, labelService, fileService, filesConfigurationService, editorService, pathService, textResourceConfigurationService, customEditorLabelService);
	}

	override prefersEditorPane<T extends IEditorDescriptor<IEditorPane>>(editorPanes: T[]): T | undefined {
		const preferred = editorPanes.find(editorPane => editorPane.typeId === PlateMarkdownEditorPane.ID);
		if (preferred) {
			return preferred;
		}

		return super.prefersEditorPane(editorPanes);
	}
}
