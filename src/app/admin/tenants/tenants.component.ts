/** Core imports */
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material';
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { filter, takeUntil, pluck } from 'rxjs/operators';
import * as moment from 'moment-timezone';

/** Application imports */
import { FiltersService } from '@shared/filters/filters.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import {
    CommonLookupServiceProxy,
    Int64EntityDto,
    NameValueDto,
    PermissionServiceProxy,
    TenantListDto,
    TenantServiceProxy,
    EditionServiceProxy
} from '@shared/service-proxies/service-proxies';
import { CreateTenantModalComponent } from './create-tenant-modal/create-tenant-modal.component';
import { EditTenantModalComponent } from './edit-tenant-modal/edit-tenant-modal.component';
import { AppService } from '@app/app.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterRadioGroupComponent } from '@shared/filters/radio-group/filter-radio-group.component';
import { FilterRadioGroupModel } from '@shared/filters/radio-group/filter-radio-group.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';

@Component({
    templateUrl: './tenants.component.html',
    styleUrls: [ './tenants.component.less' ],
    animations: [ appModuleAnimation() ]
})
export class TenantsComponent extends AppComponentBase implements OnDestroy, OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    private editions: any = [];
    private filters: FilterModel[];
    public actionMenuItems: any = [
        {
            text: this.l('LoginAsThisTenant'),
            visible: this.permission.isGranted(AppPermissions.TenantsImpersonation),
            action: () => {
                this.showUserImpersonateLookUpModal(this.actionRecord);
            }
        },
        {
            text: this.l('LoginAsAdmin'),
            visible: this.permission.isGranted(AppPermissions.TenantsImpersonation),
            action: () => {
                this.impersonateAsAdmin(this.actionRecord);
            }
        },
        {
            text: this.l('Edit'),
            visible: this.permission.isGranted(AppPermissions.TenantsEdit),
            action: () => {
                this.openEditDialog(this.actionRecord.id);
            }
        },
        {
            text: this.l('Delete'),
            visible: this.permission.isGranted(AppPermissions.TenantsDelete),
            action: () => {
                this.deleteTenant(this.actionRecord);
            }
        },
        {
            text: this.l('Unlock'),
            action: () => {
                this.unlockUser(this.actionRecord);
            }
        }
    ].filter(Boolean);

    tenantName: string = this.route.snapshot.queryParams.name;
    productId = '-1';
    creationDateStart: moment;
    creationDateEnd: moment;
    public actionRecord: any;
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.Administration),
            action: this.createTenant.bind(this),
            label: this.l('CreateNewTenant')
        }
    ];
    dataSource: DataSource;
    private rootComponent: any;
    impersonateTenantId: number;
    tenantNameFilter = new FilterModel({
        component: FilterInputsComponent,
        operator: 'contains',
        caption: this.l('Name'),
        field: 'name',
        items: { name: new FilterItemModel(this.tenantName)}
    });

    constructor(
        injector: Injector,
        private tenantService: TenantServiceProxy,
        private editionService: EditionServiceProxy,
        private appService: AppService,
        private filtersService: FiltersService,
        private permissionService: PermissionServiceProxy,
        private commonLookupService: CommonLookupServiceProxy,
        private impersonationService: ImpersonationService,
        private dialog: MatDialog,
        private route: ActivatedRoute
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();

        this.editionService.getEditionComboboxItems(0, true, false).subscribe(editions => {
            this.editions = editions;
            this.initFilterConfig();
        });

        this.dataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                this.isDataLoaded = false;
                return this.tenantService.getTenants(
                    this.searchValue || this.tenantName || undefined,
                    this.creationDateStart || undefined,
                    this.creationDateEnd || undefined,
                    this.productId ? parseInt(this.productId) : undefined,
                    !this.productId || parseInt(this.productId) >= 0,
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
    }

    ngOnInit() {
        this.route.queryParams.pipe(
            takeUntil(this.destroy$),
            pluck('name'),
            filter((tenantName: string) => tenantName && this.tenantName !== tenantName)
        ).subscribe((tenantName: string) => {
            this.tenantName = this.tenantNameFilter.items.name.value = tenantName;
            this.tenantNameFilter.updateCaptions();
            this.filtersService.change(this.tenantNameFilter);
        });
    }

    repaintDataGrid(delay = 0) {
        setTimeout(() => this.dataGrid.instance.repaint(), delay);
    }

    initToolbarConfig() {
        this.appService.updateToolbar([
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
                    { name: 'columnChooser', action: DataGridService.showColumnChooser.bind(this, this.dataGrid) }
                ]
            }
        ]);
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid);
    }

    initFilterConfig() {
        const anyFilterAppied = this.filtersService.setup(
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
                }),
                new FilterModel({
                    component: FilterRadioGroupComponent,
                    caption: 'product',
                    field: 'productId',
                    items: {
                        element: new FilterRadioGroupModel({
                            value: this.productId,
                            list: this.editions.map((item) => {
                                return {
                                    id: item.value,
                                    name: item.displayText
                                };
                            })
                        })
                    }
                })
            ]
        );
        if (anyFilterAppied) {
            this.initToolbarConfig();
        }

        this.filtersService.apply((filter) => {
            this.initToolbarConfig();

            if (filter.field == 'name')
                this.tenantName = filter.items.name.value;
            else if (filter.field == 'creationTime') {
                this.creationDateStart = filter.items.from.value;
                this.creationDateEnd = filter.items.to.value;
            } else if (filter.field == 'productId')
                this.productId = filter.items.element.value;

            this.dataSource.load();
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

    unlockUser(record: any): void {
        this.tenantService.unlockTenantAdmin(new Int64EntityDto({ id: record.id })).subscribe(() => {
            this.notify.success(this.l('UnlockedTenandAdmin', record.name));
        });
    }

    createTenant(): void {
        this.dialog.open(CreateTenantModalComponent, {
            panelClass: [ 'slider' ],
            data: {}
        }).afterClosed().pipe(filter(Boolean)).subscribe(
            () => this.refreshDataGrid()
        );
    }

    onContentReady() {
        this.setGridDataLoaded();
    }

    showActionsMenu(event) {
        this.actionRecord = event.data;
        event.cancel = true;
    }

    onMenuItemClick($event) {
        $event.itemData.action.call(this);
        this.actionRecord = null;
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    editTenant(event) {
        if (this.permission.isGranted(AppPermissions.AdministrationRolesEdit)) {
            let roleId = event.data && event.data.id;
            if (roleId) {
                event.component.cancelEditData();
                this.openEditDialog(roleId);
            }
        }
    }

    private openEditDialog(tenantId: number) {
        this.dialog.open(EditTenantModalComponent, {
            panelClass: ['slider'],
            data: { tenantId: tenantId }
        }).afterClosed().pipe(filter(Boolean)).subscribe(
            () => this.refreshDataGrid()
        );
    }

    deleteTenant(tenant: TenantListDto): void {
        this.message.confirm(
            this.l('TenantDeleteWarningMessage', tenant.tenancyName),
            this.l('AreYouSure'),
            isConfirmed => {
                if (isConfirmed) {
                    this.tenantService.deleteTenant(tenant.id).subscribe(() => {
                        this.dataGrid.instance.refresh();
                        this.notify.success(this.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
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

    refreshDataGrid() {
        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.refresh();
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
        this.appService.updateToolbar(null);
    }
}
