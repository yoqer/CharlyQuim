/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { ISafeApplyService } from './safeApplyService.js';
import { IEditCodeService } from './editCodeServiceInterface.js';
import { SafeApplyIntegration } from './safeApplyIntegration.js';
import { registerSafeApplyCommands } from './safeApplyCommands.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';

export class SafeApplyContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.safeApply';
	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@ICommandService private readonly commandService: ICommandService,
		@ISafeApplyService private readonly safeApplyService: ISafeApplyService,
		@IEditCodeService private readonly editCodeService: IEditCodeService,
		@ILogService private readonly logService: ILogService,
	) {
		super();
		this._initialize();
	}

	private _initialize(): void {
		try {
			// Register Safe Apply commands
			registerSafeApplyCommands(this.commandService, this.instantiationService);

			// Create Safe Apply integration
			const safeApplyIntegration = this.instantiationService.createInstance(SafeApplyIntegration);
			this._register(safeApplyIntegration);

			// Cleanup old backups on startup
			this.safeApplyService.cleanupOldBackups().catch(error => {
				this.logService.error('SafeApplyContribution: Failed to cleanup old backups', error);
			});

			this.logService.info('SafeApplyContribution: Initialized Safe Apply system');
		} catch (error) {
			this.logService.error('SafeApplyContribution: Failed to initialize', error);
		}
	}
}

// Register the contribution
registerWorkbenchContribution2(SafeApplyContribution.ID, SafeApplyContribution, WorkbenchPhase.Eventually);
