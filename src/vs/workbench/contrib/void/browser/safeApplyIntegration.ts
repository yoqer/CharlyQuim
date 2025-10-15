/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IEditCodeService } from './editCodeServiceInterface.js';
import { ISafeApplyService } from './safeApplyService.js';
import { URI } from '../../../../base/common/uri.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
// Note: Using browser-compatible crypto instead of Node.js crypto

export class SafeApplyIntegration extends Disposable {
    constructor(
        private readonly editCodeService: IEditCodeService,
        private readonly safeApplyService: ISafeApplyService,
        private readonly fileService: IFileService,
        private readonly logService: ILogService,
        private readonly notificationService: INotificationService,
    ) {
        super();
        this._setupSafeApplyHooks();
    }

    private _setupSafeApplyHooks(): void {
        // Hook into the edit service events to create backups
        this._register(this.editCodeService.onDidAddOrDeleteDiffZones(({ uri }) => {
            this._onFileModified(uri);
        }));
    }

    private async _onFileModified(uri: URI): Promise<void> {
        try {
            // Check if file exists and is readable
            if (!(await this.fileService.exists(uri))) {
                return;
            }

            // Read current file content
            const fileContent = await this.fileService.readFile(uri);
            const content = fileContent.value.toString();

            // Create backup before any modifications
            await this.safeApplyService.createBackup(uri, content, 'ai-apply');

            this.logService.info(`SafeApplyIntegration: Created backup for ${uri.fsPath}`);
        } catch (error) {
            this.logService.error('SafeApplyIntegration: Failed to create backup', error);
        }
    }

    // Enhanced callBeforeApplyOrEdit with backup creation
    async callBeforeApplyOrEdit(uri: URI | 'current'): Promise<void> {
        try {
            // Get the actual URI
            const actualUri = uri === 'current' ? this._getCurrentFileUri() : uri;
            if (!actualUri) {
                throw new Error('No current file available');
            }

            // Create backup before applying changes
            if (await this.fileService.exists(actualUri)) {
                const fileContent = await this.fileService.readFile(actualUri);
                const content = fileContent.value.toString();

                await this.safeApplyService.createBackup(actualUri, content, 'ai-apply');
                this.logService.info(`SafeApplyIntegration: Created backup before apply for ${actualUri.fsPath}`);
            }

            // Call the original method
            await this.editCodeService.callBeforeApplyOrEdit(uri);
        } catch (error) {
            this.logService.error('SafeApplyIntegration: Failed in callBeforeApplyOrEdit', error);
            throw error;
        }
    }

    // Enhanced startApplying with audit logging
    startApplying(opts: any): [URI, Promise<void>] | null {
        const result = this.editCodeService.startApplying(opts);

        if (result) {
            const [uri, applyPromise] = result;

            // Wrap the promise to add audit logging
            const wrappedPromise = applyPromise
                .then(async () => {
                    // Log successful apply
                    const diffHash = this._generateDiffHash(uri);
                    await this.safeApplyService.logApply([uri], diffHash, 'ai-apply', true);
                    this.logService.info(`SafeApplyIntegration: Logged successful apply for ${uri.fsPath}`);
                })
                .catch(async (error) => {
                    // Log failed apply
                    const diffHash = this._generateDiffHash(uri);
                    await this.safeApplyService.logApply([uri], diffHash, 'ai-apply', false, error.message);
                    this.logService.error(`SafeApplyIntegration: Logged failed apply for ${uri.fsPath}`, error);
                    throw error;
                });

            return [uri, wrappedPromise];
        }

        return result;
    }

    // Enhanced instantlyApplySearchReplaceBlocks with backup and logging
    async instantlyApplySearchReplaceBlocks(opts: { uri: URI; searchReplaceBlocks: string }): Promise<void> {
        try {
            // Create backup before applying
            if (await this.fileService.exists(opts.uri)) {
                const fileContent = await this.fileService.readFile(opts.uri);
                const content = fileContent.value.toString();

                await this.safeApplyService.createBackup(opts.uri, content, 'ai-apply');
                this.logService.info(`SafeApplyIntegration: Created backup before search/replace for ${opts.uri.fsPath}`);
            }

            // Apply the changes
            this.editCodeService.instantlyApplySearchReplaceBlocks(opts);

            // Log successful apply
            const diffHash = this._generateDiffHash(opts.uri);
            await this.safeApplyService.logApply([opts.uri], diffHash, 'ai-apply', true);
            this.logService.info(`SafeApplyIntegration: Logged successful search/replace for ${opts.uri.fsPath}`);
        } catch (error) {
            // Log failed apply
            const diffHash = this._generateDiffHash(opts.uri);
            await this.safeApplyService.logApply([opts.uri], diffHash, 'ai-apply', false, error.message);
            this.logService.error(`SafeApplyIntegration: Logged failed search/replace for ${opts.uri.fsPath}`, error);
            throw error;
        }
    }

