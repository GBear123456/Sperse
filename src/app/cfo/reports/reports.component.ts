/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable, Subject, of } from 'rxjs';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { FileSizePipe } from '@shared/common/pipes/file-size.pipe';
import { ReportsServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.less'],
    providers: [ ReportsServiceProxy, FileSizePipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

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

    formatting = AppConsts.formatting;
    reports$ = of([]);

    constructor(
        private injector: Injector,
        private _appService: AppService,
        private _fileSizePipe: FileSizePipe,
        private _changeDetector: ChangeDetectorRef,
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
                this.dataGrid.instance.refresh();
            },
            iconSrc: './assets/common/icons/credit-card-icon.svg'
        };
    }

    calculateFileSizeValue = (data) => this._fileSizePipe.transform(data.size);
    numerizeFileSizeSortValue = (data) => +data.size;

    onDataGridInit(event) {
        
    }

    onCellClick(event) {
    }

    onContentReady() {
        this.setGridDataLoaded();
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