/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivationEnd, Params } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { CacheService } from 'ng2-cache-service';
import { Store, select } from '@ngrx/store';
import { forkJoin, of } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import * as _ from 'underscore';
import DataSource from 'devextreme/data/data_source';

/** Application imports */
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppStore, PartnerTypesStoreSelectors, PartnerAssignedUsersStoreSelectors, LeadAssignedUsersStoreSelectors, CustomerAssignedUsersStoreSelectors } from '@app/store';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup, ContactStatus } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactServiceProxy,
    ContactInfoDto,
    UpdateContactStatusInput,
    LeadServiceProxy,
    LeadInfoDto,
    PartnerServiceProxy,
    PartnerInfoDto,
    UpdatePartnerTypeInput,
    UserServiceProxy,
    CustomerServiceProxy,
    PersonContactInfoDto,
    OrganizationContactServiceProxy,
    OrganizationContactInfoDto
} from '@shared/service-proxies/service-proxies';
import { VerificationChecklistItemType, VerificationChecklistItem, VerificationChecklistItemStatus } from './verification-checklist/verification-checklist.model';
import { OperationsWidgetComponent } from './operations-widget.component';
import { ContactsService } from './contacts.service';
import { RP_DEFAULT_ID, RP_USER_INFO_ID } from './contacts.const';
import { AppStoreService } from '@app/store/app-store.service';
import { ContactPersonsDialogComponent } from './contact-persons-dialog/contact-persons-dialog.component';
import { CreateClientDialogComponent } from '../shared/create-client-dialog/create-client-dialog.component';

