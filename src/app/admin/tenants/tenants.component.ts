/** Core imports */
import { Component, Injector, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { filter } from 'rxjs/operators';
import * as _ from 'underscore';
import * as moment from 'moment-timezone';

/** Application imports */
import { FiltersService } from '@shared/filters/filters.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import {
    CommonLookupServiceProxy,
    EntityDtoOfInt64,
    NameValueDto,
    PermissionServiceProxy,
    TenantListDto,
    TenantServiceProxy,
    EditionServiceProxy
} from '@shared/service-proxies/service-proxies';
import { CreateTenantModalComponent } from './create-tenant-modal.component';
import { EditTenantModalComponent } from './edit-tenant-modal.component';
import { TenantFeaturesModalComponent } from './tenant-features-modal.component';
import { AppService } from '@app/app.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterRadioGroupComponent } from '@shared/filters/radio-group/filter-radio-group.component';
import { FilterRadioGroupModel } from '@shared/filters/radio-group/filter-radio-group.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { MatDialog } from '@angular/material';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';

@Component({
    templateUrl: './tenants.component.html',
    styleUrls: [ './tenants.component.less' ],
    animations: [appModuleAnimation()]
})
export class TenantsComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    private editions: any = [];
    private filters: FilterModel[];
    public actionMenuItems: any;

    name: string;
    productId = '-1';
    creationDateStart: moment;
    creationDateEnd: moment;
    public actionRecord: any;
    public headlineConfig = {
        names: [this.l('Tenants')],
        icon: '',
        onRefresh: this.refreshDataGrid.bind(this),
        buttons: [
            {
                enabled: this.isGranted('Pages.Administration'),
                action: this.createTenant.bind(this),
                lable: this.l('CreateNewTenant')
            }
        ]
    };
    dataSource: DataSource;
    private rootComponent: any;
    impersonateTenantId: number;

    constructor(
        injector: Injector,
        private _tenantService: TenantServiceProxy,
        private _editionService: EditionServiceProxy,
        private _appService: AppService,
        private _filtersService: FiltersService,
        private _permissionService: PermissionServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy,
        private _impersonationService: ImpersonationService,
        private dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();
       
        this._editionService.getEditionComboboxItems(0, true, false).subscribe(editions => {
            this.editions = editions;
            this.initFilterConfig();
        });

        this.dataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                return this._tenantService.getTenants(
                    this.searchValue || this.name || undefined,
                    this.creationDateStart || undefined,
                    this.creationDateEnd || undefined,
                    this.productId ? parseInt(this.productId) : null,
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

        this.actionMenuItems = [
            {
                text: this.l('LoginAsThisTenant'),
                visible: this.permission.isGranted('Pages.Tenants.Impersonation'),
                action: () => {
                    this.showUserImpersonateLookUpModal(this.actionRecord);
                }
            },
            {
                text: this.l('Edit'),
                visible: this.permission.isGranted('Pages.Tenants.Edit'),
                action: () => {
                    this.openEditDialog(this.actionRecord.id);
                }
            },
            {
                text: this.l('Features'),
                visible: this.permission.isGranted('Pages.Tenants.ChangeFeatures'),
                action: () => {
                    this.dialog.open(TenantFeaturesModalComponent, {
                        panelClass: ['slider'],
                        data: {
                            tenantId: this.actionRecord.id
                        }
                    });
                }
            },
            {
                text: this.l('Delete'),
                visible: this.permission.isGranted('Pages.Tenants.Delete'),
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
    }

    initToolbarConfig() {
        this._appService.updateToolbar([
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                            }, 1000);
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

    initFilterConfig() {
        this._filtersService.setup(
            this.filters = [
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: this.l('Name'),
                    field: 'name',
                    items: { name: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: { from: '>=', to: '<=' },
                    caption: 'creation',
                    field: 'creationTime',
                    items: {
                        from: new FilterItemModel(),
                        to: new FilterItemModel()
                    },
                    options: {method: 'getFilterByDate'}
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

        this._filtersService.apply((filter) => {
            this.initToolbarConfig();

            if (filter.field == 'name')
                this.name = filter.items.name.value;
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

    unlockUser(record: any): void {
        this._tenantService.unlockTenantAdmin(new EntityDtoOfInt64({ id: record.id })).subscribe(() => {
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
        if (this.permission.isGranted('Pages.Administration.Roles.Edit')) {
            let roleId = event.data && event.data.id;
            if (roleId) {
                event.component.cancelEditData();
                this.openEditDialog(roleId);
            }
        }
    }

    private openEditDialog(tenantId: number) {
        this.dialog.open(EditTenantModalComponent, {
            panelClass: ['slider', 'tenant-modal'],
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
                    this._tenantService.deleteTenant(tenant.id).subscribe(() => {
                        this.dataGrid.instance.refresh();
                        this.notify.success(this.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
    }

    impersonateUser(item: NameValueDto): void {
        this._impersonationService.impersonate(
            parseInt(item.value),
            this.impersonateTenantId
        );
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
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
        this._appService.updateToolbar(null);
    }
}
