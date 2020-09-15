/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostBinding, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Params, Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { combineLatest, Observable, ReplaySubject, of } from 'rxjs';
import { finalize, first, map, startWith, switchMap, take, tap } from 'rxjs/operators';

/** Application imports */
import { ODataService } from '@shared/common/odata/odata.service';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { GlobalSearchGroup } from '@app/shared/layout/top-bar/global-search/global-search-group.interface';
import { LeadFields } from '@app/crm/leads/lead-fields.enum';
import { OrderFields } from '@app/crm/orders/order-fields.enum';
import { ClientFields } from '@app/crm/clients/client-fields.enum';
import { PartnerFields } from '@app/crm/partners/partner-fields.enum';
import { ContactGroup } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { GlobalSearchGroupEntity } from '@app/shared/layout/top-bar/global-search/global-search-group-item.interface';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { CrmService } from '@app/crm/crm.service';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { AppPermissions } from '@shared/AppPermissions';
import { AppPermissionService } from '@shared/common/auth/permission.service';

@Component({
    selector: 'global-search',
    templateUrl: 'global-search.component.html',
    styleUrls: [ 'global-search.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalSearchComponent implements OnInit {
    @HostBinding('class.searchWide') searchWide = false;
    _search: ReplaySubject<string> = new ReplaySubject<string>(1);
    search$: Observable<string> = this._search.asObservable();
    searchGroups$: Observable<GlobalSearchGroup[]> = this.search$.pipe(
        tap(() => {
            this.isTooltipVisible = false;
            this.searchGroups = [];
            this.loadingService.startLoading(this.elementRef.nativeElement);
        }),
        switchMap((search: string) => {
            return combineLatest(
                this.getClientsGroup(search),
                this.getPartnersGroup(search),
                this.getLeadGroup(search, this.ls.l('ClientLeads'), 'Client'),
                this.getLeadGroup(search, this.ls.l('PartnerLeads'), 'Partner'),
                this.getLeadGroup(search, this.ls.l('Employees'), 'UserProfile'),
                this.getLeadGroup(search, this.ls.l('Investors'), 'Investor'),
                this.getLeadGroup(search, this.ls.l('Vendors'), 'Vendor'),
                this.getLeadGroup(search, this.ls.l('Others'), 'Other'),
                this.getOrdersGroup(search)
            ).pipe(
                finalize(() => {
                    this.hideSpinner();
                    this.isTooltipVisible = true;
                    this.changeDetectorRef.detectChanges();
                })
            );
        })
    );
    searchGroups: GlobalSearchGroup[];
    isTooltipVisible = false;

    constructor(
        private http: HttpClient,
        private oDataService: ODataService,
        private dialogService: DialogService,
        private dialog: MatDialog,
        private router: Router,
        private profileService: ProfileService,
        private changeDetectorRef: ChangeDetectorRef,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        private itemDetailsService: ItemDetailsService,
        private permissionService: AppPermissionService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.searchGroups$.subscribe((searchGroups: GlobalSearchGroup[]) => {
            this.searchGroups = searchGroups;
            this.changeDetectorRef.detectChanges();
        });
    }

    get itemsFound() {
        return !!(this.searchGroups && this.searchGroups.some((searchGroup: GlobalSearchGroup) => {
            return searchGroup.entities && searchGroup.entities.length;
        }))
    }

    private getClientsGroup(search: string): Observable<GlobalSearchGroup> {
        return (this.permissionService.isGranted(AppPermissions.CRMCustomers)
            ? this.http.get(
                this.oDataService.getODataUrl('Contact', [
                    { 'StatusId': { 'eq': 'A' }},
                    { 'ParentId': { 'eq': null }},
                    { 'GroupId': { 'eq': 'C' } }
                ]),
                this.getOptions(search, {
                    select$: [
                        ClientFields.Id,
                        ClientFields.Name,
                        ClientFields.Email,
                        ClientFields.PhotoPublicId
                    ].join(',')
                })
            )
            : of(null)
        ).pipe(
            startWith({ value: [], ['@odata.count']: 0 }),
            map((clients: any) => {
                return {
                    name: this.ls.l('Customers'),
                    entities: clients ? clients.value : [],
                    count: clients ? clients['@odata.count'] : 0,
                    link: 'app/crm/clients',
                    itemType: ItemTypeEnum.Customer
                }
            }),
            take(2)
        );
    }
    
    private getPartnersGroup(search: string): Observable<any> {
        return (this.permissionService.isGranted(AppPermissions.CRMPartners)
            ? this.http.get(
                this.oDataService.getODataUrl('Contact', [
                    { 'StatusId': { 'eq': 'A' }},
                    { 'ParentId': { 'eq': null }},
                    { 'GroupId': { 'eq': 'P' } }
                ]),
                this.getOptions(search, {
                    select$: [
                        PartnerFields.Id,
                        PartnerFields.Name,
                        PartnerFields.Email,
                        PartnerFields.PhotoPublicId
                    ].join(',')
                })
            )
            : of(null)
        ).pipe(
            startWith({ value: [], ['@odata.count']: 0 }),
            map((partners: any) => {
                return {
                    name: this.ls.l('Partners'),
                    entities: partners ? partners.value : [],
                    count: partners ? partners['@odata.count'] : 0,
                    link: 'app/crm/partners',
                    itemType: ItemTypeEnum.Partner
                };
            }),
            take(2)
        );
    }
    
    private getLeadGroup(search: string, name: string, contactGroup: string) {
        return (this.permissionService.checkCGPermission(ContactGroup[contactGroup])
            ? this.http.get(
                this.oDataService.getODataUrl('Lead'),
                this.getOptions(search, {
                    $select: [
                        LeadFields.Id,
                        LeadFields.Name,
                        LeadFields.Email,
                        LeadFields.PhotoPublicId,
                        LeadFields.SourceChannelCode,
                        LeadFields.CustomerId
                    ].join(','),
                    contactGroupId: ContactGroup[contactGroup]
                })
            )
            : of(null)
        ).pipe(
            startWith({ value: [], ['@odata.count']: 0 }),
            map((leads: any) => {
                return {
                    name: name,
                    entities: leads ? leads.value : [],
                    count: leads ? leads['@odata.count'] : 0,
                    link: 'app/crm/leads',
                    itemType: ItemTypeEnum.Lead,
                    linkParams: {
                        contactGroup: contactGroup
                    }
                };
            }),
            take(2)
        );
    }
    
    private getOrdersGroup(search: string) {
        return this.http.get(
            this.oDataService.getODataUrl('Order'),
            this.getOptions(search, {
                $select: [
                    OrderFields.Id,
                    OrderFields.Name,
                    OrderFields.Email,
                    OrderFields.PhotoPublicId,
                    OrderFields.LeadId,
                    OrderFields.ContactId
                ].join(',')
            })
        ).pipe(
            map((orders: any) => {
                return {
                    name: this.ls.l('Orders'),
                    entities: orders.value,
                    count: orders['@odata.count'],
                    link: 'app/crm/orders',
                    itemType: ItemTypeEnum.Order
                };
            })
        );
    }

    private hideSpinner() {
        this.loadingService.finishLoading(this.elementRef.nativeElement);
    }

    getOptions(search: string, params?: Params): any {
        return {
            params: {
                quickSearchString: search,
                $top: '2',
                $count: true,
                ...params
            },
            headers: new HttpHeaders({
                'Authorization': 'Bearer ' + abp.auth.getToken()
            })
        };
    }
    
    onFocusIn() {
        if (this.itemsFound) {
            this.isTooltipVisible = true;
        }
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
        if (value) {
            this._search.next(value);
        }
    }

    showAll(e, groupLink: string, groupLinkParams?: Params) {
        this.search$.pipe(first()).subscribe((search: string) => {
            this.router.navigate([groupLink], {
                queryParams: {
                    searchValue: search,
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

    moveToEntityDetails(e, entity: GlobalSearchGroupEntity, groupItemType: ItemTypeEnum) {
        let isOrder: boolean = !!entity.ContactId;
        const isLead: boolean = !!entity.CustomerId;
        this.itemDetailsService.setItemsSource(
            groupItemType,
            null
        );
        this.router.navigate(
            CrmService.getEntityDetailsLink(
                entity.CustomerId || entity.ContactId || entity.Id,
                isOrder ? 'invoices' : 'contact-information',
                isLead ? entity.Id : entity.LeadId
            )
        ).then(() => {
            this.isTooltipVisible = false;
        });
        e.stopPropagation();
        e.preventDefault();
    }
}