/** Core imports */
import {
    AfterViewInit,
    Component,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { Params } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { BehaviorSubject, combineLatest, concat, forkJoin, Observable, of } from 'rxjs';
import {
    catchError,
    distinctUntilChanged,
    filter,
    finalize,
    first,
    map,
    mapTo,
    pluck,
    skip,
    switchMap,
    takeUntil,
    tap
} from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import startCase from 'lodash/startCase';
import * as _ from 'underscore';

/** Application imports */
import {
    CrmStore,
    OrganizationUnitsStoreActions,
    OrganizationUnitsStoreSelectors,
    PipelinesStoreSelectors,
    SubscriptionsStoreActions,
    SubscriptionsStoreSelectors
} from '@app/crm/store';
import { ContactGroup } from '@shared/AppEnums';
import { AppService } from '@app/app.service';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FilterMultilineInputComponent } from '@shared/filters/multiline-input/filter-multiline-input.component';
import { FilterMultilineInputModel } from '@shared/filters/multiline-input/filter-multiline-input.model';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { PipelineComponent } from '@app/shared/pipeline/pipeline.component';
import { CreateInvoiceDialogComponent } from '../shared/create-invoice-dialog/create-invoice-dialog.component';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import {
    InvoiceSettings, OrderServiceProxy,
    ProductServiceProxy, ProductType, ProductDto
} from '@shared/service-proxies/service-proxies';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { OrderType } from '@app/crm/orders/order-type.enum';
import { SubscriptionsStatus } from '@app/crm/orders/subscriptions-status.enum';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { CrmService } from '../crm.service';
import { PivotGridComponent } from '@app/shared/common/slice/pivot-grid/pivot-grid.component';
import { FilterSourceComponent } from '@app/crm/shared/filters/source-filter/source-filter.component';
import { FilterServicesAndProductsModel } from '@app/crm/shared/filters/services-and-products-filter/services-and-products-filter.model';
import { FilterServicesAndProductsComponent } from '@app/crm/shared/filters/services-and-products-filter/services-and-products-filter.component';
import { SourceFilterModel } from '@app/crm/shared/filters/source-filter/source-filter.model';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { OrderDto } from '@app/crm/orders/order-dto';
import { SubscriptionDto } from '@app/crm/orders/subcription-dto.interface';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { OrderFields } from '@app/crm/orders/order-fields.enum';
import { SubscriptionFields } from '@app/crm/orders/subscription-fields.enum';
import { ContactsHelper } from '@root/shared/crm/helpers/contacts-helper';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';
import { OrderStageSummary } from '@app/crm/orders/order-stage-summary.interface';
import { ActionMenuGroup } from '@app/shared/common/action-menu/action-menu-group.interface';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { EntityCheckListDialogComponent } from '@app/crm/shared/entity-check-list-dialog/entity-check-list-dialog.component';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';
import { InvoiceSettingsDialogComponent } from '../contacts/invoice-settings-dialog/invoice-settings-dialog.component';

