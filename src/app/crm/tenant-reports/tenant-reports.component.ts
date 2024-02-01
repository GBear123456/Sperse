/** Core imports */
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { filter, takeUntil, pluck } from 'rxjs/operators';
import * as moment from 'moment-timezone';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { FiltersService } from '@shared/filters/filters.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import {
    NameValueDto,
    TenantListDto,
    TenantServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppService } from '@app/app.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { ContactGroup } from '@shared/AppEnums';

@Component({
    templateUrl: './tenant-reports.component.html',
    styleUrls: [ './tenant-reports.component.less' ]
})
export class TenantReportsComponent extends AppComponentBase implements OnDestroy, OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ToolBarComponent) toolbarComponent: ToolBarComponent;

    formatting = AppConsts.formatting;

    private filters: FilterModel[];
    public actionMenuItems: ActionMenuItem[] = [
        {
            text: this.l('Unlock'),
            class: 'unlock',
            action: () => {
            }
        }
    ].filter(Boolean);

    tenantName: string = this.route.snapshot.queryParams.name;
    searchValue: string = this.tenantName;
    productId = '-1';
    creationDateStart: moment;
    creationDateEnd: moment;
    public actionRecord: any;
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.Administration),
            action: () => {},
            label: this.l('CreateNewTenant')
        }
    ];
    dataSource: DataSource;
    contactDataSource: DataSource;
    private rootComponent: any;
    impersonateTenantId: number;
    tenantNameFilter = new FilterModel({
        component: FilterInputsComponent,
        operator: 'contains',
        caption: this.l('Name'),
        field: 'name',
        items: { name: new FilterItemModel(this.tenantName)}
    });
    toolbarConfig: ToolbarGroupModel[];
    contactRecords: any[];
    tenantRecords: any[];

    constructor(
        injector: Injector,
        private tenantService: TenantServiceProxy,
        private filtersService: FiltersService,
        private impersonationService: ImpersonationService,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        public appService: AppService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();
        this.initFilterConfig();

        this.dataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                let sortOption = [];
                if (loadOptions.sort)
                    sortOption = loadOptions.sort instanceof Array 
                        ? loadOptions.sort : [loadOptions.sort];
                return this.tenantService.getTenants(
                    this.searchValue || this.tenantName || undefined,
                    this.creationDateStart || undefined,
                    this.creationDateEnd || undefined,
                    this.productId ? parseInt(this.productId) : undefined,
                    !this.productId || parseInt(this.productId) >= 0,
                    sortOption.map(item => {
                        return item.selector + ' ' + (item.desc ? 'DESC' : 'ASC');
                    }).join(','),
                    loadOptions.take || 10000,
                    loadOptions.skip
                ).toPromise().then(response => {
                    this.tenantRecords = response.items;
                    this.contactDataSource.load();
                    this.startLoading();                    
                    return {
                        data: response.items,
                        totalCount: response.totalCount
                    };
                });
            }
        });
        this.contactDataSource = new DataSource({
            store: new ODataStore({
                key: 'Id',
                url: this.getODataUrl('Contact'),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {     
                    request.params.$filter = 'CompanyName in (' + this.tenantRecords.map(tenant => "'" + tenant.name + "'") + ')';
                    request.params.contactGroupId = ContactGroup.Client;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                onLoaded: (records) => {
                    this.contactRecords = records;
                    this.finishLoading();
                },
                errorHandler: (error) => {

                }
            })
        });
    }

    ngOnInit() {
        this.route.queryParams.pipe(
            takeUntil(this.destroy$),
            pluck('name'),
            filter((tenantName: string) => tenantName && this.tenantName !== tenantName)
        ).subscribe((tenantName: string) => {
            this.searchValue = this.tenantName = this.tenantNameFilter.items.name.value = tenantName;
            this.tenantNameFilter.updateCaptions();
            this.initFilterConfig();
            this.filtersService.change([this.tenantNameFilter]);
        });
    }

    repaintDataGrid(delay = 0) {
        setTimeout(() => this.dataGrid.instance.repaint(), delay);
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
                            this.repaintDataGrid(1000);
                            this.filtersService.fixed = !this.filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this.filtersService.fixed;
                            },
                            mouseover: () => {
                                this.filtersService.enable();
                            },
                            mouseout: () => {
                                if (!this.filtersService.fixed)
                                    this.filtersService.disable();
                            }
                        },
                        attr: {
                            'filter-selected': this.filtersService.hasFilterSelected
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
                            placeholder: this.l('Search') + ' ' + this.l('Tenants').toLowerCase(),
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
                            items: [
                            {
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
                    { name: 'print', action: Function(), visible: false }
                ]
            }
        ];
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.dataGrid);
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid);
    }

    initFilterConfig() {
        const anyFilterApplied = this.filtersService.setup(
            this.filters = [
                this.tenantNameFilter,
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: { from: '>=', to: '<=' },
                    caption: 'creation',
                    field: 'creationTime',
                    items: {
                        from: new FilterItemModel(),
                        to: new FilterItemModel()
                    },
                    options: { method: 'getFilterByDate' }
                })
            ]
        );
        if (anyFilterApplied) {
            this.initToolbarConfig();
        }

        this.filtersService.apply((filters: FilterModel[]) => {
            this.initToolbarConfig();

            filters && filters.forEach((filter: FilterModel) => {
                if (filter.field == 'name')
                    this.tenantName = filter.items.name.value;
                else if (filter.field == 'creationTime') {
                    this.creationDateStart = filter.items.from.value;
                    this.creationDateEnd = filter.items.to.value;
                } else if (filter.field == 'productId')
                    this.productId = filter.items.element.value;
            });

            this.dataGrid.instance.refresh();
        });
    }

    showUserImpersonateLookUpModal(record: any): void {
        this.impersonateTenantId = record.id;
        const impersonateDialog = this.dialog.open(CommonLookupModalComponent, {
            panelClass: [ 'slider' ],
            data: { tenantId: this.impersonateTenantId }
        });
        impersonateDialog.componentInstance.itemSelected.subscribe((item: NameValueDto) => {
            this.impersonateUser(item);
        });
    }

    impersonateAsAdmin(record: any): void {
        this.impersonateTenantId = record.id;
        this.impersonationService.impersonateAsAdmin(
            this.impersonateTenantId
        );
    }

    onInitialized(event) {
        event.component.columnOption('command:edit', {
            visibleIndex: -1
        });
    }

    toggleActionsMenu(event) {
        ActionMenuService.toggleActionMenu(event, this.actionRecord).subscribe((actionRecord) => {
            this.actionRecord = actionRecord;
        });
    }

    onMenuItemClick($event) {
        $event.itemData.action.call(this);
        this.actionRecord = null;
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    impersonateUser(item: NameValueDto): void {
        this.impersonationService.impersonate(
            parseInt(item.value),
            this.impersonateTenantId
        );
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        if (this.searchValue)
            this.dataGrid.instance.filter(['Name', 'contains', this.searchValue]);
        else
            this.dataGrid.instance.clearFilter();
    }

    getContactInfo(company: string) {
        if (this.contactRecords && this.contactRecords.length)
            return this.contactRecords.find(contact => contact.CompanyName == company);
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
    }
}
