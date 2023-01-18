/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import { Params, RouteReuseStrategy } from '@angular/router';
import { HttpClient } from '@angular/common/http';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { select, Store } from '@ngrx/store';
import { Subject, BehaviorSubject, combineLatest, concat, merge, 
    Observable, of, Subscription, forkJoin, from } from 'rxjs';
import {
    filter,
    finalize,
    first,
    map,
    mapTo,
    pluck,
    publishReplay,
    refCount,
    skip,
    switchMap,
    takeUntil,
    tap
} from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppService } from '@app/app.service';
import {
    AppStore,
    ContactAssignedUsersStoreSelectors,
    ListsStoreSelectors,
    RatingsStoreSelectors,
    StarsStoreSelectors,
    TagsStoreSelectors
} from '@app/store';
import { ClientService } from '@app/crm/clients/clients.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup, ContactStatus } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { TagsListComponent } from '@app/shared/common/lists/tags-list/tags-list.component';
import { ListsListComponent } from '@app/shared/common/lists/lists-list/lists-list.component';
import { UserAssignmentComponent } from '@app/shared/common/lists/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '@app/shared/common/lists/rating/rating.component';
import { StarsListComponent } from '../shared/stars-list/stars-list.component';
import { CreateEntityDialogComponent } from '@shared/common/create-entity-dialog/create-entity-dialog.component';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterStatesComponent } from '@shared/filters/states/filter-states.component';
import { FilterStatesModel } from '@shared/filters/states/filter-states.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FilterRangeComponent } from '@shared/filters/range/filter-range.component';
import { FilterMultilineInputComponent } from '@shared/filters/multiline-input/filter-multiline-input.component';
import { FilterSourceComponent } from '../shared/filters/source-filter/source-filter.component';
import { FilterMultilineInputModel } from '@shared/filters/multiline-input/filter-multiline-input.model';
import { FilterContactStatusComponent } from '@app/crm/shared/filters/contact-status-filter/contact-status-filter.component';
import { FilterContactStatusModel } from '@app/crm/shared/filters/contact-status-filter/contact-status-filter.model';
import { FilterRadioGroupComponent } from '@shared/filters/radio-group/filter-radio-group.component';
import { FilterNullableRadioGroupModel } from '@shared/filters/radio-group/filter-nullable-radio-group.model';
import {
    UpdateContactStatusesInput,
    ProductDto,
    ProductType,
    ProductServiceProxy,
    ContactEmailServiceProxy,
    ContactServiceProxy,    
    CreateContactEmailInput,
    LayoutType
} from '@shared/service-proxies/service-proxies';
import { CustomReuseStrategy } from '@shared/common/custom-reuse-strategy/custom-reuse-strategy.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { EditContactDialog } from '../contacts/edit-contact-dialog/edit-contact-dialog.component';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { AppPermissions } from '@shared/AppPermissions';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import {
    OrganizationUnitsStoreSelectors,
    SubscriptionsStoreActions,
    SubscriptionsStoreSelectors
} from '@app/crm/store';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PivotGridComponent } from '@app/shared/common/slice/pivot-grid/pivot-grid.component';
import { CrmService } from '@app/crm/crm.service';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';
import { ChartComponent } from '@app/shared/common/slice/chart/chart.component';
import { ImageFormat } from '@shared/common/export/image-format.enum';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { MapComponent } from '@app/shared/common/slice/map/map.component';
import { MapArea } from '@app/shared/common/slice/map/map-area.enum';
import { MapService } from '@app/shared/common/slice/map/map.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';
import { SubscriptionsFilterComponent } from '@app/crm/shared/filters/subscriptions-filter/subscriptions-filter.component';
import { SubscriptionsFilterModel } from '@app/crm/shared/filters/subscriptions-filter/subscriptions-filter.model';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { FilterStatesService } from '@shared/filters/states/filter-states.service';
import { SourceFilterModel } from '../shared/filters/source-filter/source-filter.model';
import { NameParserService } from '@shared/common/name-parser/name-parser.service';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';
import { ContactDto } from '@app/crm/clients/contact.dto';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ClientFields } from '@app/crm/clients/client-fields.enum';
import { SummaryBy } from '@app/shared/common/slice/chart/summary-by.enum';
import { ActionMenuGroup } from '@app/shared/common/action-menu/action-menu-group.interface';
import { Status } from '@app/crm/contacts/operations-widget/status.interface';
import { CreateEntityDialogData } from '@shared/common/create-entity-dialog/models/create-entity-dialog-data.interface';
import { AddSubscriptionDialogComponent } from '@app/crm/contacts/subscriptions/add-subscription-dialog/add-subscription-dialog.component';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { AppFeatures } from '@shared/AppFeatures';

