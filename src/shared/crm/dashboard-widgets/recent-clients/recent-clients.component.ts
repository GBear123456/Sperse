/** Core imports */
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, tap, distinctUntilChanged, takeUntil } from 'rxjs/operators';

/** Application imports */
import {
    DashboardServiceProxy,
    GetRecentlyCreatedCustomersOutput,
    GetRecentlyCreatedLeadsOutput
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
    recordsCount = 10;
    formatting = AppConsts.formatting;
    recentlyCreatedCustomers$: Observable<GetRecentlyCreatedCustomersOutput[]>;
    selectItems: IRecentClientsSelectItem[] = [
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
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_UserProfile')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords', this.recordsCount, this.ls.l('ContactGroup_UserProfile').toLowerCase()),
            dataLink: 'app/crm/contact/{contactId}/lead/{leadId}',
            allRecordsLink: '/app/crm/leads',
            linkParams: { contactGroup: 'UserProfile' },
            visible: this.permissionService.isGranted(AppPermissions.CRMEmployees),
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedLeadsOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedLeads(this.recordsCount, ContactGroup.UserProfile, contactId, orgUnitIds)
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
    selectedItem: BehaviorSubject<IRecentClientsSelectItem> = new BehaviorSubject<IRecentClientsSelectItem>(this.selectItems[0]);
    selectedItem$: Observable<IRecentClientsSelectItem> = this.selectedItem.asObservable().pipe(distinctUntilChanged());
    userTimezone = DateHelper.getUserTimezone();
    hasBankCodeFeature: boolean = this.userManagementService.checkBankCodeFeature();

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
            switchMap(([selectedItem, contactId, orgUnitIds, ]) => selectedItem.dataSource(contactId, orgUnitIds).pipe(
                catchError(() => of([])),
                finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
            ))
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
        if (this.selectedItem.value && this.selectedItem.value.dataLink) {
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
