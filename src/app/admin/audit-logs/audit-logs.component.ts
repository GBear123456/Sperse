/** Core imports */
import { Component, ChangeDetectionStrategy, Injector, ViewChild, OnDestroy, OnInit } from '@angular/core';

/** Third party imports */
import * as moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { takeUntil } from 'rxjs/operators';

/** Application imports */
import { AuditLogDetailModalComponent } from '@app/admin/audit-logs/audit-log-detail-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AuditLogListDto, AuditLogServiceProxy } from '@shared/service-proxies/service-proxies';
import { FileDownloadService } from '@shared/utils/file-download.service';
import DataSource from 'devextreme/data/data_source';
import { AppService } from '@app/app.service';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FiltersService } from '@shared/filters/filters.service';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    templateUrl: './audit-logs.component.html',
    styleUrls: ['./audit-logs.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [appModuleAnimation()]
})
export class AuditLogsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    private rootComponent: any;
    public headlineConfig = {
        names: [this.l('AuditLogs')],
        icon: '',
        onRefresh: this.refreshData.bind(this),
        buttons: []
    };
    private filtersValues = {
        date: {
            startDate: moment().startOf('day'),
            endDate: moment().endOf('day')
        },
        userId: undefined,
        userName: undefined,
        usernameEntityChange: undefined,
        serviceName: undefined,
        methodName: undefined,
        browserInfo: undefined,
        hasException: [],
        minExecutionDuration: undefined,
        maxExecutionDuration: undefined,
        entityTypeFullName: undefined
    };
    private dateFilterModel: FilterModel;
    private filtersModels: FilterModel[] = [
        this.dateFilterModel = new FilterModel({
            component: FilterCalendarComponent,
            caption: 'date',
            operator: { from: 'startDate', to: 'endDate' },
            field: 'date',
            items: {
                from: new FilterItemModel(DateHelper.addTimezoneOffset(this.filtersValues.date.startDate.toDate(), true)),
                to: new FilterItemModel(DateHelper.addTimezoneOffset(this.filtersValues.date.endDate.toDate(), true))
            },
            options: {method: 'getFilterByDate', params: { useUserTimezone: true }}
        }),
        new FilterModel({
            component: FilterInputsComponent,
            operator: 'startswith',
            caption: 'userId',
            items: { ['User Id']: new FilterItemModel()}
        }),
        new FilterModel({
            component: FilterInputsComponent,
            operator: 'startswith',
            caption: 'userName',
            items: { ['User Name']: new FilterItemModel()}
        }),
        new FilterModel({
            component: FilterInputsComponent,
            operator: 'startswith',
            caption: 'serviceName',
            items: { ['Service Name']: new FilterItemModel()}
        }),
        new FilterModel({
            component: FilterInputsComponent,
            operator: 'startswith',
            caption: 'methodName',
            items: { ['Method Name']: new FilterItemModel()}
        }),
        new FilterModel({
            component: FilterInputsComponent,
            operator: 'startswith',
            caption: 'browserInfo',
            items: { ['Browser Info']: new FilterItemModel()}
        }),
        new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'hasException',
            items: {
                element: new FilterCheckBoxesModel({
                    dataSource: [
                        {
                            id: '1',
                            name: this.l('Has Exceptions')
                        }
                    ],
                    nameField: 'name',
                    keyExpr: 'id',
                    value: []
                })
            }
        }),
        new FilterModel({
            component: FilterInputsComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'executionDuration',
            field: 'executionDuration',
            items: { ['Min Execution Duration']: new FilterItemModel(), ['Max Execution Duration']: new FilterItemModel() }
        })
    ];
    operationLogsDataSource: DataSource;

    constructor(
        injector: Injector,
        private _auditLogService: AuditLogServiceProxy,
        private _appService: AppService,
        private _fileDownloadService: FileDownloadService,
        private _dialog: MatDialog,
        private _filtersService: FiltersService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnInit() {
        this._filtersService.filtersValues$
            .pipe(takeUntil(this.destroy$))
            .subscribe(filtersValues => {
                this.filtersValues = filtersValues;
                this.refreshData();
            });
        this.dateFilterModel.updateCaptions();
        this.operationLogsDataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                return this._auditLogService.getAuditLogs(
                    this.filtersValues.date.startDate,
                    this.filtersValues.date.endDate,
                    this.filtersValues.userId,
                    this.filtersValues.userName,
                    this.filtersValues.serviceName,
                    this.filtersValues.methodName,
                    this.filtersValues.browserInfo,
                    !!this.filtersValues.hasException[0],
                    this.filtersValues.minExecutionDuration,
                    this.filtersValues.maxExecutionDuration,
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
        this.initFilterConfig();
    }

    initToolbarConfig() {
        this._appService.updateToolbar([
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
                            // setTimeout(() => {
                            //     this.dataGrid.instance.repaint();
                            // }, 1000);
                            this._filtersService.fixed = !this._filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this._filtersService.fixed;
                            },
                            mouseover: () => {
                                this._filtersService.enable();
                            },
                            mouseout: () => {
                                if (!this._filtersService.fixed)
                                    this._filtersService.disable();
                            }
                        },
                        attr: {
                            'filter-selected': this._filtersService.hasFilterSelected
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
        this._auditLogService.getAuditLogsToExcel(
            this.filtersValues.date.startDate,
            this.filtersValues.date.endDate,
            this.filtersValues.userId,
            this.filtersValues.userName,
            this.filtersValues.serviceName,
            this.filtersValues.methodName,
            this.filtersValues.browserInfo,
            !!this.filtersValues.hasException[0],
            this.filtersValues.minExecutionDuration,
            this.filtersValues.maxExecutionDuration,
            undefined,
            1,
            0)
            .subscribe(result => {
                this._fileDownloadService.downloadTempFile(result);
            });
    }

    exportToExcelEntityChanges(): void {
        this._auditLogService.getEntityChangesToExcel(
            this.filtersValues.date.startDate,
            this.filtersValues.date.endDate,
            this.filtersValues.usernameEntityChange,
            this.filtersValues.entityTypeFullName,
            undefined,
            1,
            0)
            .subscribe(result => {
                this._fileDownloadService.downloadTempFile(result);
            });
    }

    truncateStringWithPostfix(text: string, length: number): string {
        return abp.utils.truncateStringWithPostfix(text, length);
    }

    initFilterConfig() {
        this._filtersService.setup(this.filtersModels);
    }

    refreshData(): void {
        this.dataGrid.instance.refresh();
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden(false);
        this._appService.updateToolbar(null);
        this._filtersService.unsubscribe();
    }
}
