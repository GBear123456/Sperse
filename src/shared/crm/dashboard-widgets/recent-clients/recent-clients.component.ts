/** Core imports */
import { ChangeDetectionStrategy, Component, EventEmitter, 
    ElementRef, OnInit, OnDestroy, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, finalize, first, switchMap, tap, distinctUntilChanged, 
    takeUntil, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import {
    DashboardServiceProxy,
    GetRecentlyCreatedCustomersOutput,
    GetRecentlyCreatedLeadsOutput,
    GetRecentlySalesOutput
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';
import { IRecentClientsSelectItem } from '@shared/crm/dashboard-widgets/recent-clients/recent-clients-select-item.interface';
import { DateHelper } from '@shared/helpers/DateHelper';
import { ContactGroup } from '@shared/AppEnums';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppPermissionService } from '@root/shared/common/auth/permission.service';

@Component({
    selector: 'recent-clients',
    templateUrl: './recent-clients.component.html',
    styleUrls: ['./recent-clients.component.less'],
    providers: [ DashboardServiceProxy, LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentClientsComponent implements OnInit, OnDestroy {
    @Input() waitFor$: Observable<any> = of().pipe(
        publishReplay(), refCount()
    );
    @Input() viewAllText: string = this.ls.l('CRMDashboard_SeeAllRecords');
    @Output() loadComplete: EventEmitter<any> = new EventEmitter();

    recordsCount = 10;
    formatting = AppConsts.formatting;
    recentlyCreatedCustomers$: Observable<GetRecentlyCreatedCustomersOutput[] | GetRecentlySalesOutput[]>;
    selectItems: IRecentClientsSelectItem[] = [
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('Sales')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords', this.recordsCount, this.ls.l('Sales').toLowerCase()),
            dataLink: 'app/crm/contact/{contactId}/invoices',
            allRecordsLink: '/app/crm/invoices',
            visible: this.permissionService.isGranted(AppPermissions.CRMOrdersInvoices),
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlySalesOutput[]> =>
                this.dashboardServiceProxy.getRecentlySales(this.recordsCount, undefined, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_Client')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords', this.recordsCount, this.ls.l('ContactGroup_Client').toLowerCase()),
            dataLink: 'app/crm/contact/{contactId}/lead/{leadId}',
            allRecordsLink: '/app/crm/leads',
            visible: this.permissionService.isGranted(AppPermissions.CRMCustomers),
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedCustomersOutput[]> =>                
                this.dashboardServiceProxy.getRecentlyCreatedLeads(this.recordsCount, ContactGroup.Client, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentClients'),
            message: this.ls.l('CRMDashboard_LastNClientsRecords', [this.recordsCount]),
            dataLink: 'app/crm/contact/{contactId}',
            allRecordsLink: '/app/crm/clients',
            visible: this.permissionService.isGranted(AppPermissions.CRMCustomers),
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedCustomersOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedCustomers(this.recordsCount, ContactGroup.Client, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_Partner')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords', this.recordsCount, this.ls.l('ContactGroup_Partner').toLowerCase()),
            dataLink: 'app/crm/contact/{contactId}/lead/{leadId}',
            allRecordsLink: '/app/crm/leads',
            linkParams: { contactGroup: 'Partner' },
            visible: this.permissionService.isGranted(AppPermissions.CRMPartners),
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedLeadsOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedLeads(this.recordsCount, ContactGroup.Partner, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_Employee')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords', this.recordsCount, this.ls.l('ContactGroup_Employee').toLowerCase()),
            dataLink: 'app/crm/contact/{contactId}/lead/{leadId}',
            allRecordsLink: '/app/crm/leads',
            linkParams: { contactGroup: 'Employee' },
            visible: this.permissionService.isGranted(AppPermissions.CRMEmployees),
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedLeadsOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedLeads(this.recordsCount, ContactGroup.Employee, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_Investor')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords',  this.recordsCount, this.ls.l('ContactGroup_Investor').toLowerCase()),
            dataLink: 'app/crm/contact/{contactId}/lead/{leadId}',
            allRecordsLink: '/app/crm/leads',
            linkParams: { contactGroup: 'Investor' },
            visible: this.permissionService.isGranted(AppPermissions.CRMInvestors),
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedLeadsOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedLeads(this.recordsCount, ContactGroup.Investor, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_Vendor')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords',  this.recordsCount, this.ls.l('ContactGroup_Vendor').toLowerCase()),
            dataLink: 'app/crm/contact/{contactId}/lead/{leadId}',
            allRecordsLink: '/app/crm/leads',
            linkParams: { contactGroup: 'Vendor' },
            visible: this.permissionService.isGranted(AppPermissions.CRMVendors),
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedLeadsOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedLeads(this.recordsCount, ContactGroup.Vendor, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_Other')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords',  this.recordsCount, this.ls.l('ContactGroup_Other').toLowerCase()),
            dataLink: 'app/crm/contact/{contactId}/lead/{leadId}',
            allRecordsLink: '/app/crm/leads',
            linkParams: { contactGroup: 'Other' },
            visible: this.permissionService.isGranted(AppPermissions.CRMOthers),
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedLeadsOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedLeads(this.recordsCount, ContactGroup.Other, contactId, orgUnitIds)
        }
    ];
    visibleItems: IRecentClientsSelectItem[] = this.selectItems.filter(item => item.visible);
    lastSelectedItem: IRecentClientsSelectItem = this.selectItems[0];
    selectedItem: BehaviorSubject<IRecentClientsSelectItem> = new BehaviorSubject<IRecentClientsSelectItem>(this.lastSelectedItem);
    selectedItem$: Observable<IRecentClientsSelectItem> = this.selectedItem.asObservable().pipe(distinctUntilChanged());
    userTimezone = DateHelper.getUserTimezone();
    hasBankCodeFeature: boolean = this.userManagementService.checkBankCodeFeature();

    get isSalesSelected(): boolean {
        return this.lastSelectedItem == this.selectItems[0];
    }

    constructor(
        private dashboardServiceProxy: DashboardServiceProxy,
        private dashboardWidgetsService: DashboardWidgetsService,
        private loadingService: LoadingService,
        private router: Router,
        private elementRef: ElementRef,
        private userManagementService: UserManagementService,
        private lifeCycleSubject: LifecycleSubjectsService,
        public ls: AppLocalizationService,
        public httpInterceptor: AppHttpInterceptor,
        private permissionService: AppPermissionService
    ) {}

    ngOnInit() {
        this.lifeCycleSubject.activate.next();
        this.recentlyCreatedCustomers$ = combineLatest(
            this.selectedItem$,
            this.dashboardWidgetsService.contactId$,
            this.dashboardWidgetsService.sourceOrgUnitIds$,
            this.dashboardWidgetsService.refresh$
        ).pipe(
            tap(() => this.loadingService.startLoading(this.elementRef.nativeElement)),
            switchMap(([selectedItem, contactId, orgUnitIds, ]) => 
                (this.lastSelectedItem != selectedItem ? of(selectedItem) : this.waitFor$).pipe(first(), switchMap(() =>
                    selectedItem.dataSource(contactId, orgUnitIds).pipe(
                        catchError(() => of([])),
                        finalize(() => {
                            this.loadComplete.next();
                            this.lastSelectedItem = selectedItem;
                            this.loadingService.finishLoading(this.elementRef.nativeElement);
                        })
                    )
                ))
            )
        );
        this.dashboardWidgetsService.contactGroupId$.pipe(
            takeUntil(this.lifeCycleSubject.deactivate$)
        ).subscribe((groupId: ContactGroup) => {
            if (groupId == ContactGroup.Client)
                this.selectedItem.next(this.selectItems[0]);
            else {
                let selectedList = this.selectItems.filter(item => {
                    return item.linkParams && ContactGroup[item.linkParams.contactGroup] == groupId;
                });
                if (selectedList.length)
                    this.selectedItem.next(selectedList[0]);
                else
                    this.selectedItem.next(this.selectItems[0]);
            }
        });
    }

    onCellClick($event) {
        if (this.selectedItem.value && this.selectedItem.value.dataLink && $event.row) {
            let eventRowData = $event.row.data;
            let dataLink = this.selectedItem.value.dataLink
                .replace('{contactId}', eventRowData.contactId)
                .replace('{leadId}', eventRowData.leadId);
            $event.row && this.router.navigate([dataLink], { queryParams: { referrer: this.router.url } }
            );
        }
    }

    onSelectionChanged($event) {        
        this.selectedItem.next($event.selectedItem);
    }

    ngOnDestroy() {
        this.lifeCycleSubject.deactivate.next();
    }
}
