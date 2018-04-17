import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    Injector,
    Inject,
    ViewEncapsulation,
    ViewChild
} from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { ActivatedRoute, Router } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';

import { CreateClientDialogComponent } from '../shared/create-client-dialog/create-client-dialog.component';
import { MatDialog } from '@angular/material';

import { AppService } from '@app/app.service';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterStatesComponent } from '@shared/filters/states/filter-states.component';
import { FilterStatesModel } from '@shared/filters/states/filter-states.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCBoxesComponent } from '@shared/filters/cboxes/filter-cboxes.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';

import { DataLayoutType } from '@app/shared/layout/data-layout-type';

import { CommonLookupServiceProxy, InstanceServiceProxy, GetUserInstanceInfoOutputStatus,
    CustomersServiceProxy, UpdateCustomerStatusesInput } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { ClientService } from '@app/crm/clients/clients.service';

import { DxDataGridComponent } from 'devextreme-angular';
import query from 'devextreme/data/query';

import 'devextreme/data/odata/store';
import * as _ from 'underscore';
import * as moment from 'moment';


@Component({
    templateUrl: './clients.component.html',
    styleUrls: ['./clients.component.less'],
    animations: [appModuleAnimation()],
    providers: [ InstanceServiceProxy, ClientService ]
})
export class ClientsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;
    private readonly dataSourceURI = 'Customer';
    private filters: FilterModel[];
    private rootComponent: any;
    private formatting = AppConsts.formatting;
    private subRouteParams: any;
    private canSendVerificationRequest: boolean = false;

    public headlineConfig = {
        names: [this.l('Customers')],
        icon: 'people',
        onRefresh: this.refreshDataGrid.bind(this),
        buttons: [
            {
                enabled: true,
                action: this.createClient.bind(this),
                lable: this.l('CreateNewCustomer')
            }
        ]
    };

    constructor(injector: Injector,
        public dialog: MatDialog,
        private _router: Router,
        private _appService: AppService,
        private _filtersService: FiltersService,
        private _activatedRoute: ActivatedRoute,
        private _commonLookupService: CommonLookupServiceProxy,
        private _cfoInstanceServiceProxy: InstanceServiceProxy,
        private _customersServiceProxy: CustomersServiceProxy,
        private _clientService: ClientService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this._filtersService.localizationSourceName = this.localizationSourceName;

        this.dataSource = {
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.headers['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie();
                }
            }
        };

        this.subRouteParams = _activatedRoute.queryParams
            .subscribe(params => {
                if ('addNewClient' == params['action'])
                    setTimeout(() => this.createClient());
            });

        this.initToolbarConfig();

        this.searchColumns = ['Name', 'FullName', 'CompanyName', 'Email', 'Phone', 'City', 'State', 'StateId'];
        this.searchValue = '';

        this.canSendVerificationRequest = this._clientService.canSendVerificationRequest();
    }

    private checkCFOClientAccessPermission() {
        return this.isGranted('Pages.CFO.ClientAccess');
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    onContentReady(event) {
        this.setGridDataLoaded();
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
    }

    createClient() {
        this.dialog.open(CreateClientDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {refreshParent: this.refreshDataGrid.bind(this)}
        }).afterClosed().subscribe(() => this.refreshDataGrid())
    }

    isClientCFOAvailable(userId) {
        return ((userId != null) && this.checkCFOClientAccessPermission());
    }

    showClientDetails(event) {
        let clientId = event.data && event.data.Id;
        if (!clientId)
            return;

        event.component.cancelEditData();
        this._router.navigate(['app/crm/client', clientId]);
    }

    redirectToCFO(event, userId) {
        this._cfoInstanceServiceProxy.getUserInstanceInfo(userId).subscribe(result => {
            if (result && result.id && (result.status === GetUserInstanceInfoOutputStatus.Active))
                window.open(abp.appPath + 'app/cfo/' + result.id + '/start');
            else
                this.notify.error(this.l('CFOInstanceInactive'));
        });
    }

    calculateAddressColumnValue(data) {
        return (data.City || data.StateId) ? [data.City, data.StateId].join(", ") : null;
    }

    toggleDataLayout(dataLayoutType) {
        this.dataLayoutType = dataLayoutType;
    }

    ngOnInit(): void {
        this._filtersService.setup(
            this.filters = [
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'name',
                    items: { FullName: new FilterItemModel()}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'email',
                    items: { Email: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: {from: 'ge', to: 'le'},
                    caption: 'creation',
                    field: 'CreationTime',
                    items: {from: new FilterItemModel(), to: new FilterItemModel()},
                    options: {method: 'getFilterByDate'}
                }),
                new FilterModel({
                    component: FilterCBoxesComponent,
                    caption: 'status',
                    field: 'StatusId',
                    items: {active: new FilterItemModel(), inactive: new FilterItemModel()}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'phone',
                    items: { Phone: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterStatesComponent,
                    caption: 'states',
                    items: {
                        countryStates: new FilterStatesModel()
                    }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'city',
                    items: { City: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'streetAddress',
                    items: { StreetAddress: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'zipCode',
                    items: { ZipCode: new FilterItemModel() }
                })
            ]
        );

        this._filtersService.apply(() => {
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    initToolbarConfig() {
        this._appService.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: event => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                            }, 1000);
                            this._filtersService.fixed = !this._filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this._filtersService.fixed;
                            },
                            mouseover: event => {
                                this._filtersService.enable();
                            },
                            mouseout: event => {
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
                            placeholder: this.l('Search') + ' ' + this.l('Customers').toLowerCase(),
                            onValueChanged: (e) => {
                                this.searchValueChange(e);
                            }
                        }
                    }
                ]
            },
            {
                location: 'before', items: [
                    { name: 'back' }
                ]
            },
            {
                location: 'before', items: [
                    { name: 'assign' },
                    {
                        name: 'status',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: 'Status',
                            items: [
                              {
                                  action: this.updateClientStatuses.bind(this, 'A'),
                                  text: 'Active',
                              }, {
                                  action: this.updateClientStatuses.bind(this, 'I'),
                                  text: 'Inactive',
                              }
                          ]
                        }
                    },
                    {
                        name: 'delete',
                        action: this.deleteClients.bind(this)
                    }
                ]
            },
            {
                location: 'after', items: [
                    { name: 'showCompactRowsHeight', action: this.showCompactRowsHeight.bind(this) },
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
            },
            {
                location: 'after',
                areItemsDependent: true,
                items: [
                    {
                        name: 'box',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Box),
                        options: {
                            checkPressed: () => {
                                return (this.dataLayoutType == DataLayoutType.Box);
                            },
                        }
                    },
                    {
                        name: 'pipeline',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Pipeline),
                        options: {
                            checkPressed: () => {
                                return (this.dataLayoutType == DataLayoutType.Pipeline);
                            },
                        }
                    },
                    {
                        name: 'grid',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Grid),
                        options: {
                            checkPressed: () => {
                                return (this.dataLayoutType == DataLayoutType.Grid);
                            },
                        }
                    }
                ]
            }
        ];
    }

    private filterByAddressPart(filter: FilterModel, partName: string){
        let filterField = filter.items[partName];
        let filterValue = filterField && filterField.value;
        if (!filterValue)
            return;

        let filterInternal = {};
        filterInternal[partName] = { contains: filterValue };
        return {
            Addresses: {
                any: filterInternal
            }
        };
    }

    filterByZipCode(filter: FilterModel) {
        return this.filterByAddressPart(filter, 'ZipCode');
    }

    filterByCity(filter: FilterModel) {
        return this.filterByAddressPart(filter, 'City');
    }

    filterByStreetAddress(filter: FilterModel){
        return this.filterByAddressPart(filter, 'StreetAddress');
    }

    filterByStates(filter: FilterModel) {
        let filterData = [];
        if (filter.items.countryStates && filter.items.countryStates.value) {
            filter.items.countryStates.value.forEach((val) => {
                let parts = val.split(':');
                filterData.push(parts.length == 2 ? {
                    CountryId: parts[0],
                    StateId: parts[1]
                } : {CountryId: val});
            });
        }

        if (filterData.length)
            return {
                Addresses: {
                    any: {
                        or: filterData
                    }
                }
            };
    }

    filterByStatus(filter: FilterModel) {
        let isActive = filter.items.active.value;
        let isInactive = filter.items.inactive.value;

        if (isActive ^ isInactive) {
            let obj = {};
            obj[filter.field] = filter.items.active.value ? 'A' : 'I';
            return obj;
        }
    }

    filterByPhone(filter: FilterModel) {
        let filterField = filter.items.Phone;
        let filterValue = filterField && filterField.value;
        if (filterValue)
            return {
                PhoneNumbers: { any: 'contains(p,\'' + filterValue + '\')' }
            };
    }

    filterByEmail(filter: FilterModel) {
        let filterField = filter.items.Email;
        let filterValue = filterField && filterField.value;
        if (filterValue)
            return {
                EmailAddresses: { any: 'contains(e,\'' + filterValue + '\')' }
            };
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.processFilterInternal();
    }

    processFilterInternal() {
        this.processODataFilter(this.dataGrid.instance,
            this.dataSourceURI, this.filters, (filter) => {
                let filterMethod = this['filterBy' +
                    this.capitalize(filter.caption)];
                if (filterMethod)
                    return filterMethod.call(this, filter);
            }
        );
    }

    private deleteClientsInternal(selectedIds: number[]) {
        this._customersServiceProxy.deleteCustomers(selectedIds).subscribe(() => {
            this.notify.success(this.l('SuccessfullyDeleted'));
            this.refreshDataGrid();
        });
    }

    deleteClients() {
        let selectedIds: number[] = this.dataGrid.instance.getSelectedRowKeys();
        if (selectedIds && selectedIds.length) {
            this.message.confirm(
                this.l('ClientsDeleteWarningMessage'),
                isConfirmed => {
                    if (isConfirmed)
                        this.deleteClientsInternal(selectedIds);
                }
            );
        } else {
            this.message.warn(this.l('NoRecordsToDelete'));
        }
    }

    updateClientStatuses (statusId: string) {
        let selectedIds: number[] = this.dataGrid.instance.getSelectedRowKeys();
        if (selectedIds && selectedIds.length) {
            this.showConfirmationDialog(selectedIds, statusId);
        } else {
            this.message.warn(this.l('NoRecordsToUpdate'));
        }
    }

    private showConfirmationDialog(selectedIds: number[], statusId: string) {
        this.message.confirm(
            this.l('ClientsUpdateStatusWarningMessage'),
            this.l('ClientStatusUpdateConfirmationTitle'),
            isConfirmed => {
                if (isConfirmed)
                    this.updateClientStatusesInternal(selectedIds, statusId);
            }
        );
    }

    private updateClientStatusesInternal (customerIds: number[], statusId: string) {
        this._customersServiceProxy.updateCustomerStatuses(new UpdateCustomerStatusesInput({
            customerIds: customerIds,
            statusId: statusId
        })).subscribe(() => {
            this.notify.success(this.l('StatusSuccessfullyUpdated'));
            this.refreshDataGrid();
            this.dataGrid.instance.clearSelection();
        });
    }

    onCellClick($event) {
        let col = $event.column;
        if (col && (col.command || col.name == 'LinkToCFO'))
            return;
        this.showClientDetails($event);
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this.subRouteParams.unsubscribe();
        this._appService.toolbarConfig = null;
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
    }

    requestVerification(contactId: number) {
        this._clientService.requestVerification(contactId);
    }
}