@Component({
    templateUrl: './clients.component.html',
    styleUrls: [
        '../shared/styles/client-status.less',
        '../shared/styles/grouped-action-menu.less',
        './clients.component.less'
    ],
    providers: [
        ClientService,
        ContactServiceProxy,
        MapService,
        LifecycleSubjectsService,
        ImpersonationService,
        ProductServiceProxy
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild('sourceList') sourceComponent: SourceContactListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild(StaticListComponent) statusComponent: StaticListComponent;
    @ViewChild(PivotGridComponent) pivotGridComponent: PivotGridComponent;
    @ViewChild(ChartComponent, { static: true }) chartComponent: ChartComponent;
    @ViewChild(MapComponent) mapComponent: MapComponent;
    @ViewChild(ToolBarComponent) toolbar: ToolBarComponent;

    private readonly dataSourceURI: string = 'Contact';
    private readonly totalDataSourceURI: string = 'Contact/$count';
    private readonly groupDataSourceURI: string = 'ContactSlice';
    private readonly dateField = 'ContactDate';
    private subRouteParams: any;
    private dependencyChanged = false;
    rowsViewHeight: number;
    isMergeAllowed = this.isGranted(AppPermissions.CRMMerge);
    isOrdersMergeAllowed = this.isGranted(AppPermissions.CRMOrdersManage);

    starsLookup = {};
    formatting = AppConsts.formatting;
    isCfoLinkOrVerifyEnabled = this.appService.isCfoLinkOrVerifyEnabled;
    canSendVerificationRequest = this.appService.canSendVerificationRequest();
    isCFOClientAccessAllowed = this.appService.checkCFOClientAccessPermission();
    tenantHasBankCodeFeature = this.userManagementService.checkBankCodeFeature();
    statuses: Status[] = Object.keys(ContactStatus).map(status => {
        return {
            id: ContactStatus[status],
            name: status,
            displayName: this.l(status)
        }
    });
    assignedUsersSelector = select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, { contactGroup: ContactGroup.Client });
    filterModelOrgUnit: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'SourceOrganizationUnitId',
        hidden: this.appSession.hideUserSourceFilters,
        field: 'SourceOrganizationUnitId',
        items: {
            element: new FilterCheckBoxesModel({
                dataSource$: this.store$.pipe(select(OrganizationUnitsStoreSelectors.getOrganizationUnits)),
                nameField: 'displayName',
                keyExpr: 'id'
            })
        }
    });
    filterModelSource: FilterModel = new FilterModel({
        component: FilterSourceComponent,
        caption: 'Source',
        hidden: this.appSession.hideUserSourceFilters,
        items: {
            element: new SourceFilterModel({
                ls: this.localizationService
            })
        }
    });
    filterModelLists: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'List',
        field: 'ListId',
        items: {
            element: new FilterCheckBoxesModel(
                {
                    dataSource$: this.store$.pipe(select(ListsStoreSelectors.getStoredLists)),
                    nameField: 'name',
                    keyExpr: 'id'
                })
        }
    });
    filterModelTags: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'Tag',
        hidden: this.appSession.hideUserSourceFilters,
        field: 'TagId',
        items: {
            element: new FilterCheckBoxesModel({
                dataSource$: this.store$.pipe(select(TagsStoreSelectors.getStoredTags)),
                nameField: 'name',
                keyExpr: 'id'
            })
        }
    });
    filterModelAssignment: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'assignedUser',
        hidden: this.appSession.hideUserSourceFilters,
        field: 'AssignedUserId',
        items: {
            element: new FilterCheckBoxesModel(
                {
                    dataSource$: this.store$.pipe(this.assignedUsersSelector),
                    nameField: 'name',
                    keyExpr: 'id'
                })
        }
    });
    filterModelStatus: FilterModel = new FilterModel({
        component: FilterContactStatusComponent,
        caption: 'status',
        filterMethod: () => {return {}},
        isSelected: true,
        items: {
            element: new FilterContactStatusModel({
                ls: this.localizationService
            })
        }
    });
    filterCountryStates: FilterModel = new FilterModel({
        component: FilterStatesComponent,
        caption: 'states',
        items: {
            countryStates: new FilterStatesModel(this.filterStatesService)
        }
    });
    filterModelRating: FilterModel = new FilterModel({
        component: FilterRangeComponent,
        operator: { from: 'ge', to: 'le' },
        hidden: this.appSession.hideUserSourceFilters,
        caption: 'Rating',
        field: 'Rating',
        items$: this.store$.pipe(select(RatingsStoreSelectors.getRatingItems))
    });
    filterModelStar: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'Star',
        field: 'StarId',
        items: {
            element: new FilterCheckBoxesModel(
                {
                    dataSource$: this.store$.pipe(select(StarsStoreSelectors.getStars), tap(stars => {
                        stars && stars.forEach(star => {
                            this.starsLookup[star.id] = star;
                        });
                    })),
                    nameField: 'name',
                    keyExpr: 'id',
                    templateFunc: (itemData) => {
                        return `<div class="star-item">
                                    <span class="star star-${itemData.colorType.toLowerCase()}"></span>
                                    <span>${this.l(itemData.name)}</span>
                                </div>`;
                    }
                })
        }
    });    
    contactStatus = ContactStatus;
    selectedClientKeys: any = [];
    get selectedClients(): Observable<ContactDto[]> {
        if (this.dataGrid) {
            let visibleRows = this.dataGrid.instance.getVisibleRows(),
                selection: Promise<ContactDto[]> | ContactDto[];
            if (this.selectedClientKeys.every(key => visibleRows.some(row => row.data.Id == key)))
                selection = visibleRows.map(item => {
                    return item.isSelected ? item.data : false;
                }).filter(Boolean);
            else
                selection = this.dataGrid.instance.getSelectedRowsData();
            return (selection instanceof Array ? of(selection) : from(selection));
        } else
            return of([]);
    }
    headlineButtons: HeadlineButton[] = [
        {
            enabled: this.permission.checkCGPermission([ContactGroup.Client]),
            action: this.createClient.bind(this),
            label: this.l('CreateNewCustomer')
        }
    ];

    impersonationIsGranted = this.permission.isGranted(
        AppPermissions.AdministrationUsersImpersonation
    );

    isSMSIntegrationDisabled = abp.setting.get('Integrations:YTel:IsEnabled') == 'False';
    maxMessageCount = this.contactService.getFeatureCount(AppFeatures.CRMMaxCommunicationMessageCount);
    isSubscriptionManagementEnabled = abp.features.isEnabled(AppFeatures.CRMSubscriptionManagementSystem);

    actionEvent: any;
    actionMenuGroups: ActionMenuGroup[] = [
        {
            key: '',
            visible: true,
            items: [
                {
                    text: this.l('SMS'),
                    class: 'sms fa fa-commenting-o',
                    disabled: this.isSMSIntegrationDisabled || !this.maxMessageCount,
                    checkVisible: (data?) => {
                        return abp.features.isEnabled(AppFeatures.InboundOutboundSMS) &&
                            this.permission.checkCGPermission([data.ContactGroupId], 'ViewCommunicationHistory.SendSMSAndEmail');
                    },
                    action: () => {
                        this.contactService.showSMSDialog({
                            phoneNumber: (this.actionEvent.data || this.actionEvent).Phone
                        });
                    }
                },
                {
                    text: this.l('SendEmail'),
                    class: 'email',
                    disabled: !this.maxMessageCount,
                    checkVisible: (data?) => {
                        return this.permission.checkCGPermission([data.ContactGroupId], 'ViewCommunicationHistory.SendSMSAndEmail');
                    },
                    action: () => {
                        this.contactService.showEmailDialog({
                            contactId: (this.actionEvent.data || this.actionEvent).Id
                        }).subscribe();
                    }
                }
            ]
        },
        {
            key: '',
            visible: true,
            items: [
                {
                    text: this.l('LoginAsThisUser'),
                    class: 'login',
                    checkVisible: (client: ContactDto) => {
                        return !!client.UserId && (
                            this.impersonationIsGranted ||
                            this.permission.checkCGPermission([client.GroupId], 'UserInformation.AutoLogin')
                        );
                    },
                    action: () => {
                        this.impersonationService.impersonate(this.actionEvent.UserId, this.appSession.tenantId);
                    }
                },
                {
                    text: this.l('LoginToPortal'),
                    class: 'login',
                    checkVisible: (client: ContactDto) => !!client.UserId && !!AppConsts.appMemberPortalUrl
                        && (
                            this.impersonationIsGranted ||
                            this.permission.checkCGPermission([client.GroupId], 'UserInformation.AutoLogin')
                        ),
                    action: () => this.impersonationService.impersonate(this.actionEvent.UserId, this.appSession.tenantId, AppConsts.appMemberPortalUrl)
                },
                {
                    text: this.l('NotesAndCallLog'),
                    class: 'notes',
                    action: () => {
                        this.showClientDetails(this.actionEvent, 'notes');
                    },
                    button: {
                        text: '+' + this.l('Add'),
                        action: (event) => {
                            event.stopPropagation();
                            this.showClientDetails(this.actionEvent, 'notes', {
                                addNew: true
                            });
                            this.actionEvent = undefined;
                        }
                    }
                },
                {
                    text: this.l('Appointment'),
                    class: 'appointment',
                    disabled: true,
                    action: () => {}
                },
                {
                    text: this.l('Orders'),
                    class: 'orders',
                    disabled: !abp.features.isEnabled(AppFeatures.CRMInvoicesManagement),
                    action: () => {
                        this.showClientDetails(this.actionEvent, 'invoices');
                    }
                },
                {
                    text: this.l('Notifications'),
                    class: 'notifications',
                    disabled: true,
                    action: () => {}
                }
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
                    action: () => {
                        this.contactService.deleteContact(
                            this.actionEvent.Name,
                            [ContactGroup.Client],
                            (this.actionEvent.data || this.actionEvent).Id,
                            () => this.refresh()
                        );
                    }
                },
                {
                    text: this.l('EditRow'),
                    class: 'edit',
                    action: () => this.showClientDetails(this.actionEvent)
                }
            ]
        }
    ];
    permissions = AppPermissions;
    pivotGridDataIsLoading: boolean;
    searchValue: string = this._activatedRoute.snapshot.queryParams.search || '';
    private pivotGridDataSource = {
        remoteOperations: true,
        load: (loadOptions) => {
            this.pivotGridDataIsLoading = true;

            let params = {
                contactGroupId: ContactGroup.Client,
                ...this.getSubscriptionFilterObjectValue()
            };
            (<FilterContactStatusModel>this.filterModelStatus.items.element).applyRequestParams({params: params});

            return this.crmService.loadSlicePivotGridData(
                this.getODataUrl(this.groupDataSourceURI),
                this.filters,
                loadOptions,
                /** @todo change to strict typing and handle typescript error */
                params
            );
        },
        onChanged: () => {
            this.pivotGridDataIsLoading = false;
            this.loadTotalsRequest.next();
        },
        fields: [
            {
                area: 'row',
                dataField: 'Country',
                name: 'country',
                expanded: true,
                sortBy: 'displayText'
            },
            {
                area: 'row',
                dataField: 'State',
                name: 'state',
                sortBy: 'displayText'
            },
            {
                area: 'row',
                dataField: 'City',
                name: 'city',
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
                area: 'column',
                dataField: this.dateField,
                dataType: 'date',
                groupInterval: 'year',
                name: 'year',
                showTotals: false
            },
            {
                area: 'column',
                dataField: this.dateField,
                dataType: 'date',
                groupInterval: 'quarter',
                showTotals: false,
            },
            {
                area: 'column',
                dataField: this.dateField,
                dataType: 'date',
                groupInterval: 'month',
                showTotals: false
            },
            {
                area: 'filter',
                dataField: this.dateField,
                dataType: 'date',
                groupInterval: 'day',
                showTotals: false
            },
            {
                area: 'filter',
                dataField: 'CompanyName'
            },
            {
                area: 'filter',
                dataField: 'Rating'
            },
            {
                area: 'filter',
                dataField: 'Status'
            },
            {
                area: 'filter',
                dataField: 'ZipCode'
            }
        ]
    };
    private dataLayoutType: BehaviorSubject<DataLayoutType> = new BehaviorSubject(
        this.isSlice ? DataLayoutType.PivotGrid : DataLayoutType.DataGrid
    );
    dataLayoutType$: Observable<DataLayoutType> = this.dataLayoutType.asObservable().pipe(tap((layoutType) => {
        this.appService.isClientSearchDisabled = layoutType != DataLayoutType.DataGrid;
    }));
    hideDataGrid$: Observable<boolean> = this.dataLayoutType$.pipe(map((dataLayoutType: DataLayoutType) => {
        return dataLayoutType !== DataLayoutType.DataGrid;
    }));
    hidePivotGrid$: Observable<boolean> = this.dataLayoutType$.pipe(map((dataLayoutType: DataLayoutType) => {
        return dataLayoutType !== DataLayoutType.PivotGrid;
    }));
    hideChart$: Observable<boolean> = this.dataLayoutType$.pipe(map((dataLayoutType: DataLayoutType) => {
        return dataLayoutType !== DataLayoutType.Chart;
    }));
    hideMap$: Observable<boolean> = this.dataLayoutType$.pipe(map((dataLayoutType: DataLayoutType) => {
        return dataLayoutType !== DataLayoutType.Map;
    }));
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    private refresh$: Observable<null> = this._refresh.asObservable();
    mapDataIsLoading = false;
    filterChanged$: Observable<FilterModel[]> = this.filtersService.filtersChanged$.pipe(
        filter(() => this.componentIsActivated)
    );
    selectedMapArea$: Observable<MapArea> = this.mapService.selectedMapArea$;
    chartInfoItems: InfoItem[];
    chartDataUrl: string;
    chartDataSource = new DataSource({
        key: 'id',
        load: () => {
            return this.odataRequestValues$.pipe(
                first(),
                switchMap((odataRequestValues: ODataRequestValues) => {
                    let params = {
                        contactGroupId: ContactGroup.Client,
                        ...this.getSubscriptionFilterObjectValue()
                    };
                    (<FilterContactStatusModel>this.filterModelStatus.items.element).applyRequestParams({params: params});

                    const chartDataUrl = this.chartDataUrl || this.crmService.getChartDataUrl(
                        this.getODataUrl(this.groupDataSourceURI),
                        odataRequestValues,
                        this.chartComponent.summaryBy.value,
                        this.dateField,
                        params
                    );
                    return this.httpClient.get(chartDataUrl);
                })
            ).toPromise().then((result: any) => {
                result = this.crmService.parseChartData(result);
                this.chartDataUrl = null;
                this.chartInfoItems = result.infoItems;
                this.loadTotalsRequest.next();
                return result.items;
            });
        }
    });
    sliceStorageKey = 'CRM_Clients_Slice_' + this.sessionService.tenantId + '_' + this.sessionService.userId;
    contentWidth$: Observable<number> = this.crmService.contentWidth$;
    contentHeight$: Observable<number> = this.crmService.contentHeight$;
    mapHeight$: Observable<number> = this.crmService.mapHeight$;
    public usersInstancesLoadingSubscription: Subscription;
    totalCount: number;
    totalErrorMsg: string;
    toolbarConfig: ToolbarGroupModel[];
    private subscriptionStatusFilter = new FilterModel({
        component: SubscriptionsFilterComponent,
        caption: 'SubscriptionStatus',
        field: 'ServiceTypeId',
        items: {
            services: new SubscriptionsFilterModel(
                {
                    filterBy: 'Services',
                    filterKey: 'ServiceId',
                    dataSource$: this.store$.pipe(
                        select(SubscriptionsStoreSelectors.getSubscriptions),
                        filter(Boolean), first()
                    ),
                    dispatch: () => {
                        if (this.isGranted(AppPermissions.CRMOrders) || this.isGranted(AppPermissions.CRMProducts))
                            this.store$.dispatch(new SubscriptionsStoreActions.LoadRequestAction(false));
                    },
                    nameField: 'name',
                    itemsExpr: 'memberServiceLevels',
                    ignoreParent: false
                }
            ),
            products: new SubscriptionsFilterModel(
                {
                    filterBy: 'Products',
                    filterKey: 'ProductId',
                    filterMode: 'All',
                    dataSource$: this.isGranted(AppPermissions.CRMOrders) || this.isGranted(AppPermissions.CRMProducts) ?
                        this.productProxy.getProducts(
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
                        ) : undefined,
                    nameField: 'name',
                    codeField: 'code',
                    keyExpr: 'id',
                    itemsExpr: 'products',
                    ignoreParent: true
                }
            )
        }
    });
    private filters: FilterModel[] = this.getFilters();
    loadTotalsRequest: Subject<ODataRequestValues> = new Subject<ODataRequestValues>(); 
    loadTotalsRequest$: Observable<ODataRequestValues> = this.loadTotalsRequest.asObservable();
    odataRequestValues$: Observable<ODataRequestValues> = concat(
        this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom),
        this.filterChanged$.pipe(
            switchMap(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom))
        )
    ).pipe(
        filter((odataRequestValues: ODataRequestValues) => !!odataRequestValues)
    );
    mapData$: Observable<MapData>;
    mapInfoItems$: Observable<InfoItem[]>;
    private queryParams$: Observable<Params> = this._activatedRoute.queryParams.pipe(
        takeUntil(this.destroy$),
        filter(() => this.componentIsActivated)
    );
    isBankCodeLayoutType: boolean = this.userManagementService.isLayout(LayoutType.BankCode);
    readonly clientFields: KeysEnum<ContactDto> = ClientFields;

    constructor(
        injector: Injector,
        private authService: AppAuthService,
        private store$: Store<AppStore.State>,
        private reuseService: RouteReuseStrategy,
        private contactService: ContactsService,
        private pipelineService: PipelineService,
        private filtersService: FiltersService,
        private clientService: ClientService,
        private productProxy: ProductServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private contactEmailService: ContactEmailServiceProxy,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private itemDetailsService: ItemDetailsService,
        private impersonationService: ImpersonationService,
        private sessionService: AppSessionService,
        private mapService: MapService,
        private filterStatesService: FilterStatesService,
        private nameParserService: NameParserService,
        private httpClient: HttpClient,
        public crmService: CrmService,
        public dialog: MatDialog,
        public appService: AppService,
        public contactProxy: ContactServiceProxy,
        public userManagementService: UserManagementService
    ) {
        super(injector);
        if (this.tenantHasBankCodeFeature) {
            this.pivotGridDataSource.fields.unshift({
                area: 'filter',
                dataField: 'BankCode'
            });
        }

        this.dataSource = new DataSource({
            store: new ODataStore({
                key: this.clientFields.Id,
                url: this.getODataUrl(
                    this.dataSourceURI,
                    [
                        FiltersService.filterByParentId()
                    ]
                ),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.params.$select = DataGridService.getSelectFields(
                        this.dataGrid,
                        [
                            this.clientFields.Id,
                            this.clientFields.OrganizationId,
                            this.clientFields.UserId,
                            this.clientFields.Email,
                            this.clientFields.Phone,
                            this.clientFields.StarId,
                            this.clientFields.IsSubscribedToEmails,
                        ]
                    );

                    (<FilterContactStatusModel>this.filterModelStatus.items.element).applyRequestParams(request);
                    
                    request.params.contactGroupId = ContactGroup.Client;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                onLoaded: (records) => {
                    if (records instanceof Array) {
                        let userIds = this.getUserIds(records);
                        this.dataSource['entities'] = (this.dataSource['entities'] || []).concat(records);
                        this.usersInstancesLoadingSubscription = this.appService.isCfoLinkOrVerifyEnabled && userIds.length ?
                            this.crmService.getUsersWithInstances(userIds).subscribe(() => {
                                this.changeDetectorRef.markForCheck();
                            }) : of().subscribe();
                    }
                    this.loadTotalsRequest.next();
                },
                errorHandler: (error) => {
                    setTimeout(() => this.isDataLoaded = true);
                }
            })
        });
        this.dataSource['exportIgnoreOnLoaded'] = true;
        this.totalDataSource = new DataSource({
            paginate: false,
            store: new ODataStore({
                url: this.getODataUrl(this.totalDataSourceURI, [
                    FiltersService.filterByParentId()
                ]),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    this.totalCount = this.totalErrorMsg = undefined;

                    (<FilterContactStatusModel>this.filterModelStatus.items.element).applyRequestParams(request);
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    request.params.contactGroupId = ContactGroup.Client;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                onLoaded: (count: any) => {
                    if (!isNaN(count)) {
                        this.dataSource['total'] = this.totalCount = count;
                        this.changeDetectorRef.detectChanges();
                    }
                },
                errorHandler: (e: any) => {
                    this.totalErrorMsg = this.l('AnHttpErrorOccured');
                    this.changeDetectorRef.detectChanges();
                }                
            })
        });
    }

    ngOnInit() {
        this.handleTotalCountUpdate();
        this.handleDataGridUpdate();
        this.handlePivotGridUpdate();
        this.handleChartUpdate();
        this.handleMapUpdate();
        this.handleStageChange();
        this.activate();
        this.handleModuleChange();
        this.handleDataLayoutTypeInQuery();
        this.crmService.handleCountryStateParams(this.queryParams$, this.filterCountryStates);
        this.handleFiltersPining();
    }

    get isSlice() {
        return this.appService.getModule() === 'slice';
    }

    private handleFiltersPining() {
        const filterFixed$ = this.filtersService.filterFixed$.pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            skip(1)
        );
        filterFixed$.pipe(
            switchMap(this.waitUntil(DataLayoutType.DataGrid))
        ).subscribe(() => {
            this.repaintDataGrid(1000);
        });
        filterFixed$.pipe(
            switchMap(this.waitUntil(DataLayoutType.PivotGrid))
        ).subscribe(() => {
            if (this.pivotGridComponent) {
                setTimeout(() => {
                    this.pivotGridComponent.dataGrid.instance.updateDimensions();
                }, 1001);
            }
        });
    }

    private waitUntil(layoutType: DataLayoutType) {
        return (data) => this.dataLayoutType.value === layoutType ? of(data) : this.dataLayoutType$.pipe(
            filter((dataLayoutType: DataLayoutType) => dataLayoutType === layoutType),
            first(),
            mapTo(data)
        );
    }

    private getUserIds(records) {
        return records ? records.reduce((ids, item) => {
            if (item.items)
                Array.prototype.push.apply(ids,
                    this.getUserIds(item.items)
                );
            else if (item.UserId)
                ids.push(item.UserId);
            return ids;
        }, []) : [];
    }

    private handleTotalCountUpdate() {
        combineLatest(
            this.odataRequestValues$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            switchMap(([odataRequestValues, ]: [ODataRequestValues, null]) => {
                return this.loadTotalsRequest$.pipe(first(), map(() => odataRequestValues));
            })
        ).subscribe((odataRequestValues: ODataRequestValues) => {
            let url = this.getODataUrl(
                this.totalDataSourceURI,
                odataRequestValues.filter,
                null, [...this.getSubscriptionFilterValue(), ...odataRequestValues.params]
            );
            if (url && this.oDataService.requestLengthIsValid(url)) {
                this.totalDataSource['_store']['_requestDispatcher']['_url'] = url;
                this.totalDataSource.load();
            }
        });
    }

    private handleDataGridUpdate(): void {
        this.listenForUpdate(DataLayoutType.DataGrid).pipe(skip(1)).subscribe(() => {
            this.processFilterInternal();
        });
    }

    private handlePivotGridUpdate(): void {
        this.listenForUpdate(DataLayoutType.PivotGrid).pipe(skip(1)).subscribe(() => {
            this.pivotGridComponent.dataGrid.instance.updateDimensions();
            this.processFilterInternal();
        });
    }

    private handleModuleChange() {
        merge(
            this.dataLayoutType$,
            this.lifeCycleSubjectsService.activate$
        ).pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.crmService.handleModuleChange(this.dataLayoutType.value);
        });
    }

    private handleChartUpdate() {
        combineLatest(
            this.chartComponent.summaryBy$,
            this.listenForUpdate(DataLayoutType.Chart)
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
        ).subscribe(([summaryBy, [odataRequestValues, ]]: [SummaryBy, [ODataRequestValues, ]]) => {
            let params = {contactGroupId: ContactGroup.Client};
            (<FilterContactStatusModel>this.filterModelStatus.items.element).applyRequestParams({params: params});

            const chartDataUrl = this.crmService.getChartDataUrl(
                this.getODataUrl(this.groupDataSourceURI),
                odataRequestValues,
                summaryBy,
                this.dateField,
                params
            );
            if (!this.oDataService.requestLengthIsValid(chartDataUrl)) {
                this.message.error(this.l('QueryStringIsTooLong'));
            } else {
                this.chartDataUrl = chartDataUrl;
                this.chartDataSource.load();
            }
        });
    }

    private handleMapUpdate() {
        const clientsData$ = combineLatest(
            this.listenForUpdate(DataLayoutType.Map),
            this.selectedMapArea$
        ).pipe(
            map(([[odataRequestValues, ], mapArea]: [[ODataRequestValues, null], MapArea]) => {
                let params = {
                    contactGroupId: ContactGroup.Client,
                    ...this.getSubscriptionFilterObjectValue()
                };
                (<FilterContactStatusModel>this.filterModelStatus.items.element).applyRequestParams({params: params});

                return this.mapService.getSliceMapUrl(
                    this.getODataUrl(this.groupDataSourceURI),
                    odataRequestValues,
                    mapArea,
                    this.dateField,
                    params
                );
            }),
            filter((mapUrl: string) => {
                if (!this.oDataService.requestLengthIsValid(mapUrl)) {
                    this.message.error(this.l('QueryStringIsTooLong'));
                    return false;
                }
                return true;
            }),
            tap(() => this.mapDataIsLoading = true),
            switchMap((mapUrl: string) => this.httpClient.get(mapUrl)),
            publishReplay(),
            refCount(),
            tap(() => this.mapDataIsLoading = false)
        );
        this.mapData$ = this.mapService.getAdjustedMapData(clientsData$);
        this.mapInfoItems$ = this.mapService.getMapInfoItems(clientsData$, this.selectedMapArea$);
    }

    private handleStageChange() {
        this.pipelineService.stageChange$.subscribe((lead) => {
            this.dependencyChanged = (lead.Stage == _.last(this.pipelineService.getStages(AppConsts.PipelinePurposeIds.lead, ContactGroup.Client)).name);
        });
    }

    private handleDataLayoutTypeInQuery() {
        this.queryParams$.pipe(
            pluck('dataLayoutType'),
            filter((dataLayoutType: DataLayoutType) => dataLayoutType && dataLayoutType != this.dataLayoutType.value)
        ).subscribe((dataLayoutType) => {
            this.toggleDataLayout(+dataLayoutType);
        });
    }

    private paramsSubscribe() {
        if (!this.subRouteParams || this.subRouteParams.closed)
            this.subRouteParams = this._activatedRoute.queryParams
                .pipe(takeUntil(this.deactivate$))
                .subscribe(params => {
                    const searchValueChanged = params.search && this.searchValue !== params.search;
                    if (searchValueChanged) {
                        this.searchValue = params.search || '';
                        this.initToolbarConfig();
                        setTimeout(() => this.filtersService.clearAllFilters());
                    }
                    if ('addNew' == params['action'])
                        setTimeout(() => this.createClient());
                    if (params['refresh'] || searchValueChanged) {
                        this.refresh();
                    }
            });
    }

    onContentReady(event) {
        this.setGridDataLoaded();
        if (!this.rowsViewHeight)
            this.rowsViewHeight = DataGridService.getDataGridRowsViewHeight();
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    updateSelectedKeys(keys: number[]) {
        this.selectedClientKeys = keys;
        this.initToolbarConfig();
        this.finishLoading();
    }

    refresh(refreshDashboard = true) {
        if (this.dataGrid && this.dataGrid.instance)
            this.dependencyChanged = false;
        this._refresh.next(null);
        if (refreshDashboard) {
            (this.reuseService as CustomReuseStrategy).invalidate('dashboard');
        }
    }

    invalidate() {
        this.lifeCycleSubjectsService.activate$.pipe(first()).subscribe(() => {
            this.refresh(false);
        });
    }

    private listenForUpdate(layoutType: DataLayoutType) {
        return combineLatest(
            this.odataRequestValues$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            switchMap(this.waitUntil(layoutType))
        );
    }

    createClient() {
        const dialogData: CreateEntityDialogData = {
            refreshParent: () => this.invalidate(),
            customerType: ContactGroup.Client
        };
        this.dialog.open(CreateEntityDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: dialogData
        }).afterClosed().subscribe(() => this.refresh());
    }

    showClientDetails(event, section?: string, queryParams?: Params) {
        let client: ContactDto = event.data || event,
            orgId = client.OrganizationId,
            clientId = client.Id;
        if (clientId) {
            if (event.component)
                event.component.cancelEditData();
            this.searchClear = false;
            setTimeout(() => {
                this._router.navigate(
                    CrmService.getEntityDetailsLink(clientId, section, null, orgId),
                    { 
                        queryParams: {
                            contactGroupId: ContactGroup.Client, 
                            referrer: 'app/crm/clients', 
                            ...queryParams 
                        }
                    }
                );
            });
        }
    }

    initFilterConfig() {
        if (this.filters) {
            this.filtersService.setup(this.filters);
            this.filtersService.checkIfAnySelected();
        } else {
            this.filtersService.setup(
                this.filters = this.getFilters()
            );
        }

        this.filtersService.apply(() => {
            this.selectedClientKeys = [];
            this.initToolbarConfig();
        });
    }

    private getSubscriptionFilterValue() {
        return [
            ...this.subscriptionStatusFilter.items.services.value,
            ...this.subscriptionStatusFilter.items.products.value
        ];
    }

    private getSubscriptionFilterObjectValue() {
        return {
            ...this.subscriptionStatusFilter.items.services['getObjectValue'](),
            ...this.subscriptionStatusFilter.items.products['getObjectValue']()
        };
    }

    private getFilters() {
        return [].concat([
            new FilterModel({
                component: FilterInputsComponent,
                operator: 'startswith',
                caption: 'name',
                items: { Name: new FilterItemModel()}
            }),
            new FilterModel({
                component: FilterMultilineInputComponent,
                caption: 'email',
                filterMethod: this.filtersService.filterByMultiline,
                field: 'Email',
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
                filterMethod: this.filtersService.filterByMultiline,
                field: 'Xref',
                hidden: this.appSession.hideUserSourceFilters,
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
                field: 'AffiliateCode',
                items: {
                    element: new FilterMultilineInputModel({
                        ls: this.localizationService,
                        name: 'AffiliateCode'
                    })
                }
            }),
            new FilterModel({
                component: FilterInputsComponent,
                options: { type: 'number', min: 0, max: 100},
                operator: { from: 'ge', to: 'le' },
                caption: 'AffiliateRate',
                field: 'AffiliateRate',
                filterMethod: (filter) => FiltersService.filterByNumber(filter, value => {
                    return Number((value / 100).toFixed(2));
                }),
                items: { from: new FilterItemModel(), to: new FilterItemModel() }
            }),
            new FilterModel({
                component: FilterInputsComponent,
                options: { type: 'number', min: 0, max: 100},
                operator: { from: 'ge', to: 'le' },
                caption: 'AffiliateRateTier2',
                field: 'AffiliateRateTier2',
                filterMethod: (filter) => FiltersService.filterByNumber(filter, value => {
                    return Number((value / 100).toFixed(2));
                }),
                items: { from: new FilterItemModel(), to: new FilterItemModel() }
            })],
            (this.isGranted(AppPermissions.CRMOrders) || this.isGranted(AppPermissions.CRMProducts)) && this.isSubscriptionManagementEnabled &&
                this.contactService.getFeatureCount(AppFeatures.CRMMaxProductCount) ? [this.subscriptionStatusFilter] : [],
            [new FilterModel({
                component: FilterCalendarComponent,
                operator: {from: 'ge', to: 'le'},
                caption: 'creation',
                field: this.dateField,
                items: { from: new FilterItemModel(), to: new FilterItemModel() },
                options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
            }),
            this.filterModelStatus,
            new FilterModel({
                component: FilterMultilineInputComponent,
                caption: 'phone',
                filterMethod: this.filtersService.filterByMultiline,
                field: 'Phone',
                items: {
                    element: new FilterMultilineInputModel({
                        ls: this.localizationService,
                        name: 'Phone',
                        normalize: FilterHelpers.normalizePhone
                    })
                }
            }),
            this.filterCountryStates,
            new FilterModel({
                component: FilterInputsComponent,
                operator: 'startswith',
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
                operator: 'startswith',
                caption: 'zipCode',
                items: { ZipCode: new FilterItemModel() }
            }),
            this.filterModelAssignment,
            this.filterModelOrgUnit,
            this.filterModelSource,
            this.filterModelLists,
            this.filterModelTags,
            this.filterModelRating,
            this.filterModelStar,
            new FilterModel({
                caption: 'parentId',
                hidden: true
            }),
            new FilterModel({
                component: FilterRadioGroupComponent,
                caption: 'IsSubscribedToEmails',
                filterMethod: FiltersService.filterByBooleanValue,
                items: {
                    element: new FilterNullableRadioGroupModel({
                        value:  undefined,
                        list: [
                            { id: true, name: this.l('CommunicationPreferencesStatus_Subscribed') },
                            { id: false, name: this.l('CommunicationPreferencesStatus_Unsubscribed') }
                        ]
                    })
                }
            })
        ]);
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
                            this.filtersService.fixed = !this.filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => this.filtersService.fixed,
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
                            placeholder: this.l('Search') + ' ' + this.l('Customers').toLowerCase(),
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
                        name: 'assign',
                        action: this.toggleUserAssignment.bind(this),
                        disabled: !this.permission.checkCGPermission([ContactGroup.Client], 'ManageAssignments'),
                        attr: {
                            'filter-selected': this.filterModelAssignment && this.filterModelAssignment.isSelected,
                            class: 'assign-to'
                        }
                    },
                    {
                        name: 'archive',
                        disabled: !this.permission.checkCGPermission([ContactGroup.Client], ''),
                        options: {
                            text: this.l('Toolbar_ReferredBy'),
                            hint: this.l('Toolbar_ReferredBy')
                        },
                        action: this.toggleSource.bind(this),
                        attr: {
                            'filter-selected': !!this.filterModelSource.items.element['contact']
                                || !!this.filterModelOrgUnit.items.element.value.length,
                            class: 'referred-by'
                        }
                    },
                    {
                        name: 'status',
                        disabled: this.dataGrid && this.dataGrid.instance.getVisibleRows().some(row => {
                            return this.selectedClientKeys.includes(row.data.Id) && row.data.isProspecive;
                        }),
                        action: this.toggleStatus.bind(this),
                        attr: {
                            'filter-selected': this.filterModelStatus && this.filterModelStatus.isSelected
                        }
                    },
                    {
                        name: 'lists',
                        action: this.toggleLists.bind(this),
                        disabled: !this.permission.checkCGPermission([ContactGroup.Client], ''),
                        attr: {
                            'filter-selected': this.filterModelLists && this.filterModelLists.isSelected
                        }
                    },
                    {
                        name: 'tags',
                        action: this.toggleTags.bind(this),
                        disabled: !this.permission.checkCGPermission([ContactGroup.Client], ''),
                        attr: {
                            'filter-selected': this.filterModelTags && this.filterModelTags.isSelected
                        }
                    },
                    {
                        name: 'rating',
                        action: this.toggleRating.bind(this),
                        disabled: !this.permission.checkCGPermission([ContactGroup.Client], ''),
                        attr: {
                            'filter-selected': this.filterModelRating && this.filterModelRating.isSelected
                        }
                    },
                    {
                        name: 'star',
                        action: this.toggleStars.bind(this),
                        disabled: !this.permission.checkCGPermission([ContactGroup.Client], ''),
                        attr: {
                            'filter-selected': this.filterModelStar && this.filterModelStar.isSelected
                        }
                    }
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'actions',
                        widget: 'dxDropDownMenu',
                        disabled: !this.selectedClientKeys.length || !this.isGranted(AppPermissions.CRMCustomersManage),
                        options: {
                            items: [
                                {
                                    text: this.l('Delete'),
                                    disabled: this.selectedClientKeys.length != 1, // need update
                                    action: () => {
                                        this.selectedClients.subscribe((clients: ContactDto[]) => {
                                            const client =  clients[0];
                                            this.contactService.deleteContact(
                                                client.Name,
                                                [ContactGroup.Client],
                                                client.Id,
                                                () => {
                                                    this.refresh();
                                                    this.dataGrid.instance.deselectAll();
                                                }, false, client.UserId
                                            );
                                        });
                                    }
                                },
                                {
                                    text: this.l('Toolbar_Merge'),
                                    disabled: this.selectedClientKeys.length != 2 || !this.isMergeAllowed,
                                    action: () => {
                                        this.selectedClients.subscribe((clients: ContactDto[]) => {
                                            this.contactService.mergeContact(clients[0], clients[1], ContactGroup.Client, true, true, () => {
                                                this.refresh();
                                                this.dataGrid.instance.deselectAll();
                                            });
                                        });
                                    }
                               },
                               {
                                   text: this.l('AddSubscription'),
                                   visible: this.isOrdersMergeAllowed,
                                   disabled: !this.selectedClientKeys.length,
                                   action: () => {
                                       this.selectedClients.subscribe((clients: ContactDto[]) => {
                                           this.dialog.open(AddSubscriptionDialogComponent, {
                                               panelClass: ['slider'],
                                               hasBackdrop: false,
                                               closeOnNavigation: false,
                                               disableClose: true,
                                               data: clients
                                           });
                                       });
                                   }
                               }
                            ]
                        }
                    }
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'message',
                        widget: 'dxDropDownMenu',
                        disabled: !this.selectedClientKeys.length || !this.maxMessageCount ||
                            !this.permission.checkCGPermission([ContactGroup.Client], 'ViewCommunicationHistory.SendSMSAndEmail'),
                        options: {
                            items: [
                                {
                                    text: this.l('Email'),
                                    action: () => {
                                        this.selectedClients.subscribe((clients: ContactDto[]) => {
                                            this.contactService.showEmailDialog({
                                                to: clients.map(lead => lead.Email).filter(Boolean),
                                                ...(clients.length > 1 ? 
                                                    {contactIds: this.selectedClientKeys} : 
                                                    {contactId: this.selectedClientKeys[0]}
                                                )
                                            }).subscribe();
                                        });
                                    }
                                },
                                {
                                    text: this.l('SMS'),
                                    disabled: this.isSMSIntegrationDisabled,
                                    visible: abp.features.isEnabled(AppFeatures.InboundOutboundSMS),
                                    action: () => {
                                        this.selectedClients.subscribe((clients: ContactDto[]) => {
                                            const contact = clients && clients[clients.length - 1];
                                            const parsedName = contact && this.nameParserService.getParsed(contact.Name);
                                            this.contactService.showSMSDialog({
                                                phoneNumber: contact && contact.Phone,
                                                firstName: parsedName && parsedName.first,
                                                lastName: parsedName && parsedName.last
                                            });
                                        });
                                    }
                                }
                           ]
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
                                    action: this.exportToImage.bind(this, ImageFormat.PDF),
                                    text: this.l('Save as PDF'),
                                    icon: 'pdf'
                                },
                                {
                                    action: this.exportToImage.bind(this, ImageFormat.PNG),
                                    text: this.l('Save as PNG'),
                                    icon: 'png',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: this.exportToImage.bind(this, ImageFormat.JPEG),
                                    text: this.l('Save as JPEG'),
                                    icon: 'jpg',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: this.exportToImage.bind(this, ImageFormat.SVG),
                                    text: this.l('Save as SVG'),
                                    icon: 'svg',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: this.exportToImage.bind(this, ImageFormat.GIF),
                                    text: this.l('Save as GIF'),
                                    icon: 'gif',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: (options) => {
                                        if (this.dataLayoutType.value === DataLayoutType.PivotGrid) {
                                            this.pivotGridComponent.dataGrid.instance.option(
                                                'export.fileName',
                                                this.exportService.getFileName(null, 'PivotGrid')
                                            );
                                            this.pivotGridComponent.dataGrid.instance.exportToExcel();
                                        } else if (this.dataLayoutType.value === DataLayoutType.DataGrid) {
                                            this.exportToXLS(options);
                                        }
                                    },
                                    text: this.l('Export to Excel'),
                                    icon: 'xls',
                                    visible: this.showDataGrid || this.showPivotGrid
                                },
                                {
                                    action: this.exportToCSV.bind(this),
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet',
                                    visible: this.showDataGrid
                                },
                                {
                                    action: this.exportToGoogleSheet.bind(this),
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet',
                                    visible: this.showDataGrid
                                },
                                {
                                    type: 'downloadOptions',
                                    visible: this.showDataGrid
                                }
                            ]
                        }
                    },
                    { name: 'print', action: Function(), visible: false }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                areItemsDependent: true,
                items: [
                    {
                        name: 'dataGrid',
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleDataLayout.bind(this, DataLayoutType.DataGrid),
                        options: {
                            checkPressed: () => this.showDataGrid
                        }
                    },
                    {
                        name: 'pivotGrid',
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleDataLayout.bind(this, DataLayoutType.PivotGrid),
                        options: {
                            checkPressed: () => this.showPivotGrid
                        }
                    },
                    {
                        name: 'chart',
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Chart),
                        options: {
                            checkPressed: () => this.showChart
                        }
                    },
                    {
                        name: 'map',
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Map),
                        options: {
                            checkPressed: () => this.showMap
                        }
                    }
                ]
            }
        ];
        this.changeDetectorRef.detectChanges();
    }

    toggleSource() {
        this.sourceComponent.toggle();
    }

    toggleColumnChooser() {
        if (this.showDataGrid) {
            DataGridService.showColumnChooser(this.dataGrid);
        } else if (this.showPivotGrid) {
            this.pivotGridComponent.toggleFieldPanel();
        }
    }

    repaintDataGrid(delay = 0) {
        if (this.dataGrid) {
            setTimeout(() => this.dataGrid.instance.repaint(), delay);
        }
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid, true);
    }

    toggleUserAssignment() {
        this.userAssignmentComponent.toggle();
    }

    toggleStatus() {
        this.statusComponent.toggle();
    }

    toggleLists() {
        this.listsComponent.toggle();
    }

    toggleTags() {
        this.tagsComponent.toggle();
    }

    toggleRating() {
        this.ratingComponent.toggle();
    }

    toggleStars() {
        this.starsListComponent.toggle();
    }

    private exportToImage(format: ImageFormat) {
        if (this.showChart) {
            this.chartComponent.exportTo(format);
        } else if (this.showMap) {
            this.mapComponent.exportTo(format);
        }
    }

    toggleDataLayout(dataLayoutType: DataLayoutType) {
        this.dataLayoutType.next(dataLayoutType);
        this.selectedClientKeys = [];
        this.initDataSource();
        this.initToolbarConfig();
        if (this.showDataGrid) {
            this.repaintDataGrid();
        }
    }

    initDataSource() {
        if (this.showDataGrid) {
            this.setDataGridInstance();
        } else if (this.showPivotGrid) {
            this.setPivotGridInstance();
        } else if (this.showChart) {
            this.setChartInstance();
        }
    }

    setDataGridInstance() {
        let instance = this.dataGrid && this.dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.dataSource);
            this.startLoading();
        }
    }

    private setPivotGridInstance() {
        const pivotGridInstance = this.pivotGridComponent && this.pivotGridComponent.dataGrid && this.pivotGridComponent.dataGrid.instance;
        CrmService.setDataSourceToComponent(this.pivotGridDataSource, pivotGridInstance);
    }

    private setChartInstance() {
        const chartInstance = this.chartComponent && this.chartComponent.chart && this.chartComponent.chart.instance;
        CrmService.setDataSourceToComponent(this.chartDataSource, chartInstance);
    }

    get showDataGrid(): boolean {
        return this.dataLayoutType.value === DataLayoutType.DataGrid;
    }

    get showPivotGrid(): boolean {
        return this.dataLayoutType.value === DataLayoutType.PivotGrid;
    }

    get showChart(): boolean {
        return this.dataLayoutType.value === DataLayoutType.Chart;
    }

    get showMap(): boolean {
        return this.dataLayoutType.value === DataLayoutType.Map;
    }

    searchValueChange(e: object) {
        if (this.searchValue != e['value']) {
            this.searchValue = e['value'];
            this._refresh.next(null);
            this._router.navigate([], {queryParams: {search: this.searchValue}});
            this.changeDetectorRef.detectChanges();
        }
    }

    processFilterInternal() {
        if (this.showDataGrid && this.dataGrid && this.dataGrid.instance || this.showPivotGrid && 
            this.pivotGridComponent && this.pivotGridComponent.dataGrid && this.pivotGridComponent.dataGrid.instance
        ) {
            this.dataSource['total'] = this.dataSource['entities'] = undefined;
            this.processODataFilter(
                (this.showPivotGrid ? this.pivotGridComponent : this).dataGrid.instance,
                this.dataSourceURI,
                this.filters,
                this.filtersService.getCheckCustom,
                null,
                this.getSubscriptionFilterValue()
            );
        }
    }

    updateClientStatuses(status: Status) {
        if (this.permission.checkCGPermission([ContactGroup.Client])) {
            this.statusComponent.toggle();
            let selectedIds: number[] = this.selectedClientKeys;
            this.clientService.updateContactStatuses(
                selectedIds,
                ContactGroup.Client,
                status.id == ContactStatus.Active,
                () => {
                    this.refresh();
                    this.dataGrid.instance.clearSelection();
                }
            );
        }
    }

    onCellClick($event) {
        let col = $event.column;
        if (col && (col.command || col.name == 'LinkToCFO'))
            return;
        this.showClientDetails($event);
    }

    ngOnDestroy() {
        this.lifeCycleSubjectsService.destroy.next();
        this.deactivate();
    }

    private requestVerificationInternal(contactId: number) {
        this.appService.requestVerification(contactId).subscribe(
            () => this.dataGrid.instance.refresh()
        );
    }

    requestVerification(contact: ContactDto) {
        if (contact.Email)
            this.requestVerificationInternal(contact.Id);
        else {
            let dialogData = {
                groupId: ContactGroup.Client,
                field: 'emailAddress',
                emailAddress: '',
                name: 'Email',
                contactId: contact.Id,
                usageTypeId: '',
                isConfirmed: true,
                isActive: true,
                isCompany: false,
                comment: '',
                deleteItem: () => {}
            };

            this.dialog.open(EditContactDialog, {
                data: dialogData,
                hasBackdrop: true
            }).afterClosed().subscribe(result => {
                if (result) {
                    this.startLoading();
                    this.contactEmailService.createContactEmail(new CreateContactEmailInput({
                        contactId: contact.Id,
                        emailAddress: dialogData.emailAddress,
                        isActive: dialogData.isActive,
                        isConfirmed: dialogData.isConfirmed,
                        comment: dialogData.comment,
                        usageTypeId: dialogData.usageTypeId

                    })).pipe(finalize(() => this.finishLoading())).subscribe(() => {
                        this.dataGrid.instance.refresh();
                        this.requestVerificationInternal(contact.Id);
                    });
                }
            });
        }
    }

    repaintToolbar() {
        if (this.toolbar) {
            this.toolbar.toolbarComponent.instance.repaint();
        }
    }

    activate() {
        super.activate();
        this.lifeCycleSubjectsService.activate.next();
        this.paramsSubscribe();
        this.initFilterConfig();
        this.initToolbarConfig();
        if (this.dependencyChanged)
            this.refresh();

        this.showHostElement(() => {
            this.repaintToolbar();
        });
    }

    deactivate() {
        super.deactivate();
        this.subRouteParams.unsubscribe();
        this.filtersService.unsubscribe();
        if (this.dataGrid) {
            this.itemDetailsService.setItemsSource(
                ItemTypeEnum.Customer,
                this.dataSource
            );
        }
        this.hideHostElement();
    }

    toggleActionsMenu(event) {
        ActionMenuService.toggleActionMenu(event, this.actionEvent).subscribe(actionEvent => {
            const client: ContactDto = event.data;
            ActionMenuService.prepareActionMenuGroups(this.actionMenuGroups, client);
            this.actionEvent = actionEvent;
            this.changeDetectorRef.detectChanges();
        });
    }

    mapItemClick(params: Params) {
        this.toggleDataLayout(DataLayoutType.DataGrid);
        this.crmService.updateCountryStateFilter(params, this.filterCountryStates);
        this.filtersService.change([this.filterCountryStates]);
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionEvent = null;
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    onOwnerFilterApply(event) {
        let filter = this.filterModelOrgUnit.items.element.value;
        this.filterModelOrgUnit.items.element.value = filter &&
            (!event || filter[0] == event.id) ? [] : [event.id];
        this.filtersService.change([this.filterModelOrgUnit]);
    }

    onDragEnd = e => {
        if (e && e.fromIndex != e.toIndex) {
            forkJoin(
                from (e.component.byKey(e.component.getKeyByRowIndex(e.fromIndex))),
                from (e.component.byKey(e.component.getKeyByRowIndex(e.toIndex)))
            ).subscribe(([source, target]: [ContactDto, ContactDto]) => {
                this.contactService.mergeContact(source, target, ContactGroup.Client, true, true, () => this.refresh());
            });
        }
    }

    selectionModeChanged($event) {
        this.dataGrid.instance.clearSelection();
        this.dataGrid.instance.option(
            'selection.deferred', $event.itemData.mode != 'page');
        this.dataGrid.instance.option(
            'selection.selectAllMode', $event.itemData.mode);
    }

    onOptionChanged(event) {
        if (event.name == 'selectedRowKeys') {
            this.updateSelectedKeys(event.value);
        } if (event.name == 'selectionFilter') {
            if (!event.value || !event.value.length) {
                let seletion = event.component.getSelectedRowKeys();
                if (seletion instanceof Array)
                    this.updateSelectedKeys(seletion);
                else {
                    this.startLoading();
                    seletion.then(this.updateSelectedKeys.bind(this));
                }
            } else {
                let keys = this.selectedClientKeys;
                event.component.getVisibleRows().forEach(item => {
                    let isItemIncluded = ~keys.indexOf(item.data.Id);
                    if (item.isSelected) {
                        if (!isItemIncluded)
                            keys.push(item.data.Id);
                    } else {
                        if (isItemIncluded)
                            keys = keys.filter(key => key != item.data.Id);
                    }
                });
                this.updateSelectedKeys(keys);
            }
        }
        this.onGridOptionChanged(event);
    }

    filterByStatusApply(data) {
        let filterElement: FilterContactStatusModel = 
            <FilterContactStatusModel>this.filterModelStatus.items.element;
        if (!data || filterElement.value == data.id)
            filterElement.value = [];
        else {
            filterElement.value = [data.id];
            filterElement.includeProspective = 
                filterElement.FILTER_EXCLUDE_PROSPECTIVE;
        }
    }
}