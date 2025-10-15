/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { ISafeApplyService } from './safeApplyService.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';
import { localize } from '../../../../nls.js';

export const CORTEXIDE_ROLLBACK_LAST_APPLY_COMMAND = 'cortexide.rollbackLastApply';
export const CORTEXIDE_ROLLBACK_TO_BACKUP_COMMAND = 'cortexide.rollbackToBackup';
export const CORTEXIDE_SHOW_BACKUPS_COMMAND = 'cortexide.showBackups';
export const CORTEXIDE_SHOW_AUDIT_LOG_COMMAND = 'cortexide.showAuditLog';

export function registerSafeApplyCommands(
	commandService: ICommandService,
	instantiationService: IInstantiationService
): void {

	// Rollback Last Apply Command
	commandService.registerCommand({
		id: CORTEXIDE_ROLLBACK_LAST_APPLY_COMMAND,
		title: localize('cortexide.rollbackLastApply', 'CorteXIDE: Restore Last AI Edit'),
		category: 'CorteXIDE',
		handler: async () => {
			const safeApplyService = instantiationService.invokeFunction(accessor => accessor.get(ISafeApplyService));
			const notificationService = instantiationService.invokeFunction(accessor => accessor.get(INotificationService));

			try {
				const success = await safeApplyService.rollbackLastApply();
				if (success) {
					notificationService.info('Successfully restored last AI edit');
				}
			} catch (error) {
				notificationService.error('Failed to restore last AI edit: ' + error);
			}
		}
	});

	// Rollback to Specific Backup Command
	commandService.registerCommand({
		id: CORTEXIDE_ROLLBACK_TO_BACKUP_COMMAND,
		title: localize('cortexide.rollbackToBackup', 'CorteXIDE: Restore from Backup'),
		category: 'CorteXIDE',
		handler: async () => {
			const safeApplyService = instantiationService.invokeFunction(accessor => accessor.get(ISafeApplyService));
			const quickInputService = instantiationService.invokeFunction(accessor => accessor.get(IQuickInputService));
			const notificationService = instantiationService.invokeFunction(accessor => accessor.get(INotificationService));

			try {
				const backups = await safeApplyService.listBackups();
				if (backups.length === 0) {
					notificationService.info('No backups available');
					return;
				}

				// Create quick pick items
				const items = backups.map(backup => ({
					label: `${backup.timestamp}`,
					description: `${backup.filePath} (${backup.source})`,
					detail: `Hash: ${backup.hash}`,
					backup
				}));

				const selected = await quickInputService.pick(items, {
					placeHolder: 'Select a backup to restore',
					title: 'CorteXIDE: Restore from Backup'
				});

				if (selected) {
					const success = await safeApplyService.rollbackToBackup(selected.backup.timestamp);
					if (success) {
						notificationService.info(`Successfully restored backup from ${selected.backup.timestamp}`);
					}
				}
			} catch (error) {
				notificationService.error('Failed to restore backup: ' + error);
			}
		}
	});

	// Show Backups Command
	commandService.registerCommand({
		id: CORTEXIDE_SHOW_BACKUPS_COMMAND,
		title: localize('cortexide.showBackups', 'CorteXIDE: Show Backups'),
		category: 'CorteXIDE',
		handler: async () => {
			const safeApplyService = instantiationService.invokeFunction(accessor => accessor.get(ISafeApplyService));
			const notificationService = instantiationService.invokeFunction(accessor => accessor.get(INotificationService));

			try {
				const backups = await safeApplyService.listBackups();
				if (backups.length === 0) {
					notificationService.info('No backups available');
					return;
				}

				const backupList = backups.map(backup =>
					`• ${backup.timestamp}: ${backup.filePath} (${backup.source})`
				).join('\n');

				notificationService.info(`Available backups:\n${backupList}`);
			} catch (error) {
				notificationService.error('Failed to list backups: ' + error);
			}
		}
	});

	// Show Audit Log Command
	commandService.registerCommand({
		id: CORTEXIDE_SHOW_AUDIT_LOG_COMMAND,
		title: localize('cortexide.showAuditLog', 'CorteXIDE: Show Audit Log'),
		category: 'CorteXIDE',
		handler: async () => {
			const safeApplyService = instantiationService.invokeFunction(accessor => accessor.get(ISafeApplyService));
			const notificationService = instantiationService.invokeFunction(accessor => accessor.get(INotificationService));

			try {
				const auditLog = await safeApplyService.getAuditLog();
				if (auditLog.length === 0) {
					notificationService.info('No audit log entries available');
					return;
				}

				const recentEntries = auditLog.slice(0, 10); // Show last 10 entries
				const logEntries = recentEntries.map(entry =>
					`• ${entry.timestamp}: ${entry.operation} (${entry.source}) - ${entry.success ? 'Success' : 'Failed'}`
				).join('\n');

				notificationService.info(`Recent audit log entries:\n${logEntries}`);
			} catch (error) {
				notificationService.error('Failed to read audit log: ' + error);
			}
		}
	});
}
