/** Core imports */
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouteReuseStrategy, Params } from '@angular/router';

/** Third party imports */
import { BehaviorSubject, Observable } from 'rxjs';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { first, filter, takeUntil } from 'rxjs/operators';
import invert from 'lodash/invert';
import * as _ from 'underscore';
import { select, Store } from '@ngrx/store';

/** Application imports */
import { ContactGroup } from '@shared/AppEnums';
import {
    LeadInfoDto,
    ContactInfoDto,
    PipelineDto
} from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';
import { ContactsService } from '../contacts.service';
import { AppConsts } from '@shared/AppConsts';
import { ODataService } from '@shared/common/odata/odata.service';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { CustomReuseStrategy } from '@shared/common/custom-reuse-strategy/custom-reuse-strategy.service.ts';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { ClientFields } from '@app/crm/clients/client-fields.enum';
import { LeadFields } from '@app/crm/leads/lead-fields.enum';
import { PipelinesStoreSelectors } from '@app/crm/store';
import { AppStore } from '@app/store';

@Component({
    selector: 'lead-related-contacts',
    templateUrl: './lead-related-contacts.component.html',
    styleUrls: ['./lead-related-contacts.component.less'],
    providers: [LifecycleSubjectsService]
})
export class LeadRelatedContactsComponent implements OnInit, OnDestroy {
    @ViewChild(ActionMenuComponent, { static: false }) actionMenu: ActionMenuComponent;
    @ViewChild('leadDataGrid', {static: false}) leadDataGrid: DxDataGridComponent;
    @ViewChild('contactDataGrid', {static: false}) contactDataGrid: DxDataGridComponent;
    @ViewChild('subContactDataGrid', {static: false}) subContactDataGrid: DxDataGridComponent;

    data = {
        contactInfo: new ContactInfoDto(),
        leadInfo: new LeadInfoDto()
    };

    contactGroup = invert(ContactGroup);
    userTimezone = DateHelper.getUserTimezone();
    private formatting = AppConsts.formatting;
    private readonly leadDataSourceURI = 'Lead';
    private readonly contactDataSourceURI = 'Contact';
    private readonly ident = 'LeadRelatedContacts';
    private readonly CONTACT_TAB_INDEX = 1;
    private _selectedTabIndex = 0;

    actionMenuItems: ActionMenuItem[];
    readonly clientFields = ClientFields;
    readonly leadFields = LeadFields;

    get selectedTabIndex(): number {
        return this._selectedTabIndex;
    }

    set selectedTabIndex(val: number) {
        this._selectedTabIndex = val;
        if (val) {
            if (val == this.CONTACT_TAB_INDEX)
                this.initContactDataSource();
            else
                this.initSubContactDataSource();
        } else
            this.initLeadDataSource();
    }

    leadDataSource;
    contactDataSource;
    subContactDataSource;
    actionRecordData: any;
    defaultGridPagerConfig = DataGridService.defaultGridPagerConfig;
    tenantHasBankCodeFeature = this.userManagementService.checkBankCodeFeature();
    isCGManageAllowed = false;

