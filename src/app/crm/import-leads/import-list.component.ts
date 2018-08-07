/** Core imports */
import { Component, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular';
import { forkJoin } from 'rxjs';
import * as _ from 'underscore';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FileSizePipe } from '@shared/common/pipes/file-size.pipe';
import { ImportServiceProxy } from '@shared/service-proxies/service-proxies';

import { ImportWizardService } from '@app/shared/common/import-wizard/import-wizard.service';

@Component({
    templateUrl: './import-list.component.html',
    styleUrls: ['./import-list.component.less'],
    animations: [appModuleAnimation()],
    providers: [ImportServiceProxy, FileSizePipe]
})
export class ImportListComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    private rootComponent: any;
    private readonly dataSourceURI = 'Import';

    public toolbarConfig: any = [];
    public selectedRowIds: number[] = [];
    public showImportWizard = false;
    public headlineConfig: any;

    constructor(injector: Injector,
        private _router: Router,
        private _importService: ImportWizardService,
        private _sizeFormatPipe: FileSizePipe,
        private _importProxy: ImportServiceProxy,
        private _appService: AppService
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                paginate: true,
                key: 'Id'
            }
        };

        this.initHeadlineConfig();
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Import')],
            onRefresh: this.refreshDataGrid.bind(this),
            icon: 'docs',
            buttons: [
                {
                    enabled: true,
                    action: this.navigateToWizard.bind(this),
                    lable: this.l('AddNewImport')
                }
            ]
        };
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    { 
                        name: 'back', 
                        action: this.navigateToDashboard.bind(this) 
                    }
                ]
            },
            {
                location: 'before', items: [
                    { 
                        name: 'cancel', 
                        action: this.cancelImport.bind(this),
                        disabled: !this.selectedRowIds.length
                    }, {   
                        name: 'delete', 
                        action: this.deleteImport.bind(this),
                        disabled: !this.selectedRowIds.length 
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'download',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Download'),
                            items: [{
                                action: Function(),
                                text: this.l('Save as PDF'),
                                icon: 'pdf',
                            }, {
                                action: this.exportToXLS.bind(this),
                                text: this.l('Export to Excel'),
                                icon: 'xls',
                            }, {
                                action: this.exportToCSV.bind(this),
                                text: this.l('Export to CSV'),
                                icon: 'sheet'
                            }, {
                                action: this.exportToGoogleSheet.bind(this),
                                text: this.l('Export to Google Sheets'),
                                icon: 'sheet'
                            }, { type: 'downloadOptions' }]
                        }
                    },
                    { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                ]
            }
        ];
    }

    onContentReady(event) {
        this.finishLoading();
        if (!event.component.totalCount())
            return this.navigateToWizard();

        this.setGridDataLoaded();
        setTimeout(() => 
            event.component.option('visible', true));
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    navigateToDashboard() { 
        this._router.navigate(['app/crm/dashboard']);
    }

    navigateToWizard() {
        this._router.navigate(['app/crm/import-leads']);              
    }

    deleteImport() {
        this.message.confirm(
            this.l('LeadsDeleteComfirmation', [this.selectedRowIds.length]),
            isConfirmed => {
                if (isConfirmed)
                    forkJoin(
                        this.selectedRowIds.map((id) => {
                            return this._importProxy.delete(id);
                        })
                    ).subscribe((res) => {
                        this.refreshDataGrid();
                    });
            });
    }

    cancelImport() {
        this.message.confirm(
            this.l('LeadsCancelComfirmation', [this.selectedRowIds.length]),
            isConfirmed => {
                if (isConfirmed)
                  forkJoin(
                      this.selectedRowIds.map((id) => {
                          return this._importProxy.cancel(id);
                      })
                  ).subscribe((res) => {
                      this.refreshDataGrid();
                  });
            });
    }

    onCellClick($event) {
        if ($event.column.dataField == 'FileName') {
            this._importProxy.getFileUrl($event.data.Id).subscribe((responce) => {
                if (responce && responce.url)
                    window.open(responce.url);
            });
        }            
    }

    fileSizeFormat = (data) => {  
        return this._sizeFormatPipe.transform(data.FileSize);
    }

    activate() {
        if (this.dataGrid && this.dataGrid.instance 
            && !this.dataGrid.instance.totalCount()
        )
            return this.navigateToWizard();

        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();
    }

    deactivate() {
        this._appService.toolbarConfig = null;
        this.rootComponent.overflowHidden();
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.startLoading();
        this.activate();
    }

    ngOnDestroy() {
        this.deactivate();
    }
}