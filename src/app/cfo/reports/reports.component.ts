/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable, Subject, of } from 'rxjs';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.less'],
    providers: [  ]
})
export class ReportsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    public headlineConfig;

    constructor(
        private injector: Injector,
        private _appService: AppService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.initHeadlineConfig();
    }

    ngAfterViewInit(): void {
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('REPORTS')],
            onRefresh: () => {
            },
            iconSrc: './assets/common/icons/credit-card-icon.svg'
        };
    }

    ngOnDestroy() {
        this.deactivate();
        super.ngOnDestroy();
    }

    activate() {
        this.getRootComponent().overflowHidden(true);
    }

    deactivate() {
        this.getRootComponent().overflowHidden();
    }
}
