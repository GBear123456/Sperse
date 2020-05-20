/** Core imports */
import { Component, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { forkJoin } from 'rxjs';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FileSizePipe } from '@shared/common/pipes/file-size.pipe';
import { ImportServiceProxy } from '@shared/service-proxies/service-proxies';
import { ImportLeadsService } from '../import-leads.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';

@Component({
    templateUrl: './import-list.component.html',
    styleUrls: ['./import-list.component.less'],
    animations: [appModuleAnimation()],
    providers: [ FileSizePipe ]
})
export class ImportListComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

    private rootComponent: any;
    private readonly dataSourceURI = 'Import';

    public toolbarConfig: any = [];
    public selectedRowIds: number[] = [];
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: true,
            action: this.navigateToWizard.bind(this),
            label: this.l('AddNewImport')
        }
    ];

    constructor(injector: Injector,
        private importLeadsService: ImportLeadsService,
        private sizeFormatPipe: FileSizePipe,
        private importProxy: ImportServiceProxy
    ) {
        super(injector);
        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                paginate: true,
                key: 'Id'
            }
        };
        this.initToolbarConfig();
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'back',
                        action: this.navigateToDashboard.bind(this)
                    }
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
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
                location: 'after',
                locateInMenu: 'auto',
                items: [
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
                    }
                ]
            }
        ];
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.dataGrid);
    }

    onContentReady(event) {
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

    navigateToDashboard() {
        this._router.navigate(['app/crm/dashboard']);
    }

    navigateToWizard() {
        if (this.componentIsActivated)
            this._router.navigate(['app/crm/import-leads']);
    }

    deleteImport() {
        this.message.confirm(
            this.l('LeadsDeleteComfirmation', [this.selectedRowIds.length]),
            isConfirmed => {
                if (isConfirmed)
                    forkJoin(
                        this.selectedRowIds.map((id) => {
                            return this.importProxy.delete(id);
                        })
                    ).subscribe(() => {
                        this.invalidate();
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
                          return this.importProxy.cancel(id);
                      })
                  ).subscribe(() => {
                      this.invalidate();
                  });
            });
    }

    onCellClick($event) {
        if ($event.rowType == 'data' && $event.column.dataField == 'FileName') {
            this.importProxy.getFileUrl($event.data.Id).subscribe((responce) => {
                if (responce && responce.url)
                    window.open(responce.url, '_self');
            });
        }
    }

    fileSizeFormat = (data) => {
        return this.sizeFormatPipe.transform(data.FileSize);
    }

    activate() {
        this.rootComponent.overflowHidden(true);
        this.invalidate();
    }

    deactivate() {
        this.rootComponent.overflowHidden();
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.activate();
    }

    ngOnDestroy() {
        this.deactivate();
    }
}
