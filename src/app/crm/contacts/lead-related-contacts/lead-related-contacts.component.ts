/** Core imports */
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { ContactGroup } from '@shared/AppEnums';
import {
    LeadServiceProxy, LeadInfoDto,
    ContactInfoDto, ContactServiceProxy
} from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';
import { ContactsService } from '../contacts.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { ODataService } from '@shared/common/odata/odata.service';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { ClientFields } from '@app/crm/clients/client-fields.enum';
import { LeadFields } from '@app/crm/leads/lead-fields.enum';

@Component({
    selector: 'lead-related-contacts',
    templateUrl: './lead-related-contacts.component.html',
    styleUrls: ['./lead-related-contacts.component.less'],
    providers: [ LifecycleSubjectsService ]
})
export class LeadRelatedContactsComponent implements OnInit, OnDestroy {
    @ViewChild(ActionMenuComponent, { static: false }) actionMenu: ActionMenuComponent;
    @ViewChild('leadDataGrid', {static: false}) leadDataGrid: DxDataGridComponent;
    @ViewChild('contactDataGrid', {static: false}) contactDataGrid: DxDataGridComponent;

    data = {
        contactInfo: new ContactInfoDto(),
        leadInfo: new LeadInfoDto()
    };

    userTimezone = DateHelper.getUserTimezone();
    private formatting = AppConsts.formatting;
    private readonly leadDataSourceURI = 'Lead';
    private readonly contactDataSourceURI = 'Contact';
    private readonly ident = 'LeadRelatedContacts';

    actionMenuItems: ActionMenuItem[];
    readonly clientFields = ClientFields;
    readonly leadFields = LeadFields;

    set selectedTabIndex(val: number) {
        val && this.initContactDataSource();
    }

    leadDataSource;
    contactDataSource;
    actionRecordData: any;
    defaultGridPagerConfig = DataGridService.defaultGridPagerConfig;
    tenantHasBankCodeFeature = this.userManagementService.checkBankCodeFeature();
    isCGManageAllowed = false;

    constructor(
        private router: Router,
        private invoicesService: InvoicesService,
        private contactProxy: ContactServiceProxy,
        private contactsService: ContactsService,
        private lifeCycleService: LifecycleSubjectsService,
        private loadingService: LoadingService,
        private permissionCheckerService: PermissionCheckerService,
        private permissionService: AppPermissionService,
        private oDataService: ODataService,
        public userManagementService: UserManagementService,
        public httpInterceptor: AppHttpInterceptor,
        public ls: AppLocalizationService
    ) {
        this.contactsService.loadLeadInfo();
    }

    ngOnInit() {
        this.contactsService.leadInfoSubscribe(leadInfo => {
            this.data.leadInfo = leadInfo;
            this.initLeadDataSource();
        }, this.ident);
        this.contactsService.contactInfoSubscribe(contactInfo => {
            this.data.contactInfo = contactInfo;
            this.initToolbarInfo();
            this.initLeadDataSource();
            this.isCGManageAllowed = this.permissionService.checkCGPermission(contactInfo.groupId);
            this.initActionMenuItems();
        }, this.ident);
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
                    request.params.$select = DataGridService.getSelectFields(
                        this.contactDataGrid,
                        [
                            this.clientFields.Id,
                            this.clientFields.Name,
                            this.clientFields.Email,
                            this.clientFields.Status,
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
                        request.params.contactGroupId = this.data.contactInfo.groupId;
                        request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        request.params.$select = DataGridService.getSelectFields(
                            this.leadDataGrid,
                            [
                                this.leadFields.Id,
                                this.leadFields.CustomerId,
                                this.leadFields.LeadDate,
                                this.leadFields.Stage,
                                this.leadFields.ContactAffiliateCode,
                                this.leadFields.SourceContactName,
                                this.leadFields.SourceCampaignCode,
                                this.leadFields.SourceChannelCode
                                //this.leadFields.RefererUrl
                            ]
                        );
                        request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    },
                    deserializeDates: false
                }
            };
    }

    initToolbarInfo() {
    }

    onCellClick(event) {
        let target = event.event.target;
        if (event.rowType === 'data') {
            if (target.closest('.dx-link.dx-link-edit'))
                this.toggleActionsMenu(event.data, target);
            else if (event.data.CustomerId)
                this.contactsService.updateLocation(event.data.CustomerId, event.data.Id,
                    undefined, undefined, undefined, 'lead-information');
            else
                this.contactsService.updateLocation(event.data.Id, undefined,
                    undefined, undefined, undefined, 'contact-information');
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
        if (this.actionRecordData.CustomerId)
            this.contactsService.updateLocation(
                this.actionRecordData.CustomerId, this.actionRecordData.Id,
                undefined, undefined, undefined, 'lead-information');
        else
            this.contactsService.updateLocation(this.actionRecordData.Id, undefined,
                undefined, undefined, undefined, 'contact-information');
    }

    deleteLead() {
        if (this.actionRecordData.CustomerId)
            this.contactsService.deleteContact(
                this.data.contactInfo.personContactInfo.fullName,
                this.data.contactInfo.groupId,
                this.actionRecordData.Id,
                () => {}, true
            );
        else
            this.contactsService.deleteContact(
                this.actionRecordData.Name,
                this.actionRecordData.GroupId,
                this.actionRecordData.Id
            );
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
        this.lifeCycleService.destroy.next();
    }
}