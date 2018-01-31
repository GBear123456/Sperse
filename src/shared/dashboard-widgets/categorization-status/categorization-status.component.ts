import {Component, Injector, OnInit} from '@angular/core';
import {CFOComponentBase} from 'app/cfo/shared/common/cfo-component-base';
import {DashboardServiceProxy, ClassificationServiceProxy, InstanceType, AutoClassifyDto, ResetClassificationDto} from 'shared/service-proxies/service-proxies';
import {Router} from '@angular/router';
import {AppConsts} from "@shared/AppConsts";

@Component({
    selector: 'app-categorization-status',
    templateUrl: './categorization-status.component.html',
    styleUrls: ['./categorization-status.component.less'],
    providers: [DashboardServiceProxy, ClassificationServiceProxy]
})
export class CategorizationStatusComponent extends CFOComponentBase implements OnInit {
    categorySynchData: any;
    private autoClassifyData = new AutoClassifyDto();
    private resetRules = new ResetClassificationDto();
    constructor(
        injector: Injector,
        private _dashboardService: DashboardServiceProxy,
        private _classificationService: ClassificationServiceProxy,
        private _router: Router
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit() {
        this.resetRules.removeRules = true;
        this.resetRules.removeForecasts = true;
        this.resetRules.removeCategoryTree = true; // todo: temporarily, modal window will be added with the possibility to select the rule, this will be removed
        this.getCategorizationStatus();
    }

    getCategorizationStatus(): void {
        this._dashboardService.getCategorizationStatus(InstanceType[this.instanceType], this.instanceId)
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

    navigateTo() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/transactions']);
    }
}