@Component({
    templateUrl: './contacts.component.html',
    styleUrls: ['./contacts.component.less'],
    host: {
        '(document:click)': 'closeEditDialogs($event)'
    },
    providers: [ AppStoreService, DialogService ]
})
export class ContactsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(OperationsWidgetComponent) toolbarComponent: OperationsWidgetComponent;

    readonly RP_DEFAULT_ID = RP_DEFAULT_ID;
    readonly RP_USER_INFO_ID = RP_USER_INFO_ID;

    customerId: number;
    customerType: string;
    contactInfo: ContactInfoDto;
    personContactInfo: PersonContactInfoDto;
    primaryContact: any;
    verificationChecklist: VerificationChecklistItem[];
    leadInfo: LeadInfoDto;
    leadId: number;
    leadStages = [];
    clientStageId: number;
    ratingId: number;
    configMode: boolean;
    partnerInfo: PartnerInfoDto;
    partnerTypeId: string;
    partnerTypes: any[] = [];
    operationsEnabled = false;

    private initialData: string;

    navLinks = [];

    rightPanelSetting: any = {
        id: RP_DEFAULT_ID,
        clientScores: true,
        totalApproved: true,
        verification: true,
        opened: false
    };

    params: any;
    private rootComponent: any;
    private paramsSubscribe: any = [];
    referrerParams: Params;

    prevNextDataSource: any;
    dataSourceURI = 'Customer';
    currentItemId;

    constructor(injector: Injector,
                private _dialog: MatDialog,
                private _dialogService: DialogService,
                private _cacheService: CacheService,
                private _userService: UserServiceProxy,
                private _contactService: ContactServiceProxy,
                private _orgContactService: OrganizationContactServiceProxy,
                private _partnerService: PartnerServiceProxy,
                private _leadService: LeadServiceProxy,
                private _pipelineService: PipelineService,
                private _contactsService: ContactsService,
                private store$: Store<AppStore.State>,
                private _appStoreService: AppStoreService,
                private _customerService: CustomerServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this._appStoreService.loadUserDictionaries();
        _contactService['data'] = {
            contactInfo: null,
            leadInfo: null,
            partnerInfo: null
        };
        this.rootComponent = this.getRootComponent();
        this.paramsSubscribe.push(this._activatedRoute.params
            .subscribe(params => this.loadData(params)));

        this.paramsSubscribe.push(this._activatedRoute.queryParams
            .subscribe(params => {
                this.referrerParams = params;
        }));
        _contactsService.verificationSubscribe(
            this.initVerificationChecklist.bind(this)
        );
        let optionTimeout = null;
        this._router.events.subscribe((event) => {
            if (event instanceof ActivationEnd && !optionTimeout)
                optionTimeout = setTimeout(() => {
                    optionTimeout = null;
                    let data = event.snapshot.data,
                        rightPanelId = this.getCheckPropertyValue(data, 'rightPanelId', RP_DEFAULT_ID);
                    this.rightPanelSetting.opened = this.getCheckPropertyValue(data, 'rightPanelOpened',
                        rightPanelId == RP_DEFAULT_ID && abp.features.isEnabled('PFM.CreditReport')
                        || rightPanelId == RP_USER_INFO_ID && this._userService['data'].userId
                    );
                    this.rightPanelSetting.id = rightPanelId;
                });
        });
        _contactsService.userSubscribe((userId) => {
            if (this.rightPanelSetting.id == RP_USER_INFO_ID)
                this.rightPanelSetting.opened = Boolean(userId);
        });
        _contactsService.invalidateSubscribe((area) => { this.invalidate(area); });
        _contactsService.loadLeadInfoSubscribe(() => this.loadLeadData());
    }

    ngOnInit() {
        this.rootComponent.overflowHidden(true);
        this.rootComponent.pageHeaderFixed();

        let key = this.getCacheKey(abp.session.userId);
        if (this._cacheService.exists(key))
            this.rightPanelSetting = this._cacheService.get(key);
        switch (this.referrerParams.referrer.split('/').pop()) {
            case 'leads':
                this.dataSourceURI = 'Lead';
                this.currentItemId = this.params.leadId;
                break;
            case 'clients':
                this.dataSourceURI = 'Customer';
                this.currentItemId = this.params.clientId;
                break;
            case 'partners':
                this.dataSourceURI = 'Partner';
                this.currentItemId = this.params.partnerId;
                break;
            default:
                break;
        }

        this.prevNextDataSource = new DataSource({
            requireTotalCount: false,
            pageSize: 1,
            filter: [ 'Id', '>', this.currentItemId ],
            store: {
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                paginate: true
            },
            sort: [
                { selector: 'Id', desc: false }
            ]
        });
    }

    private getCheckPropertyValue(obj, prop, def) {
        return obj.hasOwnProperty(prop) ? obj[prop] : def;
    }

    private InitNavLinks(contact) {
        this.navLinks = [
            {label: 'Contact Information', route: 'contact-information'},
            {
                label: contact.userId ? 'User Information' : 'Invite User',
                hidden: !this.permission.isGranted(contact.userId ?
                    'Pages.Administration.Users' : 'Pages.Administration.Users.Create'),
                route: 'user-information'
            },
            {label: 'Documents', route: 'documents'},
            {label: 'Notes', route: 'notes'},
            {label: 'Subscriptions', route: 'subscriptions', hidden: !this.isClientDetailPage()},
            {label: 'Payment Information', route: 'payment-information', hidden: !this.isClientDetailPage()},
            {label: 'Lead Information', route: 'lead-information', hidden: this.customerType == ContactGroup.Partner || (this.leadInfo && !this.leadInfo.id)},
            {label: 'Referral History', route: 'referral-history', disabled: true},
            {label: 'Application Status', route: 'application-status', hidden: !!this.leadId, disabled: true},
            {label: 'Questionnaire', route: 'questionnaire', disabled: true},
            {label: 'Activity Logs', route: 'activity-logs', disabled: true}
        ];
    }

    isClientDetailPage() {
        return this.customerType !== ContactGroup.Partner && !this.partnerTypeId && !this.leadId;
    }

    private storeInitialData() {
        this.initialData = JSON.stringify(this._contactService['data']);
    }

    private fillContactDetails(result, contactId = null) {
        this._contactService['data'].contactInfo = result;
        this._contactsService.contactInfoUpdate(result);

        contactId = contactId || result.personContactInfo.id;

        if (result.organizationContactInfo && result.organizationContactInfo.contactPersons) {
            result.organizationContactInfo.contactPersons.map((contact) => {
                return (contact.id == contactId ? result.personContactInfo : contact);
            });
        }

        this.operationsEnabled = (result.groupId != ContactGroup.UserProfile);
        this.ratingId = result.ratingId;
        this.primaryContact = result.personContactInfo;
        this.contactInfo = result;
        this.personContactInfo = result.personContactInfo;
        this.initVerificationChecklist();

        this._contactsService.userUpdate(
            this._userService['data'].userId = this.primaryContact.userId
        );
        this.InitNavLinks(this.primaryContact);
        this._contactsService.toolbarUpdate();
        this.storeInitialData();
    }

    private fillLeadDetails(result) {
        this._contactService['data'].leadInfo = this.leadInfo = result;
        this.leadId = this.contactInfo['leadId'] = result.id;

        this.loadLeadsStages(() => {
            if (this.leadInfo.stage)
                this.clientStageId = this.leadStages.find(
                    stage => stage.name === this.leadInfo.stage).id;
        });

        this.storeInitialData();
    }

    private fillPartnerDetails(result) {
        this._contactService['data'].partnerInfo = this.partnerInfo = result;
        this.partnerTypeId = result.typeId;
        this.storeInitialData();
    }

    invalidate(area?: any) {
        !area && this.loadData(this.params);
    }

    loadData(params) {
        let userId = params['userId'],
            clientId = params['clientId'],
            partnerId = params['partnerId'],
            customerId = clientId || partnerId,
            leadId = params['leadId'],
            companyId = params['companyId'];

        this.params = params;
        this._userService['data'] = {
            userId: userId, user: null, roles: null
        };
        this._contactService['data'].contactInfo = {
            id: this.customerId = customerId
        };
        this._contactService['data'].leadInfo = {
            id: this.leadId = leadId
        };

        if (userId)
            this.loadDataForUser(userId, companyId);
        else
            this.loadDataForClient(customerId, leadId, partnerId, companyId);
    }

    get isUserProfile() {
        return this.customerType === ContactGroup.UserProfile;
    }

    getContactInfoWithCompany(companyId, contactInfo$) {
        return forkJoin(
            contactInfo$,
            companyId
                ? this._orgContactService.getOrganizationContactInfo(companyId)
                : of(OrganizationContactInfoDto.fromJS({}))
        ).pipe(map((contactInfo) => {
            contactInfo[0]['organizationContactInfo'] = contactInfo[1];
            if (!companyId && contactInfo[0]['primaryOrganizationContactId'])
                this._orgContactService.getOrganizationContactInfo(
                    contactInfo[0]['primaryOrganizationContactId']).subscribe((result) => {
                        contactInfo[0]['organizationContactInfo'] = result;
                        this._contactsService.organizationInfoUpdate(result);
                    });
            else
                this._contactsService.organizationInfoUpdate(OrganizationContactInfoDto.fromJS({}));

            return contactInfo[0];
        }));
    }

    loadDataForUser(userId, companyId) {
        this.getContactInfoWithCompany(
            companyId,
            this._contactService.getContactInfoForUser(userId)
        ).subscribe((res) => {
            this.fillContactDetails(res, res['id']);
        });
    }

    loadDataForClient(contactId: number, leadId: number, partnerId: number, companyId: number) {
        if (contactId) {
            this.startLoading(true);
            let contactInfo$ = this.getContactInfoWithCompany(companyId,
                this._contactService.getContactInfo(contactId)
            );

            if (leadId)
                this.loadLeadsStages();

            this.customerType = partnerId ? ContactGroup.Partner : ContactGroup.Client;
            if (this.customerType == ContactGroup.Partner) {
                let partnerInfo$ = this._partnerService.get(partnerId);
                forkJoin(contactInfo$, partnerInfo$).pipe(finalize(() => {
                    this.finishLoading(true);
                    if (!this.partnerInfo)
                        this.close(true);
                })).subscribe(result => {
                    let contactInfo = result[0];
                    this.loadLeadData(contactInfo['personContactInfo']);
                    this.fillContactDetails(contactInfo);
                    this.fillPartnerDetails(result[1]);
                    this.loadPartnerTypes();
                });
            } else {
                contactInfo$.pipe(finalize(() => {
                    this.finishLoading(true);
                    if (!this.contactInfo)
                        this.close(true);
                })).subscribe(result => {
                    this.loadLeadData(result['personContactInfo']);
                    this.fillContactDetails(result);
                });
            }
        }
    }

    loadLeadData(personContactInfo?: any, lastLeadCallback?) {
        let contactInfo = this._contactService['data'].contactInfo,
            leadInfo = this._contactService['data'].leadInfo;
        if ((contactInfo && leadInfo) || lastLeadCallback) {
            !lastLeadCallback && this.startLoading(true);
            let leadId = leadInfo.id,
                leadInfo$ = leadId && !lastLeadCallback ? this._leadService.getLeadInfo(leadId) :
                    this._leadService.getLast(contactInfo.id);

            leadInfo$.pipe(finalize(() => {
                this.finishLoading(true);
            })).subscribe(result => {
                this.fillLeadDetails(result);
                personContactInfo && this.InitNavLinks(personContactInfo);
                lastLeadCallback && lastLeadCallback();
            });
        }
    }

    private loadLeadsStages(callback?: () => any) {
        if (this.leadStages && this.leadStages.length)
            callback && callback();
        else
            this._pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.lead)
                .subscribe(result => {
                    this.leadStages = result.stages.map((stage) => {
                        return {
                            id: stage.id,
                            name: stage.name,
                            text: stage.name,
                            action: this.updateLeadStage.bind(this)
                        };
                    });
                    callback && callback();
                });
    }

    private loadPartnerTypes() {
        this.store$.pipe(select(PartnerTypesStoreSelectors.getPartnerTypes)).subscribe(
            (partnerTypes: any) => {
                this.partnerTypes = partnerTypes && partnerTypes.length ?
                    partnerTypes.map(type => {
                        type['action'] = this.updatePartnerType.bind(this);
                        return type;
                    }) : [];
            }
        );
    }

    private getCustomerName() {
        return this.contactInfo.personContactInfo.fullName;
    }

    private showConfirmationDialog(status) {
        this.message.confirm(
            this.l('ClientUpdateStatusWarningMessage'),
            this.l('ClientStatusUpdateConfirmationTitle'),
            isConfirmed => {
                if (isConfirmed) {
                    this.updateStatusInternal(status.id)
                        .subscribe(() => {
                            this.contactInfo.statusId = status.id;
                            this.toolbarComponent.statusComponent.listComponent.option('selectedItemKeys', [status.id]);
                            this.notify.success(this.l('StatusSuccessfullyUpdated'));
                        });
                } else {
                    this.toolbarComponent.statusComponent.listComponent.option('selectedItemKeys', [this.contactInfo.statusId]);
                }
            }
        );
    }

    private updateStatusInternal(statusId: string) {
        return this._contactService.updateContactStatus(new UpdateContactStatusInput({
            contactId: this.contactInfo.id,
            statusId: statusId
        }));
    }

    private getVerificationChecklistItem(type: VerificationChecklistItemType,
        status?: VerificationChecklistItemStatus, confirmedCount?, totalCount?): VerificationChecklistItem {
        return {
            type: type,
            status: status,
            confirmedCount: confirmedCount,
            totalCount: totalCount
        } as VerificationChecklistItem;
    }

    private getVerificationChecklistItemByMultipleValues(items: any[],
        type: VerificationChecklistItemType
    ): VerificationChecklistItem {
        let confirmedCount = 0;
        items.forEach(i => {
            if (i.isConfirmed)
                confirmedCount++;
        });
        return this.getVerificationChecklistItem(
            type,
            confirmedCount > 0 ? VerificationChecklistItemStatus.success
                : VerificationChecklistItemStatus.unsuccess,
            confirmedCount,
            items.length
        );
    }

    showContactPersons(event) {
        this._dialog.closeAll();
        this._dialog.open(ContactPersonsDialogComponent, {
            data: this.contactInfo,
            hasBackdrop: false,
            minWidth: 420,
            position: this.getDialogPossition(event, -182, 89),
            panelClass: ['related-contacts']
        }).afterClosed().subscribe(result => {
            if (result == 'addContact')
                this.addNewContact(event);
            else if (result) {
                this.startLoading(true);
                this._contactService.getContactInfo(result.id)
                    .pipe(finalize(() => this.finishLoading(true))).subscribe((contactInfo) => {
                        let orgContactInfo = contactInfo['organizationContactInfo'] = this.contactInfo['organizationContactInfo'];
                        this.customerId = contactInfo.id;
                        this.fillContactDetails(contactInfo);
                        let isPartner = this.customerType == ContactGroup.Partner;
                        this.loadLeadData(contactInfo.personContactInfo, () => {
                            this._contactsService.updateLocation(
                                (isPartner ? null : this.customerId), this.leadId,
                                (isPartner ? this.customerId : null),
                                orgContactInfo && orgContactInfo.id);
                        });
                    });
            }
        });
        event.stopPropagation();
    }

    getDialogPossition(event, shiftX, shiftY) {
        return this._dialogService.calculateDialogPosition(event, event.target.closest('div'), shiftX, shiftY);
    }

    close(force = false) {
        this._dialog.closeAll();
        let data = force || JSON.stringify(<any>this._contactService['data']);
        this._router.navigate(
            [this.referrerParams.referrer || 'app/crm/clients'],
            { queryParams: _.extend(_.mapObject(this.referrerParams,
                (val, key) => {
                    return (key == 'referrer' ? undefined : val);
                }), !force && this.initialData != data ? {refresh: true} : {})
            }
        );
    }

    closeEditDialogs(event) {
        if (document.body.contains(event.target) && !this._dialog.getDialogById('permanent') &&
            !event.target.closest('.mat-dialog-container, .dx-popup-wrapper, .swal-modal')
        )
            this._dialog.closeAll();
    }

    printMainArea() {
        let elm = this.getElementRef(),
            handel = window.open();
        handel.document.open();
        handel.document.write('<h1>' + this.getCustomerName() + '</h1>' +
            elm.nativeElement.getElementsByClassName('main-content')[0].innerHTML);
        handel.document.close();
        handel.print();
        handel.close();
    }

    ngOnDestroy() {
        this._dialog.closeAll();
        this.paramsSubscribe.forEach((sub) => sub.unsubscribe());
        this.rootComponent.overflowHidden();
        this.rootComponent.pageHeaderFixed(true);

        this._contactsService.unsubscribe();
    }

    deleteLead() {
        this.message.confirm(
            this.l('LeadDeleteWarningMessage', this.getCustomerName()),
            isConfirmed => {
                if (isConfirmed) {
                    this._leadService.deleteLead(this.leadId).subscribe(() => {
                        this.notify.success(this.l('SuccessfullyDeleted'));
                        this._contactService['data']['deleted'] = true;
                        this.close();
                    });
                }
            }
        );
    }

    updateStatus(statusId: string) {
        this.showConfirmationDialog(statusId);
    }

    updateRating(ratingId: number) {
        this.ratingId = ratingId;
    }

    initVerificationChecklist(): void {
        let person = this.primaryContact.person;
        let contactDetails = this.primaryContact.details;
        this.verificationChecklist = [
            this.getVerificationChecklistItem(
                VerificationChecklistItemType.Identity,
                person && person.identityConfirmationDate
                    ? VerificationChecklistItemStatus.success
                    : VerificationChecklistItemStatus.unsuccess
            ),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.emails, VerificationChecklistItemType.Email),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.phones, VerificationChecklistItemType.Phone),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.addresses, VerificationChecklistItemType.Address),
            this.getVerificationChecklistItem(VerificationChecklistItemType.Employment),
            this.getVerificationChecklistItem(VerificationChecklistItemType.Income)
        ];
    }

    updateLeadStage($event) {
        if (!this.leadId || !this.leadInfo)
            return;

        let sourceStage = this.leadInfo.stage;
        let targetStage = $event.itemData.text;
        let complete = () => {
            this.clientStageId = this.leadStages.find(stage => stage.name === targetStage).id;
            this.toolbarComponent.stagesComponent.listComponent.option('selectedItemKeys', [this.clientStageId]);
            this.notify.success(this.l('StageSuccessfullyUpdated'));
        };
        if (this._pipelineService.updateEntityStage(AppConsts.PipelinePurposeIds.lead, this.leadInfo, sourceStage, targetStage, complete))
            this.leadInfo.stage = targetStage;
        else
            this.message.warn(this.l('CannotChangeLeadStage', sourceStage, targetStage));

        this.toolbarComponent.refresh();
        $event.event.stopPropagation();
    }

    updatePartnerType($event) {
        this.showUpdatePartnerTypeConfirmationDialog($event.selectedRowKeys[0]);
        $event.event.stopPropagation();
    }

    private showUpdatePartnerTypeConfirmationDialog(typeId) {
        this.message.confirm(
            this.l('PartnerTypeUpdateWarningMessage'),
            this.l('PartnerTypeUpdateConfirmationTitle'),
            isConfirmed => {
                if (isConfirmed) {
                    this._partnerService.updateType(UpdatePartnerTypeInput.fromJS({
                        partnerId: this.customerId,
                        typeId: typeId
                    })).subscribe(() => {
                        this.partnerInfo.typeId = typeId;
                        this.partnerTypeId = typeId;
                        this.notify.success(this.l('TypeSuccessfullyUpdated'));
                    });
                } else {
                    this.toolbarComponent.partnerTypesComponent.listComponent.option('selectedItemKeys', [this.partnerInfo.typeId]);
                }
            }
        );
    }

    toggleConfigMode() {
        this.configMode = !this.configMode;
    }

    toggleSectionVisibility(event, section) {
        event.stopPropagation();

        this.rightPanelSetting[section] = event.target.checked;
        this._cacheService.set(this.getCacheKey(
            abp.session.userId), this.rightPanelSetting);
    }

    onContactSelected(contact) {
        this.InitNavLinks(contact);
        this._contactsService.userUpdate(
            this._userService['data'].userId = contact.userId);
    }

    getAssignedUsersStoreSelectors = () => {
        if (this.customerType == ContactGroup.Partner)
            return PartnerAssignedUsersStoreSelectors;

        if (this.customerType == ContactGroup.Client)
            return CustomerAssignedUsersStoreSelectors;

        if (this.leadId || this.leadInfo)
            return LeadAssignedUsersStoreSelectors;

        return CustomerAssignedUsersStoreSelectors;
    }

    getAssignmentsPermissinKey = () => {
        if (this.customerType == ContactGroup.Partner)
            return 'Pages.CRM.Partners.ManageAssignments';

        return 'Pages.CRM.Customers.ManageAssignments';
    }

    getProxyService = () => {
        if (this.customerType == ContactGroup.Partner)
            return this._partnerService;

        if (this.customerType == ContactGroup.Client)
            return this._customerService;

        if (this.leadId || this.leadInfo)
            return this._leadService;

        return this._customerService;
    }

    addNewContact(event) {
        if (this.isUserProfile)
            return;

        let companyInfo = this.contactInfo['organizationContactInfo'];

        this._dialog.closeAll();
        this._dialog.open(CreateClientDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                isInLeadMode: this.contactInfo.statusId == ContactStatus.Prospective,
                company: companyInfo && companyInfo.fullName,
                customerType: this.customerType || ContactGroup.Client,
                refreshParent: () => {}
            }
        }).afterClosed().subscribe(() => {
            this._orgContactService.getOrganizationContactInfo(companyInfo.id).subscribe((result) => {
                this.contactInfo['organizationContactInfo'] = result;
            });
        });
        event.stopPropagation();
    }

    reloadCurrentSection() {
        let area = this._router.url.split('?').shift().split('/').pop();
        this.invalidate();
        if (area == 'lead-information') this.leadInfo = undefined;
        this._contactsService.invalidate(area);
    }

    loadOtherItem(event, position) {
        this.prevNextDataSource.filter(
            position == 'next' ? [ 'Id', '>', +this.currentItemId ] : [ 'Id', '<', +this.currentItemId ]
        );
        this.prevNextDataSource.sort(
            { selector: 'Id', desc: position != 'next' }
        );
        this.prevNextDataSource.load().then(() => {
                let items = this.prevNextDataSource.items();
                if (items) {
                    this.currentItemId = items[0].Id;
                    switch (this.referrerParams.referrer.split('/').pop()) {
                        case 'leads':
                            this._contactsService.updateLocation(items[0].CustomerId, this.currentItemId, null, items[0].OrganizationId, true);
                            break;
                        case 'clients':
                            this._contactsService.updateLocation(this.currentItemId, null, null, items[0].OrganizationId, true);
                            break;
                        case 'partners':
                            this._contactsService.updateLocation(null, null, this.currentItemId, items[0].OrganizationId, true);
                            break;
                        default:
                            break;
                    }
                }
            }
        );
    }
}
