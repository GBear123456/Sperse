/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable, Subject, of } from 'rxjs';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { ReportsServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.less'],
    providers: [ ReportsServiceProxy ]
})
export class ReportsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    headlineConfig;
    menuItems = [
         {
             caption: 'MonthlyReports'
         },
         {
             caption: 'QuarterlyReports'
         },
         {
             caption: 'AnnualReports'             
         }
     ];

    constructor(
        private injector: Injector,
        private _appService: AppService,
        public reportsProxy: ReportsServiceProxy
    ) {
        super(injector);
        
    }

    ngOnInit(): void {
        this.initHeadlineConfig();
    }

    ngAfterViewInit(): void {
        this.activate();
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('REPORTS')],
            onRefresh: () => {
            },
            iconSrc: './assets/common/icons/credit-card-icon.svg'
        };
    }

    onMenuClick(item) {
    }

    ngOnDestroy() {
        this.deactivate();
    }

    activate() {
        this.getRootComponent().overflowHidden(true);
    }

    deactivate() {
        this.getRootComponent().overflowHidden();
    }
}