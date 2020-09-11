/** Core imports */
import { ChangeDetectionStrategy, Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, tap, distinctUntilChanged } from 'rxjs/operators';

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

@Component({
    selector: 'recent-clients',
    templateUrl: './recent-clients.component.html',
    styleUrls: ['./recent-clients.component.less'],
    providers: [ DashboardServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentClientsComponent implements OnInit {
    recordsCount = 10;
    formatting = AppConsts.formatting;
    recentlyCreatedCustomers$: Observable<GetRecentlyCreatedCustomersOutput[]>;
    selectItems: IRecentClientsSelectItem[] = [
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_Client')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords', this.recordsCount, this.ls.l('ContactGroup_Client').toLowerCase()),
            dataLink: '',
            allRecordsLink: '/app/crm/leads',
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedCustomersOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedLeads(ContactGroup.Client, this.recordsCount, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentClients'),
            message: this.ls.l('CRM', 'CRMDashboard_LastNClientsRecords', [this.recordsCount]),
            dataLink: 'app/crm/contact',
            allRecordsLink: '/app/crm/clients',
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedCustomersOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedCustomers(this.recordsCount, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_Partner')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords', this.recordsCount, this.ls.l('ContactGroup_Partner').toLowerCase()),
            dataLink: '',
            allRecordsLink: '/app/crm/leads',
            linkParams: { contactGroup: 'Partner' },
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedLeadsOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedLeads(ContactGroup.Partner, this.recordsCount, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_UserProfile')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords', this.recordsCount, this.ls.l('ContactGroup_UserProfile').toLowerCase()),
            dataLink: '',
            allRecordsLink: '/app/crm/leads',
            linkParams: { contactGroup: 'UserProfile' },
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedLeadsOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedLeads(ContactGroup.UserProfile, this.recordsCount, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_Investor')),
            message: this.ls.l('CRMDashboard_LastNEntitiesRecords',  this.recordsCount, this.ls.l('ContactGroup_Investor').toLowerCase()),
            dataLink: '',
            allRecordsLink: '/app/crm/leads',
            linkParams: { contactGroup: 'Investor' },
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedLeadsOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedLeads(ContactGroup.Investor, this.recordsCount, contactId, orgUnitIds)
        },
        {
            name: this.ls.l('CRMDashboard_RecentEntities', this.ls.l('ContactGroup_Vendor')),
            message: this.ls.l('CRM', 'CRMDashboard_LastNEntitiesRecords',  this.recordsCount, this.ls.l('ContactGroup_Vendor').toLowerCase()),
            dataLink: '',
            allRecordsLink: '/app/crm/leads',
            linkParams: { contactGroup: 'Vendor' },
            dataSource: (contactId: number, orgUnitIds: number[]): Observable<GetRecentlyCreatedLeadsOutput[]> =>
                this.dashboardServiceProxy.getRecentlyCreatedLeads(ContactGroup.Vendor, this.recordsCount, contactId, orgUnitIds)
        }
    ];
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
        public ls: AppLocalizationService,
        public httpInterceptor: AppHttpInterceptor
    ) {}

    ngOnInit() {
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
    }

    onCellClick($event) {
        if (this.selectedItem.value && this.selectedItem.value.dataLink) {
            $event.row && this.router.navigate(
                [this.selectedItem.value.dataLink, $event.row.data.id],
                { queryParams: { referrer: this.router.url } }
            );
        }
    }

    onSelectionChanged($event) {
        this.selectedItem.next($event.selectedItem);
    }
}
