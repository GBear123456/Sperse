/** Core imports */
import { Component, Injector, ViewChild, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

/** Third party imports */
import * as moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { AuditLogDetailModalComponent } from '@app/admin/audit-logs/audit-log-detail-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AuditLogListDto, AuditLogServiceProxy, NameValueDto } from '@shared/service-proxies/service-proxies';
import { FileDownloadService } from '@shared/utils/file-download.service';
import DataSource from 'devextreme/data/data_source';
import { AppService } from '@app/app.service';

@Component({
    templateUrl: './audit-logs.component.html',
    styleUrls: ['./audit-logs.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [appModuleAnimation()]
})
export class AuditLogsComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    //Filters
    public startDate: moment.Moment = moment().startOf('day');
    public endDate: moment.Moment = moment().endOf('day');
    public usernameAuditLog: string;
    public usernameEntityChange: string;
    public serviceName: string;
    public methodName: string;
    public browserInfo: string;
    public hasException: boolean = undefined;
    public minExecutionDuration: number;
    public maxExecutionDuration: number;
    public entityTypeFullName: string;
    public objectTypes: NameValueDto[];
    private rootComponent: any;
    public headlineConfig = {
        names: [this.l('AuditLogs')],
        icon: '',
        onRefresh: this.refreshData.bind(this),
        buttons: []
    };
    operationLogsDataSource: DataSource;
    changeLogsDataSource: DataSource;

    constructor(
        injector: Injector,
        private _auditLogService: AuditLogServiceProxy,
        private _appService: AppService,
        private _fileDownloadService: FileDownloadService,
        private _dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);


        this.operationLogsDataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                return this._auditLogService.getAuditLogs(
                    this.startDate,
                    this.endDate,
                    undefined,
                    this.usernameAuditLog,
                    this.serviceName,
                    this.methodName,
                    this.browserInfo,
                    this.hasException,
                    this.minExecutionDuration,
                    this.maxExecutionDuration,
                    (loadOptions.sort || []).map((item) => {
                        return item.selector + ' ' + (item.desc ? 'DESC' : 'ASC');
                    }).join(','),
                    loadOptions.take,
                    loadOptions.skip
                ).toPromise().then(response => {
                    return {
                        data: response.items,
                        totalCount: response.totalCount
                    };
                });
            }
        });

        this.initToolbarConfig();
    }

    initToolbarConfig() {
        this._appService.updateToolbar([
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: Function(),
                        enabled: false,
                        attr: {
                            'filter-selected': false
                        }
                    }
                ]
            },
            {
                location: 'before',
                items: [
                    {
                        name: 'search',
                        widget: 'dxTextBox',
                        options: {
                            value: this.searchValue,
                            width: '279',
                            mode: 'search',
                            placeholder: this.l('Search') + ' ' + this.l('Logs by action').toLowerCase(),
                            onValueChanged: (e) => {
                                this.searchValueChange(e);
                            }
                        }
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
                    },
                    { name: 'print', action: Function() }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    { name: 'showCompactRowsHeight', action: this.showCompactRowsHeight.bind(this) },
                    { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'fullscreen',
                        action: () => {
                            this.toggleFullscreen(document.documentElement);
                            setTimeout(() => this.dataGrid.instance.repaint(), 100);
                        }
                    }
                ]
            }
        ]);
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.initToolbarConfig();
        if (this.searchValue)
            this.dataGrid.instance.filter(['displayName', 'contains', this.searchValue]);
        else
            this.dataGrid.instance.clearFilter();
    }

    openAuditLogDetailModal(record: AuditLogListDto) {
        const dialogRef = this._dialog.open(AuditLogDetailModalComponent, {
            panelClass: 'slider',
            data: {
                record: record
            }
        });
        dialogRef.afterClosed().subscribe(() => {});
    }

    exportToExcelAuditLogs(): void {
        const self = this;
        self._auditLogService.getAuditLogsToExcel(
            self.startDate,
            self.endDate,
            undefined,
            self.usernameAuditLog,
            self.serviceName,
            self.methodName,
            self.browserInfo,
            self.hasException,
            self.minExecutionDuration,
            self.maxExecutionDuration,
            undefined,
            1,
            0)
            .subscribe(result => {
                self._fileDownloadService.downloadTempFile(result);
            });
    }

    exportToExcelEntityChanges(): void {
        const self = this;
        self._auditLogService.getEntityChangesToExcel(
            self.startDate,
            self.endDate,
            self.usernameEntityChange,
            self.entityTypeFullName,
            undefined,
            1,
            0)
            .subscribe(result => {
                self._fileDownloadService.downloadTempFile(result);
            });
    }

    truncateStringWithPostfix(text: string, length: number): string {
        return abp.utils.truncateStringWithPostfix(text, length);
    }

    refreshData(): void {
        this.dataGrid.instance.refresh();
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden(false);
        this._appService.updateToolbar(null);
    }
}