    // Enhanced instantlyRewriteFile with backup and logging
    async instantlyRewriteFile(opts: { uri: URI; newContent: string }): Promise<void> {
        try {
            // Create backup before rewriting
            if (await this.fileService.exists(opts.uri)) {
                const fileContent = await this.fileService.readFile(opts.uri);
                const content = fileContent.value.toString();

                await this.safeApplyService.createBackup(opts.uri, content, 'ai-apply');
                this.logService.info(`SafeApplyIntegration: Created backup before rewrite for ${opts.uri.fsPath}`);
            }

            // Apply the changes
            this.editCodeService.instantlyRewriteFile(opts);

            // Log successful apply
            const diffHash = this._generateDiffHash(opts.uri);
            await this.safeApplyService.logApply([opts.uri], diffHash, 'ai-apply', true);
            this.logService.info(`SafeApplyIntegration: Logged successful rewrite for ${opts.uri.fsPath}`);
        } catch (error) {
            // Log failed apply
            const diffHash = this._generateDiffHash(opts.uri);
            await this.safeApplyService.logApply([opts.uri], diffHash, 'ai-apply', false, error.message);
            this.logService.error(`SafeApplyIntegration: Logged failed rewrite for ${opts.uri.fsPath}`, error);
            throw error;
        }
    }

    private _getCurrentFileUri(): URI | null {
        // This is a simplified implementation - in a real scenario, you'd get this from the editor service
        // For now, we'll return null and let the caller handle it
        return null;
    }

	private _generateDiffHash(uri: URI): string {
		// Generate a simple hash based on URI and timestamp
		const content = `${uri.fsPath}-${Date.now()}`;
		let hash = 0;
		for (let i = 0; i < content.length; i++) {
			const char = content.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(16).substring(0, 16);
	}

    // Delegate all other methods to the original service
    get diffAreaOfId() { return this.editCodeService.diffAreaOfId; }
    get diffAreasOfURI() { return this.editCodeService.diffAreasOfURI; }
    get diffOfId() { return this.editCodeService.diffOfId; }
    get onDidAddOrDeleteDiffZones() { return this.editCodeService.onDidAddOrDeleteDiffZones; }
    get onDidChangeDiffsInDiffZoneNotStreaming() { return this.editCodeService.onDidChangeDiffsInDiffZoneNotStreaming; }
    get onDidChangeStreamingInDiffZone() { return this.editCodeService.onDidChangeStreamingInDiffZone; }
    get onDidChangeStreamingInCtrlKZone() { return this.editCodeService.onDidChangeStreamingInCtrlKZone; }

    processRawKeybindingText(keybindingStr: string): string {
        return this.editCodeService.processRawKeybindingText(keybindingStr);
    }

    addCtrlKZone(opts: any): number | undefined {
        return this.editCodeService.addCtrlKZone(opts);
    }

    removeCtrlKZone(opts: { diffareaid: number }): void {
        return this.editCodeService.removeCtrlKZone(opts);
    }

    acceptOrRejectAllDiffAreas(opts: any): void {
        return this.editCodeService.acceptOrRejectAllDiffAreas(opts);
    }

    acceptDiff(opts: { diffid: number }): void {
        return this.editCodeService.acceptDiff(opts);
    }

    rejectDiff(opts: { diffid: number }): void {
        return this.editCodeService.rejectDiff(opts);
    }

    isCtrlKZoneStreaming(opts: { diffareaid: number }): boolean {
        return this.editCodeService.isCtrlKZoneStreaming(opts);
    }

    interruptCtrlKStreaming(opts: { diffareaid: number }): void {
        return this.editCodeService.interruptCtrlKStreaming(opts);
    }

    interruptURIStreaming(opts: { uri: URI }): void {
        return this.editCodeService.interruptURIStreaming(opts);
    }

    getVoidFileSnapshot(uri: URI): any {
        return this.editCodeService.getVoidFileSnapshot(uri);
    }

    restoreVoidFileSnapshot(uri: URI, snapshot: any): void {
        return this.editCodeService.restoreVoidFileSnapshot(uri, snapshot);
    }
}
