/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { URI } from '../../../../base/common/uri.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { join } from '../../../../base/common/path.js';
// Note: Using browser-compatible crypto instead of Node.js crypto

export interface IBackupEntry {
    timestamp: string;
    filePath: string;
    content: string;
    hash: string;
    source: 'ai-apply' | 'manual-edit';
    version: string;
}

export interface IAuditLogEntry {
    timestamp: string;
    files: string[];
    diffHash: string;
    source: 'ai-apply' | 'manual-edit';
    version: string;
    operation: 'apply' | 'rollback';
    success: boolean;
    error?: string;
}

export const ISafeApplyService = createDecorator<ISafeApplyService>('safeApplyService');

export interface ISafeApplyService {
    readonly _serviceBrand: undefined;

    // Backup operations
    createBackup(uri: URI, content: string, source: 'ai-apply' | 'manual-edit'): Promise<string>;
    restoreFromBackup(backupId: string): Promise<boolean>;
    listBackups(): Promise<IBackupEntry[]>;
    cleanupOldBackups(): Promise<void>;

    // Audit logging
    logApply(files: URI[], diffHash: string, source: 'ai-apply' | 'manual-edit', success: boolean, error?: string): Promise<void>;
    logRollback(backupId: string, success: boolean, error?: string): Promise<void>;
    getAuditLog(): Promise<IAuditLogEntry[]>;

    // Rollback commands
    rollbackLastApply(): Promise<boolean>;
    rollbackToBackup(backupId: string): Promise<boolean>;
}

class SafeApplyService extends Disposable implements ISafeApplyService {
    readonly _serviceBrand: undefined;

    private readonly backupDir: string;
    private readonly auditLogPath: string;
    private readonly maxBackups = 50; // Keep last 50 backups

    constructor(
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
        @ICommandService private readonly commandService: ICommandService,
        @INotificationService private readonly notificationService: INotificationService,
    ) {
        super();

        // Create .cortexide directory structure
        this.backupDir = join(process.cwd(), '.cortexide', 'backups');
        this.auditLogPath = join(process.cwd(), '.cortexide', 'audit', 'log.jsonl');

        this._initializeDirectories();
    }

    private async _initializeDirectories(): Promise<void> {
        try {
            // Create backup directory
            const backupDirUri = URI.file(this.backupDir);
            if (!(await this.fileService.exists(backupDirUri))) {
                await this.fileService.createFolder(backupDirUri);
            }

            // Create audit log directory
            const auditDirUri = URI.file(join(process.cwd(), '.cortexide', 'audit'));
            if (!(await this.fileService.exists(auditDirUri))) {
                await this.fileService.createFolder(auditDirUri);
            }

            // Create audit log file if it doesn't exist
            const auditLogUri = URI.file(this.auditLogPath);
            if (!(await this.fileService.exists(auditLogUri))) {
                await this.fileService.writeFile(auditLogUri, Buffer.from(''));
            }

            this.logService.info('SafeApplyService: Initialized backup and audit directories');
        } catch (error) {
            this.logService.error('SafeApplyService: Failed to initialize directories', error);
        }
    }

    private _generateTimestamp(): string {
        const now = new Date();
        return now.toISOString().replace(/[:.]/g, '-');
    }

