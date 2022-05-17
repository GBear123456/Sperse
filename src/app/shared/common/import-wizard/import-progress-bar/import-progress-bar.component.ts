/** Core imports */
import { Component, Input, OnDestroy } from '@angular/core';

/** Application imports */
import { ImportStatus } from '@shared/AppEnums';
import { ImportWizardService } from '../import-wizard.service';
import { MessageService } from 'abp-ng2-module';
import { AppLocalizationService } from '../../localization/app-localization.service';

@Component({
    selector: 'import-progress-bar',
    templateUrl: 'import-progress-bar.component.html',
    styleUrls: ['import-progress-bar.component.less']
})
export class ImportProgressBarComponent implements OnDestroy {
    @Input() summaryTooltip = true;
    importStatuses = ImportStatus;
    progress = 100;
    tooltipVisible: boolean;
    tooltipTimeout: any;
    totalCount = 0;
    importedCount = 0;
    failedCount = 0;
    list: any = [];
    private subscription: any;

    constructor(
        private importService: ImportWizardService,
        private messageService: MessageService,
        public ls: AppLocalizationService
    ) {
        this.subscription = importService.progressListen((data) => {
            if (data && data.length) {
                this.progress = 0;
                this.list = data;
                data.forEach((entity) => {
                    entity.progress = Math.round((entity.importedCount
                        + entity.failedCount) / entity.totalCount * 100);
                    this.progress += entity.progress;
                });
                this.progress = Math.round(this.progress / data.length);
                if (this.progress >= 100)
                    importService.finishStatusCheck(true);
            } else {
                this.progress = 100;
                importService.finishStatusCheck(true);
            }
        });
    }

    showStatus = () => {
        return this.progress + '% ' + this.ls.l('ImportProgress');
    }

    cancelImport(importId?: number) {
        this.tooltipVisible = false;
        this.messageService.confirm(
            this.ls.l('ImportCancelConfirmation'),
            this.ls.l(importId ? 'CancelImport' : 'CancelAllImports'),
            isConfirmed => {
                if (isConfirmed)
                    this.importService.cancelImport(importId ?
                        [importId] : this.list.map((item) => item.id));
            }
        );
    }

    toggleTooltip(visible) {
        if (this.summaryTooltip) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = setTimeout(() => {
                this.tooltipVisible =  visible;
            }, 1000);
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
