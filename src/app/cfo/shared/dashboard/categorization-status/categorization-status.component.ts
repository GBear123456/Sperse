import {Component, Injector, OnInit} from '@angular/core';
import {CFOComponentBase} from '@app/cfo/shared/common/cfo-component-base';
import {DashboardServiceProxy, InstanceType} from '@shared/service-proxies/service-proxies';
import {Router} from '@angular/router';

@Component({
    selector: 'app-categorization-status',
    templateUrl: './categorization-status.component.html',
    styleUrls: ['./categorization-status.component.less'],
    providers: [DashboardServiceProxy]
})
export class CategorizationStatusComponent extends CFOComponentBase implements OnInit {
    private categorySynchData: any;
    constructor(
        injector: Injector,
        private _dashboardService: DashboardServiceProxy,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit() {
        this.getCategorizationStatus();
    }

    getCategorizationStatus(): void {
        this._dashboardService.getCategorizationStatus(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                this.categorySynchData = result;
                this.categorySynchData.totalCount = this.categorySynchData.classifiedTransactionCount + this.categorySynchData.unclassifiedTransactionCount;
            });
    }
    
    navigateTo() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/transactions']);
    }

}