@Component({
    templateUrl: './orders.component.html',
    styleUrls: [
        '../shared/styles/grouped-action-menu.less',
        './orders.component.less'
    ],
    providers: [OrderServiceProxy, CurrencyPipe, ProductServiceProxy]
})
export class OrdersComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('ordersGrid', { static: false }) ordersGrid: DxDataGridComponent;
    @ViewChild('subscriptionsGrid', { static: false }) subscriptionsGrid: DxDataGridComponent;
    @ViewChild(PipelineComponent, { static: false }) pipelineComponent: PipelineComponent;
    @ViewChild(StaticListComponent, { static: false }) stagesComponent: StaticListComponent;
    @ViewChild(PivotGridComponent, { static: false }) pivotGridComponent: PivotGridComponent;
    @ViewChild(ActionMenuComponent, { static: false }) actionMenu: ActionMenuComponent;

    items: any;
    showOrdersPipeline = true;
    pipelineDataSource: any;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.order;
    stages = [];
    selectedOrderKeys = [];
    rowsViewHeight: number;
    private exportCallback: Function;
    private _selectedOrders: any;
    get selectedOrders() {
        return this._selectedOrders || [];
    }
    set selectedOrders(orders) {
        this._selectedOrders = orders;
        this.selectedOrderKeys = orders.map((item) => item.Id);
        this.initOrdersToolbarConfig();
    }

    manageDisabled = !this.isGranted(AppPermissions.CRMOrdersManage);
    filterModelStages: FilterModel;
    layoutTypes = DataLayoutType;
    private ordersDataLayoutType: DataLayoutType = DataLayoutType.Pipeline;
    public subscriptionsDataLayoutType: DataLayoutType = DataLayoutType.DataGrid;
    private gridCompactView: BehaviorSubject<Boolean> = new BehaviorSubject(true);
    private dataLayoutType: BehaviorSubject<DataLayoutType> = new BehaviorSubject(
        this.showOrdersPipeline ? DataLayoutType.Pipeline : DataLayoutType.DataGrid
    );
    dataLayoutType$: Observable<DataLayoutType> = this.dataLayoutType.asObservable().pipe(tap((layoutType) => {
        this.appService.isClientSearchDisabled = layoutType != DataLayoutType.DataGrid;
    }));
    private readonly ordersDataSourceURI = 'Order';
    private readonly orderCountDataSourceURI = 'OrderCount';
    private readonly subscriptionsDataSourceURI = 'Subscription';
    readonly orderFields: KeysEnum<OrderDto> = OrderFields;
    readonly subscriptionFields: KeysEnum<SubscriptionDto> = SubscriptionFields;
    private filters: FilterModel[];
    private orderSubscriptionStatusFilter = this.getSubscriptionsFilter();
    private subscriptionStatusFilter = this.getSubscriptionsFilter();
    public selectedOrderType: BehaviorSubject<OrderType> = new BehaviorSubject(+(this._activatedRoute.snapshot.queryParams.orderType || OrderType.Order));
    public selectedContactGroup: BehaviorSubject<ContactGroup> = new BehaviorSubject(this._activatedRoute.snapshot.queryParams.contactGroup || undefined);
    showCompactView$: Observable<Boolean> = combineLatest(
        this.dataLayoutType$,
        this.pipelineService.compactView$,
        this.gridCompactView.asObservable(),
    ).pipe(
        map(([layoutType, pipelineCompactView, gridCompactView]: [DataLayoutType, Boolean, Boolean]) => {
            return layoutType == DataLayoutType.Pipeline ? pipelineCompactView : gridCompactView;
        })
    );
    selectedOrderType$: Observable<OrderType> = this.selectedOrderType.asObservable();
    selectedContactGroup$: Observable<ContactGroup> = this.selectedContactGroup.asObservable();
    private sourceFilter: FilterModel = new FilterModel({
        component: FilterSourceComponent,
        caption: 'Source',
        hidden: this.appSession.userIsMember,
        items: {
            element: new SourceFilterModel({
                ls: this.localizationService
            })
        }
    });
    private ordersFilters: FilterModel[] = [
        new FilterModel({
            component: FilterCalendarComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'creation',
            field: this.orderFields.OrderDate,
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
        }),
        this.filterModelStages = new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'orderStages',
            items: {
                element: new FilterCheckBoxesModel(
                    {
                        dataSource$: this.store$.pipe(
                            select(PipelinesStoreSelectors.getPipelineTreeSource(
                                { purpose: AppConsts.PipelinePurposeIds.order })
                            )
                        ),
                        nameField: 'name',
                        parentExpr: 'parentId',
                        keyExpr: 'id'
                    }),
            }
        }),
        new FilterModel({
            component: FilterInputsComponent,
            options: { type: 'number' },
            operator: { from: 'ge', to: 'le' },
            caption: 'Amount',
            field: this.orderFields.Amount,
            items: { from: new FilterItemModel(), to: new FilterItemModel() }
        }),
        this.orderSubscriptionStatusFilter,
        this.getSourceOrganizationUnitFilter(),
        this.sourceFilter,
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'email',
            filterMethod: this.filtersService.filterByMultiline,
            field: this.orderFields.Email,
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'Email'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'xref',
            hidden: this.appSession.userIsMember,
            filterMethod: this.filtersService.filterByMultiline,
            field: this.orderFields.ContactXref,
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'xref'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'affiliateCode',
            filterMethod: this.filtersService.filterByMultiline,
            field: this.orderFields.PersonalAffiliateCode,
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'AffiliateCode'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'phone',
            filterMethod: this.filtersService.filterByMultiline,
            field: this.orderFields.Phone,
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'Phone',
                    normalize: FilterHelpers.normalizePhone
                })
            }
        })
    ];
    private subscriptionsFilters: FilterModel[] = [
        new FilterModel({
            component: FilterCalendarComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'ContactDate',
            field: this.subscriptionFields.ContactDate,
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
        }),
        new FilterModel({
            component: FilterCalendarComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'StartDate',
            field: this.subscriptionFields.StartDate,
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
        }),
        new FilterModel({
            component: FilterCalendarComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'EndDate',
            field: this.subscriptionFields.EndDate,
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
        }),
        new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'Status',
            field: this.subscriptionFields.StatusId,
            isSelected: true,
            items: {
                element: new FilterCheckBoxesModel(
                    {
                        dataSource: Object.keys(SubscriptionsStatus).map((status: string) => ({
                            id: SubscriptionsStatus[status],
                            name: startCase(status)
                        })),
                        value: [SubscriptionsStatus.CurrentActive],
                        nameField: 'name',
                        keyExpr: 'id'
                    })
            }
        }),
        new FilterModel({
            component: FilterInputsComponent,
            options: { type: 'number' },
            operator: { from: 'ge', to: 'le' },
            caption: 'Fee',
            field: this.subscriptionFields.Fee,
            items: { from: new FilterItemModel(), to: new FilterItemModel() }
        }),
        this.subscriptionStatusFilter,
        this.getSourceOrganizationUnitFilter(),
        this.sourceFilter,
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'email',
            filterMethod: this.filtersService.filterByMultiline,
            field: this.subscriptionFields.EmailAddress,
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'Email'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'xref',
            hidden: this.appSession.userIsMember,
            filterMethod: this.filtersService.filterByMultiline,
            field: this.subscriptionFields.ContactXref,
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'xref'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'affiliateCode',
            filterMethod: this.filtersService.filterByMultiline,
            field: this.subscriptionFields.PersonalAffiliateCode,
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'AffiliateCode'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'phone',
            filterMethod: this.filtersService.filterByMultiline,
            field: this.subscriptionFields.PhoneNumber,
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'Phone',
                    normalize: FilterHelpers.normalizePhone
                })
            }
        })
    ];
    private filterChanged = false;
    masks = AppConsts.masks;
    formatting = AppConsts.formatting;
    headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.CRMOrdersInvoicesManage),
            action: this.createInvoice.bind(this),
            label: this.l('CreateInvoice')
        }
    ];
    permissions = AppPermissions;
    currency: string;
    totalErrorMsg: string;
    ordersTotalCount: number;
    subscriptionsTotalCount: number;
    ordersToolbarConfig: ToolbarGroupModel[];
    subscriptionsToolbarConfig: ToolbarGroupModel[];
    orderTypesEnum = OrderType;
    searchValue = this._activatedRoute.snapshot.queryParams.search || '';
    searchClear = false;
    ordersDataSource: any = new DataSource(this.getOrdersDataSourceConfig());
    subscriptionsDataSource = new DataSource({
        requireTotalCount: true,
        store: new ODataStore({
            key: this.subscriptionFields.Id,
            url: this.getODataUrl(this.subscriptionsDataSourceURI),
            version: AppConsts.ODataVersion,
            deserializeDates: false,
            beforeSend: (request) => {
                request.params.contactGroupId = this.selectedContactGroup.value; 
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.params.$select = DataGridService.getSelectFields(
                    this.subscriptionsGrid,
                    [
                        this.subscriptionFields.Id,
                        this.subscriptionFields.LeadId,
                        this.subscriptionFields.ContactId
                    ]
                );
            },
            onLoaded: (records) => {
                if (records instanceof Array)
                    this.subscriptionsDataSource['entities'] = (this.subscriptionsDataSource['entities'] || []).concat(records);
            }
        })
    });
    sliceStorageKey = 'CRM_Subscriptions_Slice_' + this.sessionService.tenantId + '_' + this.sessionService.userId;
    contentHeight$: Observable<number> = this.crmService.contentHeight$;
    subscriptionGroupDataSourceURI = 'SubscriptionSlice';
    pivotGridDataIsLoading: boolean;
    private refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this.refresh.asObservable();
    filterChanged$: Observable<FilterModel[]> = this.filtersService.filtersChanged$.pipe(
        filter(() => this.componentIsActivated)
    );
    ordersODataRequestValues$: Observable<ODataRequestValues> = this.getODataRequestValues(OrderType.Order);
    subscriptionsODataRequestValues$: Observable<ODataRequestValues> = this.getODataRequestValues(OrderType.Subscription);
    private search: BehaviorSubject<string> = new BehaviorSubject<string>(this.searchValue);
    search$: Observable<string> = this.search.asObservable().pipe(distinctUntilChanged());
    private subscriptionsPivotGridDataSource = {
        remoteOperations: true,
        load: (loadOptions) => {
            this.pivotGridDataIsLoading = true;
            return this.crmService.loadSlicePivotGridData(
                this.getODataUrl(this.subscriptionGroupDataSourceURI),
                this.filters,
                loadOptions
            );
        },
        onChanged: () => {
            this.pivotGridDataIsLoading = false;
        },
        fields: [
            {
                area: 'row',
                dataField: 'ProductName',
                name: 'productName',
                expanded: true,
                sortBy: 'displayText'
            },
            {
                dataType: 'number',
                area: 'data',
                summaryType: 'count',
                name: 'count',
                isMeasure: true
            },
            {
                dataType: 'number',
                area: 'data',
                summaryType: 'sum',
                name: 'fee',
                dataField: 'Fee',
                format: 'currency',
                isMeasure: true
            },
            {
                area: 'column',
                dataField: 'StartDate',
                dataType: 'date',
                groupInterval: 'year',
                name: 'year',
                showTotals: false
            },
            {
                area: 'column',
                dataField: 'StartDate',
                dataType: 'date',
                groupInterval: 'quarter',
                showTotals: false,
            },
            {
                area: 'column',
                dataField: 'StartDate',
                dataType: 'date',
                groupInterval: 'month',
                showTotals: false
            },
            {
                area: 'filter',
                dataField: 'StartDate',
                dataType: 'date',
                groupInterval: 'day',
                showTotals: false
            },
            {
                area: 'filter',
                dataField: 'ContactStatusName'
            },
            {
                area: 'filter',
                dataField: 'FirstName'
            },
            {
                area: 'filter',
                dataField: 'LastName'
            },
            {
                area: 'filter',
                dataField: 'Zip'
            },
            {
                area: 'filter',
                dataField: 'SourceAffiliateCode'
            },
            {
                area: 'filter',
                dataField: 'CountryCode'
            },
            {
                area: 'filter',
                dataField: 'StateName'
            },
            {
                area: 'filter',
                dataField: 'City'
            }
        ]
    };
    ordersSum: number;
    ordersSummary$: Observable<OrderStageSummary> = combineLatest(
        this.ordersODataRequestValues$,
        this.search$,
        this.refresh$
    ).pipe(
        takeUntil(this.destroy$),
        switchMap(this.waitUntilLayoutType(DataLayoutType.DataGrid)),
        switchMap(this.waitUntilOrderType(OrderType.Order)),
        map(([oDataRequestValues,]: [ODataRequestValues,]) => {
            return this.getODataUrl(this.orderCountDataSourceURI, oDataRequestValues.filter, null,
                [...this.getSubscriptionsParams(), ...oDataRequestValues.params]);
        }),
        filter((totalUrl: string) => this.oDataService.requestLengthIsValid(totalUrl)),
        switchMap((totalUrl: string) => {
            this.totalCount = this.totalErrorMsg = undefined;
            let contactGroup = this.selectedContactGroup.value;
            return this.http.get(
                totalUrl,
                {
                    params: new HttpParams({
                        fromObject: {
                            'contactGroupId': contactGroup && contactGroup.toString()
                        }
                    }),
                    headers: new HttpHeaders({
                        'Authorization': 'Bearer ' + abp.auth.getToken()
                    })
                }
            ).pipe(catchError(() => {
                this.totalErrorMsg = this.l('AnHttpErrorOccured');
                return of({});
            }));
        }),
        map((summaryData: { [stageId: string]: OrderStageSummary }) => {
            return Object.values(summaryData).reduce((summary: OrderStageSummary, stageSummary: OrderStageSummary) => {
                summary.count += stageSummary.count;
                summary.sum += stageSummary.sum;
                return summary;
            }, { count: 0, sum: 0 });
        })
    );
    subscriptionsTotalFee: number;
    subscriptionsTotalOrderAmount: number;
    subscriptionsSummary$: Observable<any> = combineLatest(
        this.subscriptionsODataRequestValues$,
        this.search$,
        this.refresh$
    ).pipe(
        takeUntil(this.destroy$),
        switchMap(this.waitUntilOrderType(OrderType.Subscription)),
        map(([oDataRequestValues,]: [ODataRequestValues,]) => {
            return this.getODataUrl(
                this.subscriptionGroupDataSourceURI,
                oDataRequestValues.filter,
                null,
                [
                    ...this.getSubscriptionsParams(),
                    ...oDataRequestValues.params,
                    {
                        name: 'totalSummary',
                        value: JSON.stringify([
                            { 'summaryType': 'count' },
                            { 'selector': 'OrderAmount', 'summaryType': 'sum' },
                            { 'selector': 'Fee', 'summaryType': 'sum' }
                        ])
                    }
                ]
            );
        }),
        filter((totalUrl: string) => this.oDataService.requestLengthIsValid(totalUrl)),
        switchMap((subscriptionSummaryUrl: string) => {
            this.totalCount = this.totalErrorMsg = undefined;
            let contactGroup = this.selectedContactGroup.value;
            return this.http.get(
                subscriptionSummaryUrl,
                {
                    params: contactGroup ? new HttpParams({
                        fromObject: {
                            contactGroupId: contactGroup.toString()
                        }
                    }) : undefined,
                    headers: new HttpHeaders({
                        'Authorization': 'Bearer ' + abp.auth.getToken()
                    })
                }
            ).pipe(
                catchError(() => {
                    this.totalErrorMsg = this.l('AnHttpErrorOccured');
                    return of({});
                })
            )
        }),
    );
    private _activate: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    private activate$: Observable<boolean> = this._activate.asObservable();
    private queryParams$: Observable<Params> = this._activatedRoute.queryParams.pipe(
        takeUntil(this.destroy$),
        filter(() => this.componentIsActivated)
    );

    actionEvent: any;
    actionMenuGroups: ActionMenuGroup[] = [
        {
            key: '',
            visible: true,
            items: [
                {
                    text: this.l('SMS'),
                    class: 'sms fa fa-commenting-o',
                    action: (data?) => {
                        let entity = data || this.actionEvent.data || this.actionEvent;
                        this.contactsService.showSMSDialog({
                            phoneNumber: entity.Phone || entity.PhoneNumber
                        });
                    }
                },
                {
                    text: this.l('SendEmail'),
                    class: 'email',
                    action: (data?) => {
                        this.contactsService.showEmailDialog({
                            contactId: (data || this.actionEvent.data || this.actionEvent).ContactId
                        }).subscribe();
                    }
                },
            ]
        },
        {
            key: '',
            visible: true,
            items: [
                {
                    text: this.l('LoginAsThisUser'),
                    class: 'login',
                    disabled: true,
                    checkVisible: (entity: any) => {
                        return !!entity.UserId && this.isGranted(AppPermissions.AdministrationUsersImpersonation);
                    },
                    action: (data?) => {
                        //const entity: any = data || this.actionEvent.data || this.actionEvent;
                        //this.impersonationService.impersonate(entity.UserId, this.appSession.tenantId);
                    }
                },
                {
                    text: this.l('NotesAndCallLog'),
                    class: 'notes',
                    action: (data?) => {
                        this.showContactDetails({ data: data || this.actionEvent }, 'notes');
                    },
                    button: {
                        text: '+' + this.l('Add'),
                        action: (data?) => {
                            this.showContactDetails({ data: data || this.actionEvent }, 'notes', {
                                addNew: true
                            });
                        }
                    }
                },
                {
                    text: this.l('Appointment'),
                    class: 'appointment',
                    disabled: true,
                    action: () => { }
                },
                {
                    text: this.l('Orders'),
                    class: 'orders',
                    action: (data?) => {
                        this.showContactDetails({ data: data || this.actionEvent }, 'invoices');
                    }
                },
                {
                    text: this.l('Notifications'),
                    class: 'notifications',
                    disabled: true,
                    action: () => { }
                }
                /*
                                {
                                    getText: (entity: any) => {
                                        const stage = this.pipelineService.getStageByName(this.pipelinePurposeId, entity.Stage, entity.contactGroupId);
                                        return this.l('Checklist') + ' (' + entity.StageChecklistPointDoneCount + '/' + stage.checklistPoints.length + ')';
                                    },
                                    class: 'checklist',
                                    checkVisible: (entity: any) => {
                                        const stage = this.pipelineService.getStageByName(this.pipelinePurposeId, entity.Stage, entity.contactGroupId);
                                        return !!(!stage.isFinal && stage.checklistPoints && stage.checklistPoints.length);
                                    },
                                    action: (data?) => {
                                        this.openEntityChecklistDialog(data);
                                    }
                                }
                */
            ]
        },
        {
            key: '',
            visible: true,
            items: [
                {
                    text: this.l('Delete'),
                    class: 'delete',
                    disabled: false,
                    action: (data?) => {
                        this.deleteOrders([(data || this.actionEvent.data || this.actionEvent).Id]);
                    }
                },
                {
                    text: this.l('EditRow'),
                    class: 'edit',
                    action: (data?) => this.showContactDetails({ data: data || this.actionEvent })
                }
            ]
        }
    ];

    constructor(injector: Injector,
        private productProxy: ProductServiceProxy,
        private orderProxy: OrderServiceProxy,
        private invoicesService: InvoicesService,
        private contactsService: ContactsService,
        private filtersService: FiltersService,
        private pipelineService: PipelineService,
        private itemDetailsService: ItemDetailsService,
        private store$: Store<CrmStore.State>,
        private cacheService: CacheService,
        private sessionService: AppSessionService,
        private crmService: CrmService,
        private currencyPipe: CurrencyPipe,
        private http: HttpClient,
        public appService: AppService,
        public dialog: MatDialog,
    ) {
        super(injector);
        this.subscriptionsDataSource['exportIgnoreOnLoaded'] = true;
        this.ordersDataSource['exportIgnoreOnLoaded'] = true;
        invoicesService.settings$.pipe(
            filter(Boolean)
        ).subscribe((res: InvoiceSettings) => this.currency = res.currency);
        this._activatedRoute.queryParams.pipe(
            takeUntil(this.destroy$),
            filter(() => this.componentIsActivated),
            pluck('refresh'),
            filter(Boolean)
        ).subscribe(() => this.invalidate());
        this.selectedOrderType.value === OrderType.Order
            ? this.initOrdersToolbarConfig()
            : this.initSubscriptionsToolbarConfig();
    }

    ngOnInit() {
        this.activate();
        this.handleFiltersPining();
        this.ordersSummary$.subscribe((ordersSummary: OrderStageSummary) => {
            this.ordersSum = ordersSummary.sum;
            this.ordersDataSource['total'] = this.totalCount = ordersSummary.count;
        });
        this.subscriptionsSummary$.subscribe((data) => {
            this.subscriptionsDataSource['total'] = this.totalCount = data.summary[0];
            this.subscriptionsTotalOrderAmount = data.summary[1];
            this.subscriptionsTotalFee = data.summary[2];
            if (this.subscriptionsGrid) {
                this.subscriptionsGrid.instance.repaint();
            }
        });
        this.selectedOrderType$.pipe(
            skip(1),
            takeUntil(this.destroy$)
        ).subscribe((selectedOrderType: OrderType) => {
            this.changeOrderType(selectedOrderType);
        });
    }

    customizeTotal = () => this.totalCount !== undefined ? this.l('Count') + ': ' + this.totalCount : '';
    customizeOrdersSum = () => this.customizeAmountSummary({ value: this.ordersSum });
    customizeSubscriptionsTotalFee = () => this.customizeAmountSummary({ value: this.subscriptionsTotalFee });
    customizeSubscriptionsTotalAmount = () => this.customizeAmountSummary({ value: this.subscriptionsTotalOrderAmount });

    private handleQueryParams() {
        this.queryParams$.pipe(
            skip(1),
            /** Wait for activation to update the filters */
            switchMap((queryParams: Params) => this.activate$.pipe(
                filter(Boolean),
                mapTo(queryParams))
            )
        ).subscribe((params: Params) => {
            if (params.search && this.searchValue !== params.search) {
                this.searchValue = params.search;
                if (this.selectedOrderType.value == OrderType.Order)
                    this.initOrdersToolbarConfig();
                else
                    this.initSubscriptionsToolbarConfig();
                this.filtersService.clearAllFilters();
                this.selectedContactGroup.next(undefined);
                setTimeout(() => this.filtersService.change([]));
            }
            if (params.orderType && this.selectedOrderType.value !== (+params.orderType)) {
                this.searchClear = false;
                this.selectedOrderType.next(+params.orderType);
            }
        });
    }

    activate() {
        super.activate();
        this.handleQueryParams();
        this.initFilterConfig();
        this.subscribeToFilter();
        this.showHostElement(() => {
            this.pipelineComponent.detectChanges();
        });
        this._activate.next(true);
    }

    get dataGrid() {
        return this.selectedOrderType.value === OrderType.Order ? this.ordersGrid : this.subscriptionsGrid;
    }

    set totalCount(value: number) {
        if (this.selectedOrderType.value === OrderType.Order) {
            this.ordersTotalCount = value;
        } else if (this.selectedOrderType.value === OrderType.Subscription) {
            this.subscriptionsTotalCount = value;
        }
    }

    get totalCount() {
        return this.selectedOrderType.value === OrderType.Order
            ? this.ordersTotalCount
            : this.subscriptionsTotalCount;
    }

    private waitUntilOrderType(orderType: OrderType) {
        return (data) => this.selectedOrderType.value === orderType ? of(data) : this.selectedOrderType$.pipe(
            filter((dataOrderType: OrderType) => dataOrderType === orderType),
            first(),
            mapTo(data)
        );
    }

    private waitUntilLayoutType(layoutType: DataLayoutType) {
        return (data) => this.dataLayoutType.value === layoutType ? of(data) : this.dataLayoutType$.pipe(
            filter((dataLayoutType: DataLayoutType) => dataLayoutType === layoutType),
            first(),
            mapTo(data)
        );
    }

    private getOrdersDataSourceConfig(options?) {
        return {
            ...options,
            requireTotalCount: true,
            store: {
                type: 'odata',
                key: this.orderFields.Id,
                url: this.getODataUrl(this.ordersDataSourceURI),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.params.contactGroupId = this.selectedContactGroup.value;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.params.$select = DataGridService.getSelectFields(
                        this.ordersGrid,
                        [
                            this.orderFields.Id,
                            this.orderFields.LeadId,
                            this.orderFields.ContactId
                        ]
                    );
                },
                onLoaded: (records) => {
                    let dataSource = this.showOrdersPipeline ? this.pipelineDataSource : this.ordersDataSource;
                    if (records instanceof Array)
                        dataSource['entities'] = (dataSource['entities'] || []).concat(records);
                }
            }
        };
    }

    get dataSource() {
        return this.selectedOrderType.value === OrderType.Order ? this.ordersDataSource : this.subscriptionsDataSource;
    }

    get showToggleColumnSelectorButton() {
        return (this.selectedOrderType.value === OrderType.Order && this.ordersDataLayoutType === DataLayoutType.DataGrid)
            || this.selectedOrderType.value === OrderType.Subscription;
    }

    getODataRequestValues(orderType: OrderType) {
        return concat(
            /** Do not emit initial empty filters for subscriptions since they apply its own initial filters */
            orderType === OrderType.Subscription
                ? of(null)
                : this.oDataService.getODataFilter(this.filters, this.getCheckCustomFilter.bind(this)).pipe(first()),
            this.filterChanged$.pipe(
                filter(() => this.selectedOrderType.value === orderType),
                switchMap(() => this.oDataService.getODataFilter(this.filters, this.getCheckCustomFilter.bind(this)))
            ),
        ).pipe(
            filter((oDataRequestValues: ODataRequestValues) => !!oDataRequestValues),
            distinctUntilChanged((prev: ODataRequestValues, curr: ODataRequestValues) => {
                return !!prev.filter && prev.filter === curr.filter && !ArrayHelper.dataChanged(prev.params, curr.params);
            })
        );
    }

    private handleFiltersPining() {
        this.filtersService.filterFixed$.pipe(
            takeUntil(this.destroy$),
            skip(1)
        ).subscribe(() => {
            if (this.pivotGridComponent) {
                setTimeout(() => {
                    this.pivotGridComponent.dataGrid.instance.updateDimensions();
                }, 1001);
            }
        });
    }

    private getSubscriptionsFilter() {
        return new FilterModel({
            component: FilterServicesAndProductsComponent,
            caption: 'SubscriptionStatus',
            items: {
                services: new FilterServicesAndProductsModel(
                    {
                        dataSource$: this.store$.pipe(
                            select(SubscriptionsStoreSelectors.getSubscriptions),
                            map(items => {
                                return (items || []).map(parent => {
                                    parent['uid'] = parent.id;
                                    parent.memberServiceLevels.forEach(child => {
                                        child['uid'] = parent.id + ':' + child.id;
                                    });
                                    return parent;
                                });
                            })
                        ),
                        dispatch: () => this.store$.dispatch(new SubscriptionsStoreActions.LoadRequestAction(false)),
                        recursive: true,
                        nameField: 'name',
                        keyExpr: 'uid',
                        dataStructure: 'tree',
                        itemsExpr: 'memberServiceLevels'
                    }
                ),
                products: new FilterServicesAndProductsModel(
                    {
                        dataSource$: this.productProxy.getProducts(
                            ProductType.Subscription
                        ).pipe(
                            map((products: ProductDto[]) => {
                                let productsWithGroups = products.filter(x => x.group);
                                let productsWithoutGroups = products.filter(x => !x.group);
                                let groups = _.groupBy(productsWithGroups, (x: ProductDto) => x.group);
                                let arr: any[] = _.keys(groups).map(groupName => {
                                    return {
                                        id: groupName,
                                        name: groupName,
                                        products: groups[groupName].sort((prev, next) => prev.name.localeCompare(next.name, 'en', { sensitivity: 'base' }))
                                    };
                                }).sort((prev, next) => prev.name.localeCompare(next.name, 'en', { sensitivity: 'base' }));
                                return arr.concat(
                                    productsWithoutGroups.sort((prev, next) => prev.name.localeCompare(next.name, 'en', { sensitivity: 'base' }))
                                );
                            })
                        ),
                        nameField: 'name',
                        codeField: 'code',
                        keyExpr: 'id',
                        dataStructure: 'tree',
                        itemsExpr: 'products',
                        recursive: true
                    }
                )
            }
        });
    }

    private getSourceOrganizationUnitFilter() {
        return new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: this.subscriptionFields.SourceOrganizationUnitId,
            hidden: this.appSession.userIsMember,
            field: this.orderFields.SourceOrganizationUnitId,
            items: {
                element: new FilterCheckBoxesModel(
                    {
                        dataSource$: this.store$.pipe(select(OrganizationUnitsStoreSelectors.getOrganizationUnits)),
                        dispatch: () => this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(false)),
                        nameField: 'displayName',
                        keyExpr: 'id'
                    })
            }
        });
    }

    initOrdersToolbarConfig() {
        this.ordersToolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                            }, 1000);
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
                            width: '279',
                            mode: 'search',
                            value: this.searchValue,
                            placeholder: this.l('Search') + ' ' + this.l('Orders').toLowerCase(),
                            onValueChanged: (e) => {
                                this.searchValueChange(e);
                            }
                        }
                    }
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'stage',
                        action: this.toggleStages.bind(this),
                        disabled: this.manageDisabled,
                        attr: {
                            'filter-selected': this.filterModelStages && this.filterModelStages.isSelected
                        }
                    }
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [{
                    name: 'delete',
                    disabled: this.manageDisabled || !this.selectedOrderKeys.length ||
                        (!this.isGranted(AppPermissions.CRMBulkUpdates) && this.selectedOrderKeys.length > 1),
                    action: this.deleteOrders.bind(this)
                }]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [{
                    name: 'rules',
                    options: {
                        text: this.l('Settings'),
                        hint: this.l('Settings')
                    },
                    visible: this.isGranted(AppPermissions.CRMOrdersInvoices) ||
                        this.isGranted(AppPermissions.CRMSettingsConfigure),
                    action: this.invoiceSettings.bind(this)
                }]
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
                                    action: Function(),
                                    text: this.l('Save as PDF'),
                                    icon: 'pdf',
                                },
                                {
                                    action: this.exportData.bind(this, this.exportToXLS.bind(this)),
                                    text: this.l('Export to Excel'),
                                    icon: 'xls',
                                },
                                {
                                    action: this.exportData.bind(this, this.exportToCSV.bind(this)),
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet'
                                },
                                {
                                    action: this.exportData.bind(this, this.exportToGoogleSheet.bind(this)),
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet'
                                },
                                {
                                    type: 'downloadOptions',
                                    visible: this.showOrdersPipeline ||
                                        (this.ordersDataLayoutType === DataLayoutType.DataGrid)
                                }
                            ]
                        }
                    }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                areItemsDependent: true,
                items: [
                    // {
                    //     name: 'box',
                    //     action: this.toggleOrdersDataLayout.bind(this, DataLayoutType.Box),
                    //     options: {
                    //         checkPressed: () => {
                    //             return (this.ordersDataLayoutType == DataLayoutType.Box);
                    //         },
                    //     }
                    // },
                    {
                        name: 'pipeline',
                        action: this.toggleOrdersDataLayout.bind(this, DataLayoutType.Pipeline),
                        options: {
                            checkPressed: () => {
                                return this.ordersDataLayoutType === DataLayoutType.Pipeline;
                            }
                        }
                    },
                    {
                        name: 'dataGrid',
                        action: this.toggleOrdersDataLayout.bind(this, DataLayoutType.DataGrid),
                        options: {
                            checkPressed: () => {
                                return this.ordersDataLayoutType === DataLayoutType.DataGrid;
                            }
                        }
                    }
                ]
            }
        ];
    }

    private initSubscriptionsToolbarConfig() {
        this.subscriptionsToolbarConfig = this.getSubscriptionsToolbarConfig();
    }

    private getSubscriptionsToolbarConfig(): ToolbarGroupModel[] {
        return [
            {
                location: 'before',
                items: [
                    {
                        name: 'filters',
                        action: () => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                            }, 1000);
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
                            width: '279',
                            mode: 'search',
                            value: this.searchValue,
                            placeholder: this.l('Search') + ' ' + this.l('Subscriptions').toLowerCase(),
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
                        name: 'dataGrid',
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleSubscriptionsDataLayout.bind(this, DataLayoutType.DataGrid),
                        options: {
                            checkPressed: () => {
                                return (this.subscriptionsDataLayoutType === DataLayoutType.DataGrid);
                            }
                        }
                    },
                    {
                        name: 'pivotGrid',
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleSubscriptionsDataLayout.bind(this, DataLayoutType.PivotGrid),
                        options: {
                            checkPressed: () => {
                                return (this.subscriptionsDataLayoutType === DataLayoutType.PivotGrid);
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
                                    action: Function(),
                                    text: this.l('Save as PDF'),
                                    icon: 'pdf',
                                },
                                {
                                    action: (options) => {
                                        if (this.subscriptionsDataLayoutType === DataLayoutType.PivotGrid) {
                                            this.pivotGridComponent.dataGrid.instance.option(
                                                'export.fileName',
                                                this.exportService.getFileName(null, 'Subscriptions_PivotGrid')
                                            );
                                            this.pivotGridComponent.dataGrid.instance.exportToExcel();
                                        } else if (this.subscriptionsDataLayoutType === DataLayoutType.DataGrid) {
                                            this.dataGrid.instance.option('export.fileName', this.l('Subscriptions'));
                                            this.exportToXLS(options);
                                        }
                                    },
                                    text: this.l('Export to Excel'),
                                    icon: 'xls',
                                },
                                {
                                    action: (options) => {
                                        this.dataGrid.instance.option('export.fileName', this.l('Subscriptions'));
                                        this.exportToCSV(options);
                                    },
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet',
                                    visible: this.subscriptionsDataLayoutType === DataLayoutType.DataGrid
                                },
                                {
                                    action: (options) => {
                                        this.dataGrid.instance.option('export.fileName', this.l('Subscriptions'));
                                        this.exportToGoogleSheet(options);
                                    },
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet',
                                    visible: this.subscriptionsDataLayoutType === DataLayoutType.DataGrid
                                },
                                {
                                    type: 'downloadOptions',
                                    visible: this.subscriptionsDataLayoutType === DataLayoutType.DataGrid
                                }
                            ]
                        }
                    }
                ]
            }
        ];
    }

    exportPipelineSelectedItemsFilter(dataSource) {
        let selectedCards = this.pipelineComponent.getSelectedEntities();
        if (selectedCards.length) {
            dataSource.filter(selectedCards.map(card => {
                return ['Id', '=', card.Id];
            }).reduce((r, a) => r.concat([a, 'or']), []));
        }
        return selectedCards.length;
    }

    exportData(callback, options) {
        this.startLoading(true);
        if (this.showOrdersPipeline) {
            let importOption = 'all',
                instance = this.dataGrid.instance,
                dataSource: any = instance && instance.getDataSource(),
                checkExportOption = (dataSource, ignoreFilter = false) => {
                    if (options == importOption)
                        ignoreFilter || this.processFilterInternal();
                    else if (!this.exportPipelineSelectedItemsFilter(dataSource))
                        importOption = options;
                };

            if (dataSource) {
                checkExportOption(dataSource, true);
                callback(importOption).then(
                    () => dataSource.filter(null));
            } else {
                instance.option('dataSource',
                    dataSource = new DataSource(this.dataSource)
                );
                checkExportOption(dataSource);
                this.exportCallback = () => {
                    this.exportCallback = null;
                    callback(importOption).then(
                        () => dataSource.filter(null));
                };
            }
        } else {
            callback(options);
        }
    }

    toggleColumnChooser() {
        if (this.selectedOrderType.value === OrderType.Subscription &&
            this.subscriptionsDataLayoutType === DataLayoutType.PivotGrid
        ) {
            this.pivotGridComponent.toggleFieldPanel();
        } else {
            DataGridService.showColumnChooser(this.dataGrid);
        }
    }

    customizeAmountCell = (cellInfo) => {
        return this.currencyPipe.transform(cellInfo.value, this.currency, 'symbol', '1.2-2');
    }

    customizeAmountSummary = (cellInfo) => {
        return cellInfo.value !== undefined ? this.l('Sum') + ': ' + this.customizeAmountCell(cellInfo) : '';
    }

    toggleToolbar() {
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
        this.filtersService.fixed = false;
        this.filtersService.disable();
    }

    ngAfterViewInit(): void {
        this.initDataSource();
    }

    initDataSource() {
        if (this.selectedOrderType.value === OrderType.Order) {
            if (this.showOrdersPipeline) {
                if (!this.pipelineDataSource)
                    setTimeout(() => this.pipelineDataSource = this.getOrdersDataSourceConfig({ uri: this.ordersDataSourceURI }));
            } else
                this.setDataGridInstance(this.dataGrid);
        } else if (this.selectedOrderType.value === OrderType.Subscription) {
            if (this.subscriptionsDataLayoutType === DataLayoutType.DataGrid) {
                this.setDataGridInstance(this.dataGrid);
            } else if (this.subscriptionsDataLayoutType === DataLayoutType.PivotGrid) {
                this.setPivotGridInstance();
            }
        }
    }

    setDataGridInstance(dataGrid: DxDataGridComponent) {
        let instance = dataGrid && dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            dataGrid.dataSource = this.dataSource;
            if (!instance.option('paging.pageSize'))
                instance.option('paging.pageSize', 20);
        } else
            this.setGridDataLoaded();
    }

    private setPivotGridInstance() {
        const pivotGridInstance = this.pivotGridComponent && this.pivotGridComponent.dataGrid && this.pivotGridComponent.dataGrid.instance;
        CrmService.setDataSourceToComponent(this.subscriptionsPivotGridDataSource, pivotGridInstance);
    }

    onContentReady(event) {
        if (this.exportCallback)
            this.exportCallback();
        else {
            this.setGridDataLoaded();
            this.rowsViewHeight = DataGridService.getDataGridRowsViewHeight(event.component);
            event.component.columnOption('command:edit', {
                visibleIndex: -1,
                width: 40
            });
        }

        setTimeout(() => {
            this.appService.isClientSearchDisabled = 
                this.dataLayoutType.value == DataLayoutType.Pipeline;
        });
    }

    invalidate() {
        this.selectedOrders = [];
        this.processFilterInternal();
        this.refresh.next(null);
        this.filterChanged = true;
    }

    toggleOrdersDataLayout(dataLayoutType: DataLayoutType) {
        if (this.dataGrid)
            DataGridService.hideColumnChooser(this.dataGrid);
        this.showOrdersPipeline = dataLayoutType == DataLayoutType.Pipeline;
        this.dataLayoutType.next(this.ordersDataLayoutType = dataLayoutType);
        this.initDataSource();
        this.initOrdersToolbarConfig();
        if (this.showOrdersPipeline)
            this.dataGrid.instance.deselectAll();
        else {
            this.pipelineComponent.deselectAllCards();
            setTimeout(() => this.dataGrid.instance.repaint());
        }
        if (this.filterChanged) {
            this.filterChanged = false;
            setTimeout(() => this.processFilterInternal());
        }
    }

    toggleSubscriptionsDataLayout(dataLayouType: DataLayoutType) {
        this.subscriptionsDataLayoutType = dataLayouType;
        this.initDataSource();
        this.initSubscriptionsToolbarConfig();
        if (this.dataGrid)
            DataGridService.hideColumnChooser(this.dataGrid);
        if (this.subscriptionsDataLayoutType === DataLayoutType.DataGrid)
            this.dataGrid.instance.deselectAll();

        if (this.filterChanged) {
            this.filterChanged = false;
            setTimeout(() => this.processFilterInternal());
        }
    }

    initFilterConfig(hardUpdate: boolean = false): void {
        if (!hardUpdate && this.filters) {
            this.filtersService.setup(this.filters);
            this.filtersService.checkIfAnySelected();
        } else {
            this.filtersService.setup(this.filters = this.selectedOrderType.value === OrderType.Order
                ? this.ordersFilters
                : this.subscriptionsFilters
            );
        }
    }

    subscribeToFilter() {
        this.filtersService.apply(() => {
            this.selectedOrderKeys = [];
            this.filterChanged = true;
            this.processFilterInternal();
        });
    }

    toggleStages() {
        this.stagesComponent.toggle();
    }

    toggleCompactView() {
        if (this.showOrdersPipeline)
            this.pipelineService.toggleContactView();
        else {
            DataGridService.toggleCompactRowsHeight(this.dataGrid, true);
            this.gridCompactView.next(DataGridService.isCompactView(this.dataGrid));
        }
    }

    processFilterInternal() {
        let context: any = this;
        let grid: any;

        if (this.selectedOrderType.value === OrderType.Order) {
            grid = this.ordersGrid;
            this.ordersDataSource['entities'] = this.ordersDataSource['total'] = undefined;
        } else if (this.subscriptionsDataLayoutType === DataLayoutType.DataGrid) {
            grid = this.subscriptionsGrid;
            this.subscriptionsDataSource['entities'] = this.subscriptionsDataSource['total'] = undefined;
        } else
            grid = this.pivotGridComponent.dataGrid;

        if (this.selectedOrderType.value === OrderType.Order && this.showOrdersPipeline && this.pipelineComponent) {
            context = this.pipelineComponent;
            context.searchColumns = this.searchColumns;
            context.searchValue = this.searchValue;
        } else if (!grid)
            return;

        context.processODataFilter.call(
            context,
            grid.instance,
            this.selectedOrderType.value === OrderType.Order ? this.ordersDataSourceURI : this.subscriptionsDataSourceURI,
            this.filters,
            this.getCheckCustomFilter.bind(this),
            null,
            this.getSubscriptionsParams()
        );
    }

    private getCheckCustomFilter(filter: FilterModel) {
        if (this.selectedOrderType.value == OrderType.Subscription && filter.caption == 'Status')
            return FilterHelpers.filterBySubscriptionStatus(filter);
        else
            return this.filtersService.getCheckCustom(filter);
    }

    private getSubscriptionsParams() {
        let serviceIndex, levelIndex, serviceId = null, result = [],
            selectedFilter = this.selectedOrderType.value === OrderType.Order ?
                this.orderSubscriptionStatusFilter : this.subscriptionStatusFilter,
            selectedServices = selectedFilter.items.services['selectedItems'],
            selectedProducts = selectedFilter.items.products['selectedItems'];

        selectedProducts && selectedProducts.filter(item => Number.isInteger(item.id)).forEach((item, i) => {
            result.push({
                name: 'subscriptionsFilter.ProductIds[' + i + ']',
                value: item.id
            });
        });

        selectedServices && selectedServices.forEach(item => {
            if (serviceId != item.parentId) {
                levelIndex = 0;
                isNaN(serviceIndex) ? serviceIndex = 0 : serviceIndex++;
                serviceId = item.parentId || item.id;
                result.push({
                    name: 'subscriptionsFilter.Services[' + serviceIndex + '].ServiceId',
                    value: serviceId
                });
            }
            if (item.parentId) {
                result.push({
                    name: 'subscriptionsFilter.Services[' + serviceIndex + '].LevelIds[' + levelIndex + ']',
                    value: item.id
                });
                levelIndex++;
            }
        });
        return result;
    }

    searchValueChange(e: object) {
        if (this.filterChanged = (this.searchValue != e['value'])) {
            this.searchValue = e['value'];
            this._router.navigate([], { queryParams: { search: this.searchValue } });
            this.search.next(e['value']);
            this.processFilterInternal();
        }
    }

    onStagesLoaded($event) {
        this.stages = $event.stages.map(stage => {
            return {
                id: stage.pipeline.id + ':' + stage.id,
                index: stage.sortOrder,
                name: stage.name,
            };
        });
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    onCellClick(event, section = 'invoices') {
        let col = event.column;
        if (col && col.command)
            return;

        this.onCardClick({
            entity: event.data,
            entityStageDataSource: this.dataSource,
            loadMethod: null,
            queryParams: {},
            section: section
        });
    }

    onCardClick({ entity, entityStageDataSource, loadMethod, queryParams, section = 'invoices' }: {
        entity: OrderDto | SubscriptionDto,
        entityStageDataSource: any,
        loadMethod: () => any,
        queryParams: Params,
        section: string
    }) {
        if (entity && entity.ContactId) {
            let isOrder = this.selectedOrderType.value === OrderType.Order;

            if (!this.isGranted(AppPermissions.CRMOrdersInvoices))
                section = 'contact-information';

            this.searchClear = false;
            this._router.navigate(
                CrmService.getEntityDetailsLink(entity.ContactId, section, entity.LeadId),
                {
                    queryParams: {
                        ...(isOrder ? { orderId: entity.Id } : { subId: entity.Id }),
                        referrer: 'app/crm/orders',
                        contactGroupId: ContactGroup.Client,                        
                        dataLayoutType: DataLayoutType.Pipeline,
                        ...queryParams
                    }
                }
            );

            if (entityStageDataSource)
                this.itemDetailsService.setItemsSource(isOrder ? ItemTypeEnum.Order :
                    ItemTypeEnum.Subscription, entityStageDataSource, loadMethod);
        }
    }

    createInvoice() {
        this.dialog.open(CreateInvoiceDialogComponent, {
            panelClass: ['slider'],
            disableClose: true,
            closeOnNavigation: false,
            data: {
                refreshParent: this.invalidate.bind(this)
            }
        });
    }

    invoiceSettings() {
        this.dialog.open(InvoiceSettingsDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
        });
    }

    onOrderStageChanged(order: OrderDto) {
        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.getVisibleRows().some((row) => {
                const orderData: OrderDto = row.data;
                if (order.Id == orderData.Id) {
                    orderData.Stage = order.Stage;
                    orderData.StageId = order.StageId;
                    return true;
                }
            });
    }

    updateOrdersStage($event) {
        if (this.permission.isGranted(AppPermissions.CRMBulkUpdates)) {
            this.stagesComponent.tooltipVisible = false;
            this.pipelineService.updateEntitiesStage(
                this.pipelinePurposeId,
                this.selectedOrders,
                $event.name,
                null
            ).subscribe((declinedList) => {
                this.filterChanged = true;
                if (this.showOrdersPipeline)
                    this.pipelineComponent.refresh();
                else {
                    let gridInstance = this.dataGrid && this.dataGrid.instance;
                    if (gridInstance && declinedList && declinedList.length)
                        gridInstance.selectRows(declinedList.map(item => item.Id), false);
                    else
                        gridInstance.clearSelection();
                }
                if (!declinedList.length) {
                    this.notify.success(this.l('StageSuccessfullyUpdated'));
                }
            });
        }
    }

    onSelectionChanged($event) {
        this.selectedOrders = $event.component.getSelectedRowsData();
    }

    updateTotalCount(totalCount: number) {
        this.totalCount = totalCount;
    }

    deleteOrders(orderIds?) {
        ContactsHelper.showConfirmMessage(
            this.l('OrdersDeleteWarningMessage'),
            (isConfirmed: boolean, [forceDelete]: boolean[]) => {
                if (isConfirmed) {
                    this.deleteOrdersInternal(forceDelete, orderIds);
                }
            },
            [{ text: this.l('ForceDelete'), visible: this.permission.isGranted(AppPermissions.CRMForceDeleteEntites), checked: false }]
        );
    }

    private deleteOrdersInternal(forceDelete: boolean, orderIds?: number[]) {
        this.startLoading();
        forkJoin(
            (orderIds || this.selectedOrderKeys).map(id => this.orderProxy.delete(id, forceDelete))
        ).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.invalidate();
            this.dataGrid.instance.deselectAll();
            this.notify.success(this.l('SuccessfullyDeleted'));
            this.filterChanged = true;
        });
    }

    onOrderTypeChanged(event) {
        if (this.dataGrid)
            DataGridService.hideColumnChooser(this.dataGrid);

        if (event.value != this.selectedOrderType.value) {
            this.searchClear = true;
            this.selectedOrderType.next(event.value);
        }
    }

    onContactGroupChanged(event) {
        if (this.dataGrid)
            DataGridService.hideColumnChooser(this.dataGrid);

        if (event.itemData.value != this.selectedContactGroup.value) {
            this.selectedContactGroup.next(event.itemData.value);
            setTimeout(() => this.filtersService.change([]));
        }
    }

    private changeOrderType(orderType: OrderType) {
        if (this.searchClear) {
            this.searchValue = '';
            this.search.next(this.searchValue);
        }
        this.filterChanged = true;
        this.initFilterConfig(true);
        if (orderType == OrderType.Order)
            this.initOrdersToolbarConfig();
        else
            this.initSubscriptionsToolbarConfig();
        setTimeout(() => {
            this.initDataSource();
            this.filtersService.change([]);
        });
    }

    showContactDetails(event, section?: string, queryParams?: Params) {
        if (!event.data.LeadId || !event.data.ContactId)
            return;

        this.searchClear = false;
        event.component && event.component.cancelEditData();

        this.onCardClick({
            entity: event.data,
            entityStageDataSource: event.dataSource || this.dataSource,
            loadMethod: event.loadMethod,
            queryParams: queryParams,
            section: section
        });
    }

    toggleActionsMenu(event) {
        ActionMenuService.toggleActionMenu(event, this.actionEvent).subscribe(actionRecord => {
            ActionMenuService.prepareActionMenuGroups(this.actionMenuGroups, event.data);
            this.actionEvent = actionRecord;
        });
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionEvent = null;
        this.actionMenu.hide();
    }

    openEntityChecklistDialog(data?) {
        this.dialog.closeAll();
        let entity = data || this.actionEvent.data || this.actionEvent;
        this.dialog.open(EntityCheckListDialogComponent, {
            panelClass: ['slider'],
            hasBackdrop: false,
            closeOnNavigation: true,
            data: {
                entity: entity,
                pipelinePurposeId: this.pipelinePurposeId
            }
        });
    }

    deactivate() {
        super.deactivate();
        this.filtersService.unsubscribe();
        this.hideHostElement();
    }

    ngOnDestroy() {
        this.deactivate();
    }
}