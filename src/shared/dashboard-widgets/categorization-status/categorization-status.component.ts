import { Component, Injector, OnInit } from '@angular/core';
import { CFOComponentBase } from 'app/cfo/shared/common/cfo-component-base';
import { DashboardServiceProxy, ClassificationServiceProxy, InstanceType, AutoClassifyDto, ResetClassificationDto } from 'shared/service-proxies/service-proxies';
import { Router } from '@angular/router';
import {MatDialog} from '@angular/material';
import {ChooseResetRulesComponent} from './choose-reset-rules/choose-reset-rules.component';

@Component({
    selector: 'app-categorization-status',
    templateUrl: './categorization-status.component.html',
    styleUrls: ['./categorization-status.component.less'],
    providers: [DashboardServiceProxy, ClassificationServiceProxy]
})
export class CategorizationStatusComponent extends CFOComponentBase implements OnInit {
    categorySynchData: any;
    private autoClassifyData = new AutoClassifyDto();
    resetRules = new ResetClassificationDto();
    constructor(
        injector: Injector,
        private _dashboardService: DashboardServiceProxy,
        private _classificationService: ClassificationServiceProxy,
        public dialog: MatDialog,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit() {
        this.getCategorizationStatus();
    }

    getCategorizationStatus(): void {
        this._dashboardService.getCategorizationStatus(InstanceType[this.instanceType], this.instanceId, undefined)
            .subscribe((result) => {
                this.categorySynchData = result;
                this.categorySynchData.totalCount = this.categorySynchData.classifiedTransactionCount + this.categorySynchData.unclassifiedTransactionCount;
            });
    }

    autoClassify(): void {
        this.notify.info('Auto-classification has started');
        this._classificationService.autoClassify(InstanceType[this.instanceType], this.instanceId, this.autoClassifyData)
            .subscribe((result) => {
                this.getCategorizationStatus();
                this.notify.info('Auto-classification has ended');
                return result;
            });
    }

    reset(): void {
        this.notify.info('Reset process has started');
        this._classificationService.reset(InstanceType[this.instanceType], this.instanceId, this.resetRules)
            .subscribe((result) => {
                this.getCategorizationStatus();
                this.notify.info('Reset process has ended');
                return result;
            });
    }

    openDialog(): void {
        let dialogRef = this.dialog.open(ChooseResetRulesComponent, {
            width: '450px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.resetRules = result;
                this.reset();
            }
        });
    }

    filterTransactions(classified: boolean) {
        let filter = {
            classified: {
                yes: undefined,
                no: undefined
            }
        };
        if (classified)
            filter.classified.yes = true;
        else
            filter.classified.no = true;

        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/transactions'], { queryParams: { filters: encodeURIComponent(JSON.stringify(filter)) } });
    }


}
