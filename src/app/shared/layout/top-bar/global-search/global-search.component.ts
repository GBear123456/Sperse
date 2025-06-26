/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    ViewChild,
    OnInit,
    OnDestroy
} from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpParameterCodec } from '@angular/common/http';
import { Params, Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { combineLatest, Observable, ReplaySubject, Subject, of } from 'rxjs';
import { finalize, first, map, startWith, switchMap, 
    take, tap, catchError, takeUntil, debounceTime } from 'rxjs/operators';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';

/** Application imports */
import { AppService } from '@app/app.service';
import { ODataService } from '@shared/common/odata/odata.service';
import { GlobalSearchGroup } from '@app/shared/layout/top-bar/global-search/global-search-group.interface';
import { LeadFields } from '@app/crm/leads/lead-fields.enum';
import { OrderFields } from '@app/crm/orders/order-fields.enum';
import { InvoiceFields } from '@app/crm/invoices/invoices-fields.enum';
import { ClientFields } from '@app/crm/clients/client-fields.enum';
import { PartnerFields } from '@app/crm/partners/partner-fields.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { GlobalSearchGroupEntity } from '@app/shared/layout/top-bar/global-search/global-search-group-item.interface';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { CrmService } from '@app/crm/crm.service';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { ToolbarService } from '@app/shared/common/toolbar/toolbar.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { SubscriptionFields } from '@app/crm/orders/subscription-fields.enum';
import { OrderType } from '@app/crm/orders/order-type.enum';
import { ContactGroup } from '@shared/AppEnums';
import { LayoutService } from '@app/shared/layout/layout.service';

class CustomHttpParameterCodec implements HttpParameterCodec {
    encodeKey(key: string): string {
        return key;
    }

    encodeValue(value: string): string {
        return encodeURIComponent(value);
    }

    decodeKey(key: string): string {
        return key;
    }

    decodeValue(value: string): string {
        return decodeURIComponent(value);
    }
}

@Component({
    selector: 'global-search',
    templateUrl: 'global-search.component.html',
    styleUrls: [ 'global-search.component.less' ],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
    @ViewChild(DxTextBoxComponent) textBox: DxTextBoxComponent;
    @ViewChild(DxSelectBoxComponent, {static: false}) selectBox: DxSelectBoxComponent;

    @HostBinding('class.showSearchMode') showSearchMode =
        this.toolbarService.isSearchBoxEnabled &&    
        this.layoutService.showLeftBar &&
        this.isCRMModule;
    @HostBinding('class.searchWide') searchWide = false;

    get isCRMModule(): boolean {
        return this.appService.getModule() == 'crm';
    }

    _search: ReplaySubject<string> = new ReplaySubject<string>(1);
    search$: Observable<string> = this._search.asObservable();

    isLoading = false;
    _stopSearch: Subject<any> = new Subject<any>();
    searchGroups$: Observable<GlobalSearchGroup[]> = this.search$.pipe(
        tap(() => {
            this.isLoading = true;
            this.isTooltipVisible = false;
            this.searchGroups = [];
            this.loadingService.startLoading(this.getLoadingElement());
            this.changeDetectorRef.detectChanges();
        }),
        switchMap((search: string) => {
            return combineLatest(
                this.getClientsGroup(search),
                this.getPartnersGroup(search),
                this.getLeadGroup(search, this.ls.l('ClientLeads'), 'Client'),
                this.getLeadGroup(search, this.ls.l('PartnerLeads'), 'Partner'),
                this.getLeadGroup(search, this.ls.l('Employees'), 'Employee'),
                this.getLeadGroup(search, this.ls.l('Investors'), 'Investor'),
                this.getLeadGroup(search, this.ls.l('Vendors'), 'Vendor'),
                this.getLeadGroup(search, this.ls.l('Others'), 'Other'),
                this.getOrdersGroup(search),
                this.getSubscriptionsGroup(search),
                this.getInvoicesGroup(search)
            ).pipe(
                finalize(() => {
                    this.hideSpinner();
                    this.isLoading = false;
                    this.isTooltipVisible = true;
                    this.changeDetectorRef.detectChanges();
                })
            );
        })
    );
    searchGroups: GlobalSearchGroup[];
    isTooltipVisible = false;
    searchConfig: any;

    globalSearchPlaceholder = this.ls.l('Global Search');
    localSearchPlaceholder = this.ls.l('Global Search');
    selectedSearchMode = this.localSearchPlaceholder;

    constructor(
        private http: HttpClient,
        private oDataService: ODataService,
        private dialog: MatDialog,
        private router: Router,
        private appService: AppService,
        private profileService: ProfileService,
        private changeDetectorRef: ChangeDetectorRef,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        private itemDetailsService: ItemDetailsService,
        private permissionService: AppPermissionService,
        private lifecycleService: LifecycleSubjectsService,
        private layoutService: LayoutService,
        public toolbarService: ToolbarService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.toolbarService.isSearchBoxEnabled$.pipe(
            takeUntil(this.lifecycleService.destroy$),
            debounceTime(600)
        ).subscribe(
            isSearchBoxEnabled => {
                this.clearSearch();
                this.showSearchMode = isSearchBoxEnabled
                    && this.layoutService.showLeftBar 
                    && this.isCRMModule;
                this.changeDetectorRef.detectChanges();
            }
        );

        this.toolbarService.latestSearchConfig$.pipe(
            takeUntil(this.lifecycleService.destroy$)
        ).subscribe(
            config => {
                this.searchConfig = config;
                if (config) {
                    if (config.options.value) {
                        this.selectedSearchMode = this.localSearchPlaceholder;
                        setTimeout(() =>    
                            this.textBox.instance.option(
                                'value', config.options.value
                            ), 1000
                        );
                    }
                }
            }
        );

        this.searchGroups$.pipe(
            takeUntil(this.lifecycleService.destroy$)
        ).subscribe((searchGroups: GlobalSearchGroup[]) => {
            this.searchGroups = searchGroups;
            if (this.itemsFound) {
                this.isTooltipVisible = true;
            }
            this.changeDetectorRef.detectChanges();
        });

        this._stopSearch.asObservable().pipe(
            takeUntil(this.lifecycleService.destroy$)
        ).subscribe(() => {
            this.isLoading = false;
            this.changeDetectorRef.detectChanges();
        });
    }

    get itemsFound() {
        return !!(this.searchGroups && this.searchGroups.some((searchGroup: GlobalSearchGroup) => {
            return searchGroup.entities && searchGroup.entities.length;
        }));
    }

    private getClientsGroup(search: string): Observable<GlobalSearchGroup> {
        return this.getGlobalSearchGroup(
            this.oDataService.getODataUrl('Contact', [
                { 'ParentId': { 'eq': null }}
            ]),
            this.ls.l('Customers'),
            'app/crm/clients',
            search,
            AppPermissions.CRMCustomers,
            [
                ClientFields.Id,
                ClientFields.Name,
                ClientFields.Email,
                ClientFields.PhotoPublicId
            ],
            { 
                contactGroupId: ContactGroup.Client, 
                isProspective: 'false',
                isActive: 'true' 
            }
        );
    }

    private getPartnersGroup(search: string): Observable<GlobalSearchGroup> {
        return this.getGlobalSearchGroup(
            this.oDataService.getODataUrl('Contact', [
                { 'ParentId': { 'eq': null }}
            ]),
            this.ls.l('Partners'),
            'app/crm/partners',
            search,
            AppPermissions.CRMPartners,
            [
                PartnerFields.Id,
                PartnerFields.Name,
                PartnerFields.Email,
                PartnerFields.PhotoPublicId
            ],
            { 
                contactGroupId: ContactGroup.Partner, 
                isProspective: 'false',
                isActive: 'true' 
            }
        );
    }

    private getLeadGroup(search: string, name: string, contactGroup: string): Observable<GlobalSearchGroup> {
        return this.permissionService.checkCGPermission([ContactGroup[contactGroup]], '') ?
            this.getGlobalSearchGroup(
                this.oDataService.getODataUrl('Lead'),
                name,
                'app/crm/leads',
                search,
                AppPermissions.CRM,
                [
                    LeadFields.Id,
                    LeadFields.Name,
                    LeadFields.Email,
                    LeadFields.PhotoPublicId,
                    LeadFields.SourceChannelCode,
                    LeadFields.CustomerId
                ],
                { contactGroupId: ContactGroup[contactGroup] },
                { contactGroup: contactGroup }
            ): of({
                name: name,
                entities: [],
                link: '',
                linkParams: null
            } as GlobalSearchGroup);
    }

    private getOrdersGroup(search: string): Observable<GlobalSearchGroup> {
        return this.getGlobalSearchGroup(
            this.oDataService.getODataUrl('Order'),
            this.ls.l('Orders'),
            'app/crm/orders',
            search,
            AppPermissions.CRMOrders,
            [
                OrderFields.Id,
                OrderFields.Name,
                OrderFields.Email,
                OrderFields.PhotoPublicId,
                OrderFields.LeadId,
                OrderFields.ContactId
            ],            
            null,
            { 
                orderType: OrderType.Order
            }
        );
    }

    private getInvoicesGroup(search: string): Observable<GlobalSearchGroup> {
        return this.getGlobalSearchGroup(
            this.oDataService.getODataUrl('Invoice'),
            this.ls.l('Invoices'),
            'app/crm/invoices',
            search,
            AppPermissions.CRMOrdersInvoices,
            [
                InvoiceFields.Id,
                InvoiceFields.FullName,
                InvoiceFields.EmailAddress,
                InvoiceFields.PhotoPublicId,
                InvoiceFields.ContactId
            ]
        );
    }

    private getSubscriptionsGroup(search): Observable<GlobalSearchGroup> {
        return this.getGlobalSearchGroup(
            this.oDataService.getODataUrl('Subscription'),
            this.ls.l('Subscriptions'),
            'app/crm/orders',
            search,
            AppPermissions.CRMOrders,
            [
                SubscriptionFields.Id,
                SubscriptionFields.FullName,
                SubscriptionFields.EmailAddress,
                SubscriptionFields.PhotoPublicId,
                SubscriptionFields.LeadId,
                SubscriptionFields.ContactId
            ], null, {
                orderType: OrderType.Subscription
            }
        );
    }

    private getGlobalSearchGroup(
        odataUrl: string,
        name: string,
        link: string,
        search: string,
        permission: AppPermissions,
        selectFields: string[],
        params?: Params,
        linkParams?: Params
    ): Observable<GlobalSearchGroup> {
        return (this.permissionService.isGranted(permission) ?
            this.http.get(
                odataUrl,
                this.getOptions(search, {
                    $select: selectFields.join(','),
                    ...params
                })
            ) : of(null)
        ).pipe(
            takeUntil(this._stopSearch),
            catchError(() => of({ value: [] })),
            startWith({ value: [] }),
            map((entities: any) => {
                return {
                    name: name,
                    entities: entities ? entities.value : [],
                    link: link,
                    linkParams: linkParams
                };
            }),
            take(2)
        );
    }

    private hideSpinner() {
        this.loadingService.finishLoading(this.getLoadingElement());
    }

    getLoadingElement() {
        return this.elementRef.nativeElement.getElementsByClassName('global-search-container')[0];
    }

    getOptions(search: string, params?: Params): any {
        let httpParams = new HttpParams({
            encoder: new CustomHttpParameterCodec()
        }).set('$top', '3').set('quickSearchString', search);

        Object.keys(params).forEach(key => {
            httpParams = httpParams.set(key, params[key]);
        });

        return {
            params: httpParams,
            headers: new HttpHeaders({
                'Authorization': 'Bearer ' + abp.auth.getToken()
            })
        };
    }

    onFocusIn(event) {
        if (event.element.getBoundingClientRect().width < 345)
            this.layoutService.showPlatformSelectMenu = false;
        if (this.itemsFound) {
            setTimeout(() => {
                this.isTooltipVisible = true;
                this.changeDetectorRef.detectChanges();
            }, 100);
        }
    }

    onFocusOut() {
        this.layoutService.showPlatformSelectMenu = true;
    }

    valueChanged(e) {
        if (!e.value) {
            this.searchGroups = [];
            this.isTooltipVisible = false;
            this.hideSpinner();
        }
    }

    search(e) {
        const value = e.component.option('value');        
        if (!this.isCRMModule || (this.showSearchMode && this.selectedSearchMode != this.globalSearchPlaceholder)) {
            if (this.searchConfig && this.searchConfig.options.onValueChanged)
                this.searchConfig.options.onValueChanged({value});
        } else if (value)
            this._search.next(value);
    }

    showAll(e, groupLink: string, groupLinkParams?: Params) {
        this.search$.pipe(first()).subscribe((search: string) => {
            this.router.navigate([groupLink], {
                queryParams: {
                    search: search,
                    ...groupLinkParams
                }
            });
        });
        this.isTooltipVisible = false;
        e.stopPropagation();
        e.preventDefault();
    }

    getContactPhotoUrl(pictureId: string): string {
        return this.profileService.getContactPhotoUrl(pictureId);
    }

    tooltipReady(e) {
        e.component._$popupContent[0].classList.add('global-search-popup-content');
    }

    moveToEntityDetails(e, entity: GlobalSearchGroupEntity, itemsLink: string) {
        let isOrder: boolean = !!entity.ContactId;
        const isLead: boolean = !!entity.CustomerId;
        this.itemDetailsService.clearItemsSource();
        this.router.navigate(
            CrmService.getEntityDetailsLink(
                entity.CustomerId || entity.ContactId || entity.Id,
                isOrder ? 'invoices' : 'contact-information',
                isLead ? entity.Id : entity.LeadId
            ),
            { queryParams: { referrer: itemsLink }}
        ).then(() => {
            this.isTooltipVisible = false;
        });
        e.stopPropagation();
        e.preventDefault();
    }

    clearSearch(event?) {
        if (event && (event.name != 'value' || event.value))
            return ;
        
        this.hideSpinner();
        if (event) {
            if (!this.isCRMModule || (this.showSearchMode && this.selectedSearchMode != this.globalSearchPlaceholder)) {
                if (this.searchConfig && this.searchConfig.options.onValueChanged)
                    this.searchConfig.options.onValueChanged({value: ''});
            } else {
                this._stopSearch.next(null);
            }
        }

        this.searchGroups = [];
        this.textBox.instance.option('value', '');
    }

    openModeSelector() {
        this.selectBox.instance.open()
    }

    ngOnDestroy() {
        this.hideSpinner();
        this.lifecycleService.destroy.next(null);
    }
}