    pipelines: { [id: number]: PipelineDto } = {};

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private reuseService: RouteReuseStrategy,
        private contactsService: ContactsService,
        private lifeCycleService: LifecycleSubjectsService,
        private itemDetailsService: ItemDetailsService,
        private permissionService: AppPermissionService,
        private oDataService: ODataService,
        private store$: Store<AppStore.State>,
        public loadingService: LoadingService,
        public userManagementService: UserManagementService,
        public httpInterceptor: AppHttpInterceptor,
        public ls: AppLocalizationService
    ) {
        this.loadPipelines();
        this.contactsService.loadLeadInfo();
    }

    ngOnInit() {
        this.contactsService.leadInfoSubscribe(leadInfo => {
            this.data.leadInfo = leadInfo;
        }, this.ident);
        this.contactsService.contactInfoSubscribe((contactInfo: ContactInfoDto) => {
            if (contactInfo) {
                this.data.contactInfo = contactInfo;
                this.isCGManageAllowed = this.permissionService.checkCGPermission(contactInfo.groups);
                this.refreshDataSources();
                this.initActionMenuItems();
                this.initQueryParams();
            }
        }, this.ident);
    }

    loadPipelines() {
        this.store$.pipe(
            select(PipelinesStoreSelectors.getPipelines({
                purpose: AppConsts.PipelinePurposeIds.lead
            })),
            takeUntil(this.lifeCycleService.destroy$),
            filter((pipelines: PipelineDto[]) => !!pipelines)
        ).subscribe(pipelines => {
            this.pipelines = {};
            pipelines.forEach(pipeline => this.pipelines[pipeline.id] = pipeline);
        });
    }

    refreshDataSources() {
        if (this.contactDataSource)
            this.initContactDataSource();
        if (this.subContactDataSource)
            this.initSubContactDataSource();
        if (this.leadDataSource)
            this.initLeadDataSource();
    }

    initQueryParams() {
        this.route.queryParams.pipe(first()).subscribe(params => {
            if (params['tab']) {
                this.selectedTabIndex = parseInt(params['tab']);
                this.removeTabQueryParam();
            } else
                this.initLeadDataSource();
        });
    }

    initActionMenuItems() {
        this.actionMenuItems = [
            {
                text: this.ls.l('View'),
                class: 'edit',
                action: this.viewLead.bind(this)
            },
            {
                text: this.ls.l('Delete'),
                class: 'delete',
                action: this.deleteLead.bind(this),
                disabled: !this.isCGManageAllowed
            }
        ];
    }

    initContactDataSource() {
        this.contactDataSource = new DataSource({
            store: new ODataStore({
                key: this.clientFields.Id,
                url: this.oDataService.getODataUrl(
                    this.contactDataSourceURI,
                    {[this.clientFields.SourceContactId]: this.data.contactInfo.id}
                ),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    this.loadingService.startLoading();
                    request.params.$select = DataGridService.getSelectFields(
                        this.contactDataGrid,
                        [
                            this.clientFields.Id,
                            this.clientFields.Name,
                            this.clientFields.Email,
                            this.clientFields.ContactDate,
                            this.clientFields.BankCode,
                            this.clientFields.SourceContactId,
                            this.clientFields.GroupId
                        ]
                    );
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                }
            })
        });
    }

    initSubContactDataSource() {
        this.subContactDataSource = new DataSource({
            store: new ODataStore({
                key: this.clientFields.Id,
                url: this.oDataService.getODataUrl(
                    this.contactDataSourceURI,
                    {[this.clientFields.ParentId]: this.data.contactInfo.id}
                ),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    this.loadingService.startLoading();
                    request.params.$select = DataGridService.getSelectFields(
                        this.subContactDataGrid,
                        [
                            this.clientFields.Id,
                            this.clientFields.Name,
                            this.clientFields.Email,
                            this.clientFields.ContactDate,
                            this.clientFields.BankCode,
                            this.clientFields.ParentId,
                            this.clientFields.GroupId
                        ]
                    );
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                }
            })
        });
    }

    initLeadDataSource() {
        if (this.data.contactInfo.id)
            this.leadDataSource = {
                uri: this.leadDataSourceURI,
                requireTotalCount: true,
                store: {
                    key: this.leadFields.Id,
                    type: 'odata',
                    url: this.oDataService.getODataUrl(this.leadDataSourceURI, {
                        [this.leadFields.CustomerId]: this.data.contactInfo.id
                    }),
                    version: AppConsts.ODataVersion,
                    beforeSend: (request) => {
                        this.loadingService.startLoading();
                        request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        request.params.$select = DataGridService.getSelectFields(
                            this.leadDataGrid,
                            [
                                this.leadFields.Id,
                                this.leadFields.CustomerId,
                                this.leadFields.LeadDate,
                                this.leadFields.Stage,
                                this.leadFields.SourceAffiliateCode,
                                this.leadFields.SourceContactName,
                                this.leadFields.SourceCampaignCode,
                                this.leadFields.SourceChannelCode,
                                this.leadFields.SourceRefererUrl
                            ]
                        );
                        request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    },
                    deserializeDates: false
                }
            };
    }

    removeTabQueryParam() {
        this.router.navigate([], {
            queryParams: {tab: null},
            queryParamsHandling: 'merge'
        });
    }

    onCellClick(event) {
        let target = event.event.target;
        if (event.rowType === 'data') {
            if (target.closest('.dx-link.dx-link-edit'))
                this.toggleActionsMenu(event.data, target);
            else {
                this.itemDetailsService.clearItemsSource();
                if (event.data.CustomerId)
                    this.contactsService.updateLocation(event.data.CustomerId, event.data.Id,
                        undefined, undefined, undefined, 'lead-information');
                else
                    this.contactsService.updateLocation(event.data.Id, undefined,
                        undefined, undefined, undefined, 'contact-information');
            }
        }
    }

    toggleActionsMenu(data, target) {
        this.actionRecordData = data;
        this.actionMenu.toggle(target);
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionRecordData = null;
        this.actionMenu.hide();
    }

    viewLead() {
        this.itemDetailsService.clearItemsSource();
        if (this.actionRecordData.CustomerId)
            this.contactsService.updateLocation(
                this.actionRecordData.CustomerId, this.actionRecordData.Id,
                undefined, undefined, undefined, 'lead-information');
        else
            this.contactsService.updateLocation(this.actionRecordData.Id, undefined,
                undefined, undefined, undefined, 'contact-information');
    }

    deleteLead() {
        let id = this.actionRecordData.Id;
        if (this.actionRecordData.CustomerId)
            this.contactsService.deleteContact(
                this.data.contactInfo.personContactInfo.fullName,
                this.data.contactInfo.groups.map(group => group.groupId), id,
                () => {
                    this.itemDetailsService.clearItemsSource();
                    (this.reuseService as CustomReuseStrategy).invalidate('leads');
                    if (this.data.leadInfo.id == id) {
                        if (this.leadDataGrid.instance.getDataSource().totalCount() == 1) {
                            let params = (this.route.queryParams as BehaviorSubject<Params>).getValue();
                            this.router.navigate([params.referrer || 'app/crm/leads'], {
                                queryParams: _.mapObject(params,
                                    (val, key) => key == 'referrer' ? undefined : val
                                )
                            });
                        } else
                            this.contactsService.updateLocation(this.data.contactInfo.id, undefined,
                                undefined, undefined, undefined, 'lead-related-contacts');
                    } else
                        this.leadDataGrid.instance.refresh();
                }, true
            );
        else
            this.contactsService.deleteContact(
                this.actionRecordData.Name,
                [this.actionRecordData.GroupId],
                id, () => {
                    (this.reuseService as CustomReuseStrategy).invalidate('clients');
                    this.subContactDataGrid.instance.refresh();
                    this.contactDataGrid.instance.refresh();
                }
            );
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
        this.lifeCycleService.destroy.next();
    }
}