    private _generateHash(content: string): string {
        // Simple hash function for browser compatibility
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).substring(0, 16);
    }

    private _getBackupPath(timestamp: string, relativePath: string): string {
        const sanitizedPath = relativePath.replace(/[^a-zA-Z0-9._-]/g, '_');
        return join(this.backupDir, timestamp, sanitizedPath);
    }

    async createBackup(uri: URI, content: string, source: 'ai-apply' | 'manual-edit'): Promise<string> {
        try {
            const timestamp = this._generateTimestamp();
            const relativePath = uri.fsPath.replace(process.cwd(), '').replace(/^\//, '');
            const backupPath = this._getBackupPath(timestamp, relativePath);
            const hash = this._generateHash(content);

            // Create timestamp directory
            const timestampDir = URI.file(join(this.backupDir, timestamp));
            if (!(await this.fileService.exists(timestampDir))) {
                await this.fileService.createFolder(timestampDir);
            }

            // Write backup file
            await this.fileService.writeFile(URI.file(backupPath), Buffer.from(content));

            // Create backup metadata
            const backupEntry: IBackupEntry = {
                timestamp,
                filePath: relativePath,
                content,
                hash,
                source,
                version: '0.1.0'
            };

            const metadataPath = join(this.backupDir, timestamp, 'metadata.json');
            await this.fileService.writeFile(URI.file(metadataPath), Buffer.from(JSON.stringify(backupEntry, null, 2)));

            this.logService.info(`SafeApplyService: Created backup for ${relativePath} at ${timestamp}`);
            return timestamp;
        } catch (error) {
            this.logService.error('SafeApplyService: Failed to create backup', error);
            throw error;
        }
    }

    async restoreFromBackup(backupId: string): Promise<boolean> {
        try {
            const metadataPath = join(this.backupDir, backupId, 'metadata.json');
            const metadataUri = URI.file(metadataPath);

            if (!(await this.fileService.exists(metadataUri))) {
                this.logService.error(`SafeApplyService: Backup metadata not found for ${backupId}`);
                return false;
            }

            const metadataContent = await this.fileService.readFile(metadataUri);
            const backupEntry: IBackupEntry = JSON.parse(metadataContent.value.toString());

            const backupPath = this._getBackupPath(backupId, backupEntry.filePath);
            const backupUri = URI.file(backupPath);

            if (!(await this.fileService.exists(backupUri))) {
                this.logService.error(`SafeApplyService: Backup file not found for ${backupId}`);
                return false;
            }

            const backupContent = await this.fileService.readFile(backupUri);
            const originalUri = URI.file(join(process.cwd(), backupEntry.filePath));

            // Restore the file
            await this.fileService.writeFile(originalUri, backupContent.value);

            this.logService.info(`SafeApplyService: Restored backup ${backupId} for ${backupEntry.filePath}`);
            return true;
        } catch (error) {
            this.logService.error('SafeApplyService: Failed to restore backup', error);
            return false;
        }
    }

    async listBackups(): Promise<IBackupEntry[]> {
        try {
            const backupDirUri = URI.file(this.backupDir);
            if (!(await this.fileService.exists(backupDirUri))) {
                return [];
            }

            const children = await this.fileService.resolve(backupDirUri);
            const backups: IBackupEntry[] = [];

            for (const child of children.children || []) {
                if (child.isDirectory) {
                    const metadataPath = join(child.resource.fsPath, 'metadata.json');
                    const metadataUri = URI.file(metadataPath);

                    if (await this.fileService.exists(metadataUri)) {
                        try {
                            const metadataContent = await this.fileService.readFile(metadataUri);
                            const backupEntry: IBackupEntry = JSON.parse(metadataContent.value.toString());
                            backups.push(backupEntry);
                        } catch (error) {
                            this.logService.warn(`SafeApplyService: Failed to read metadata for ${child.name}`, error);
                        }
                    }
                }
            }

            // Sort by timestamp (newest first)
            return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        } catch (error) {
            this.logService.error('SafeApplyService: Failed to list backups', error);
            return [];
        }
    }

    async cleanupOldBackups(): Promise<void> {
        try {
            const backups = await this.listBackups();
            if (backups.length <= this.maxBackups) {
                return;
            }

            const toDelete = backups.slice(this.maxBackups);
            for (const backup of toDelete) {
                const backupDir = join(this.backupDir, backup.timestamp);
                const backupDirUri = URI.file(backupDir);

                if (await this.fileService.exists(backupDirUri)) {
                    await this.fileService.del(backupDirUri, { recursive: true });
                    this.logService.info(`SafeApplyService: Cleaned up old backup ${backup.timestamp}`);
                }
            }
        } catch (error) {
            this.logService.error('SafeApplyService: Failed to cleanup old backups', error);
        }
    }

    async logApply(files: URI[], diffHash: string, source: 'ai-apply' | 'manual-edit', success: boolean, error?: string): Promise<void> {
        try {
            const logEntry: IAuditLogEntry = {
                timestamp: new Date().toISOString(),
                files: files.map(uri => uri.fsPath),
                diffHash,
                source,
                version: '0.1.0',
                operation: 'apply',
                success,
                error
            };

            const logLine = JSON.stringify(logEntry) + '\n';
            const auditLogUri = URI.file(this.auditLogPath);

            // Append to audit log
            const existingContent = await this.fileService.readFile(auditLogUri);
            const newContent = existingContent.value.toString() + logLine;
            await this.fileService.writeFile(auditLogUri, Buffer.from(newContent));

            this.logService.info(`SafeApplyService: Logged apply operation for ${files.length} files`);
        } catch (error) {
            this.logService.error('SafeApplyService: Failed to log apply operation', error);
        }
    }

    async logRollback(backupId: string, success: boolean, error?: string): Promise<void> {
        try {
            const logEntry: IAuditLogEntry = {
                timestamp: new Date().toISOString(),
                files: [backupId], // Using backupId as file identifier
                diffHash: '',
                source: 'ai-apply',
                version: '0.1.0',
                operation: 'rollback',
                success,
                error
            };

            const logLine = JSON.stringify(logEntry) + '\n';
            const auditLogUri = URI.file(this.auditLogPath);

            // Append to audit log
            const existingContent = await this.fileService.readFile(auditLogUri);
            const newContent = existingContent.value.toString() + logLine;
            await this.fileService.writeFile(auditLogUri, Buffer.from(newContent));

            this.logService.info(`SafeApplyService: Logged rollback operation for ${backupId}`);
        } catch (error) {
            this.logService.error('SafeApplyService: Failed to log rollback operation', error);
        }
    }

    async getAuditLog(): Promise<IAuditLogEntry[]> {
        try {
            const auditLogUri = URI.file(this.auditLogPath);
            if (!(await this.fileService.exists(auditLogUri))) {
                return [];
            }

            const content = await this.fileService.readFile(auditLogUri);
            const lines = content.value.toString().trim().split('\n').filter(line => line.trim());

            return lines.map(line => {
                try {
                    return JSON.parse(line) as IAuditLogEntry;
                } catch (error) {
                    this.logService.warn('SafeApplyService: Failed to parse audit log line', line);
                    return null;
                }
            }).filter(entry => entry !== null) as IAuditLogEntry[];
        } catch (error) {
            this.logService.error('SafeApplyService: Failed to read audit log', error);
            return [];
        }
    }

    async rollbackLastApply(): Promise<boolean> {
        try {
            const backups = await this.listBackups();
            if (backups.length === 0) {
                this.notificationService.info('No backups available to rollback');
                return false;
            }

            const latestBackup = backups[0];
            const success = await this.restoreFromBackup(latestBackup.timestamp);

            if (success) {
                await this.logRollback(latestBackup.timestamp, true);
                this.notificationService.info(`Rolled back to backup from ${latestBackup.timestamp}`);
            } else {
                await this.logRollback(latestBackup.timestamp, false, 'Failed to restore backup');
                this.notificationService.error('Failed to rollback to last backup');
            }

            return success;
        } catch (error) {
            this.logService.error('SafeApplyService: Failed to rollback last apply', error);
            this.notificationService.error('Failed to rollback: ' + error);
            return false;
        }
    }

    async rollbackToBackup(backupId: string): Promise<boolean> {
        try {
            const success = await this.restoreFromBackup(backupId);

            if (success) {
                await this.logRollback(backupId, true);
                this.notificationService.info(`Rolled back to backup ${backupId}`);
            } else {
                await this.logRollback(backupId, false, 'Failed to restore backup');
                this.notificationService.error(`Failed to rollback to backup ${backupId}`);
            }

            return success;
        } catch (error) {
            this.logService.error('SafeApplyService: Failed to rollback to backup', error);
            this.notificationService.error('Failed to rollback: ' + error);
            return false;
        }
    }
}

// Register the service
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';

registerSingleton(ISafeApplyService, SafeApplyService, InstantiationType.Eager);
