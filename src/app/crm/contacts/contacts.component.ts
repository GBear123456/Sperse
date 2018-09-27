/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ActivationEnd } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { CacheService } from 'ng2-cache-service';
import { Store, select } from '@ngrx/store';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { AppStore, PartnerTypesStoreSelectors, PartnerAssignedUsersStoreSelectors, LeadAssignedUsersStoreSelectors, CustomerAssignedUsersStoreSelectors } from '@app/store';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroupType } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactGroupServiceProxy,
    ContactGroupInfoDto,
    UpdateContactGroupStatusInput,
    LeadServiceProxy,
    LeadInfoDto,
    PartnerServiceProxy,
    PartnerInfoDto,
    UpdatePartnerTypeInput,
    UserServiceProxy
} from '@shared/service-proxies/service-proxies';
import { VerificationChecklistItemType, VerificationChecklistItem, VerificationChecklistItemStatus } from './verification-checklist/verification-checklist.model';
import { OperationsWidgetComponent } from './operations-widget.component';
import { ContactsService } from './contacts.service';

import { RP_DEFAULT_ID, RP_USER_INFO_ID } from './contacts.const';

@Component({
    templateUrl: './contacts.component.html',
    styleUrls: ['./contacts.component.less'],
    host: {
        '(document:click)': 'closeEditDialogs($event)'
    }
})
export class ContactsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(OperationsWidgetComponent) toolbarComponent: OperationsWidgetComponent;

    readonly RP_DEFAULT_ID = RP_DEFAULT_ID;
    readonly RP_USER_INFO_ID = RP_USER_INFO_ID;

    customerId: number;
    customerType: string;
    contactInfo: ContactGroupInfoDto;
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

    private initialData: string;

    navLinks = [];

    rightPanelSetting: any = {
        id: RP_DEFAULT_ID,
        clientScores: true,
        totalApproved: true,
        verification: true,
        opened: true
    };

    private params: any;
    private rootComponent: any;
    private paramsSubscribe: any = [];
    private referrerParams;

    constructor(injector: Injector,
                private _router: Router,
                private _dialog: MatDialog,
                private _route: ActivatedRoute,
                private _cacheService: CacheService,
                private _userService: UserServiceProxy,
                private _contactGroupService: ContactGroupServiceProxy,
                private _partnerService: PartnerServiceProxy,
                private _leadService: LeadServiceProxy,
                private _pipelineService: PipelineService,
                private _contactsService: ContactsService,
                private store$: Store<AppStore.State>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this._cacheService = this._cacheService.useStorage(AppConsts.CACHE_TYPE_LOCAL_STORAGE);
        _contactGroupService['data'] = {
            contactInfo: null,
            leadInfo: null,
            partnerInfo: null
        };
        this.rootComponent = this.getRootComponent();
        this.paramsSubscribe.push(this._route.params
            .subscribe(params => this.loadData(params)));

        this.paramsSubscribe.push(this._route.queryParams
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
                    let data = event.snapshot.data;
                    this.rightPanelSetting.id = this.getCheckPropertyValue(data, 'rightPanelId', RP_DEFAULT_ID);
                    this.rightPanelSetting.opened = this.getCheckPropertyValue(data, 'rightPanelOpened',
                        this.rightPanelSetting.id != RP_USER_INFO_ID || this._userService['data'].userId);
                });
        });
        _contactsService.userSubscribe((userId) => {
            if (this.rightPanelSetting.id == RP_USER_INFO_ID)
                this.rightPanelSetting.opened = Boolean(userId);
        });
        _contactsService.invalidateSubscribe(() => this.invalidate());
        _contactsService.loadLeadInfoSubscribe(() => this.loadLeadData());
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
                    'Pages.Administration.Users': 'Pages.Administration.Users.Create'),
                route: 'user-information'
            },
            {label: 'Lead Information', route: 'lead-information', hidden: this.customerType == ContactGroupType.Partner},
            {label: 'Questionnaire', route: 'questionnaire'},
            {label: 'Documents', route: 'documents'},
            {label: 'Application Status', route: 'application-status', hidden: !!this.leadId},
            {label: 'Referral History', route: 'referral-history'},
            {label: 'Subscriptions', route: 'subscriptions', hidden: !this.isClientDetailPage()},
            {label: 'Payment Information', route: 'payment-information', hidden: !this.isClientDetailPage()},
            {label: 'Activity Logs', route: 'activity-logs'},
            {label: 'Notes', route: 'notes'}
        ];
    }

    isClientDetailPage() {
        return this.customerType !== ContactGroupType.Partner && !this.partnerTypeId && !this.leadId;
    }

    private fillContactDetails(result, primaryContactId = null) {
        this._contactGroupService['data'].contactInfo = result;
        primaryContactId = primaryContactId || result.primaryContactInfo.id;
        result.contactPersons.every((contact) => {
            let isPrimaryContact = (contact.id == primaryContactId);
            if (isPrimaryContact)
                result.primaryContactInfo = contact;
            return !isPrimaryContact;
        });

        this.ratingId = result.ratingId;
        this.primaryContact = result.primaryContactInfo;
        this.contactInfo = result;
        this.initVerificationChecklist();

        this._contactsService.userUpdate(
            this._userService['data'].userId = this.primaryContact.userId
        );
        this.InitNavLinks(this.primaryContact);
    }

    private fillLeadDetails(result) {
        this._contactGroupService['data'].leadInfo = result;
        this.initialData = JSON.stringify(this._contactGroupService['data']);
        this.leadInfo = result;
    }

    private fillPartnerDetails(result) {
        this._contactGroupService['data'].partnerInfo = result;
        this.partnerInfo = result;
        this.partnerTypeId = result.typeId;
    }

    invalidate() {
        this.loadData(this.params);
    }

    loadData(params) {
        let userId = params['userId'],
            clientId = params['clientId'],
            partnerId = params['partnerId'],
            customerId = clientId || partnerId,
            leadId = params['leadId'];
  
        this.params = params;
        this._userService['data'] = {
            userId: userId, user: null, roles: null
        };
        this._contactGroupService['data'].contactInfo = {
            id: customerId
        };
        this._contactGroupService['data'].leadInfo = {
            id: leadId
        };

        if (userId)
            this.loadDataForUser(userId);
        else 
            this.loadDataForClient(customerId,
                this.leadId = leadId, partnerId);
    }

    loadDataForUser(userId) {
        this._contactGroupService.getContactGroupForUser(userId).subscribe((res) => {
            this.fillContactDetails(res.contactGroupInfo, res.userContactId);
        });
    }

    loadDataForClient(customerId: number, leadId: number, partnerId: number) {
        if (customerId) {
            this.startLoading(true);
            let contactInfo$ = this._contactGroupService
                .getContactGroupInfo(this.customerId = customerId);

            this.customerType = partnerId ? ContactGroupType.Partner : ContactGroupType.Client;
            if (this.customerType == ContactGroupType.Partner) {
                let partnerInfo$ = this._partnerService.get(partnerId);
                forkJoin(contactInfo$, partnerInfo$).pipe(finalize(() => {
                    this.finishLoading(true);
                    if (!this.partnerInfo)
                        this.close(true);
                })).subscribe(result => {
                    this.fillContactDetails(result[0]);
                    this.fillPartnerDetails(result[1]);
                    this.loadPartnerTypes();
                });
            } else {
                contactInfo$.pipe(finalize(() => {
                    this.finishLoading(true);
                    if (!this.contactInfo)
                        this.close(true);
                })).subscribe(result => {
                    this.fillContactDetails(result);
                });
            }
        } 
    }

    loadLeadData() {
        if (!this.leadInfo) {
            this.startLoading(true);
            let leadId = this._contactGroupService['data'].leadInfo.id,
                leadInfo$ = leadId ? this._leadService.getLeadInfo(leadId): 
                    this._leadService.getLast(this.customerId);
            
            leadInfo$.pipe(finalize(() => {
                this.finishLoading(true);
            })).subscribe(result => {
                this.fillLeadDetails(result);            
                this.loadLeadsStages();
            });
        }
    }

    private loadLeadsStages() {
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
                this.clientStageId = this.leadStages.find(stage => stage.name === this.leadInfo.stage).id;
            });
    }

    private loadPartnerTypes() {
        this.store$.pipe(select(PartnerTypesStoreSelectors.getPartnerTypes)).subscribe(
            (partnerTypes: any) => {
                this.partnerTypes = partnerTypes && partnerTypes.length ?
                                    partnerTypes.map(type => {
                                        type['action'] = this.updatePartnerType.bind(this);
                                        return type;
                                    }) :
                                    [];
            }
        );
    }

    private getCustomerName() {
        return this.contactInfo.primaryContactInfo.fullName;
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
        return this._contactGroupService.updateContactGroupStatus(new UpdateContactGroupStatusInput({
            contactGroupId: this.customerId,
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

    close(force = false) {
        this._dialog.closeAll();
        let data = force || JSON.stringify(this._contactGroupService['data']);
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
            !event.target.closest('.mat-dialog-container, .dx-popup-wrapper')
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

    ngOnInit() {
        this.rootComponent.overflowHidden(true);
        this.rootComponent.pageHeaderFixed();

        let key = this.getCacheKey(abp.session.userId);
        if (this._cacheService.exists(key))
            this.rightPanelSetting = this._cacheService.get(key);
    }

    ngOnDestroy() {
        this._dialog.closeAll();
        this.paramsSubscribe.forEach((sub) => sub.unsubscribe());
        this.rootComponent.overflowHidden();
        this.rootComponent.pageHeaderFixed(true);
    }

    deleteLead() {
        this.message.confirm(
            this.l('LeadDeleteWarningMessage', this.getCustomerName()),
            isConfirmed => {
                if (isConfirmed) {
                    this._leadService.deleteLead(this.leadId).subscribe(() => {
                        this.notify.success(this.l('SuccessfullyDeleted'));
                        this._contactGroupService['data']['deleted'] = true;
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
            this.clientStageId = this.leadStages.find(stage => stage.name === this.leadInfo.stage).id;
            this.toolbarComponent.stagesComponent.listComponent.option('selectedItemKeys', [this.clientStageId]);
        };
        if (this._pipelineService.updateLeadStage(this.leadInfo, sourceStage, targetStage, complete))
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

    getAssignedUsersStoreSelectors() {
        debugger
        if (this.leadId || this.leadInfo)
            return LeadAssignedUsersStoreSelectors.getAssignedUsers;

        if(this.customerType == ContactGroupType.Partner)
            return PartnerAssignedUsersStoreSelectors.getAssignedUsers;

        if (this.customerType == ContactGroupType.Client)
            return CustomerAssignedUsersStoreSelectors.getAssignedUsers;
    }

    getChangeAssignUser() {
        debugger
        if (this.leadId || this.leadInfo)
            return {
                'assignContactGroups': this._leadService.assignContactGroups.bind(this._partnerService),
                'assignContactGroup': this._leadService.assignContactGroup.bind(this._partnerService)
            };

        if (this.customerType == ContactGroupType.Partner)
            return {
                'assignContactGroups': this._partnerService.assignContactGroups.bind(this._partnerService),
                'assignContactGroup': this._partnerService.assignContactGroup.bind(this._partnerService)
            };

        if (this.customerType == ContactGroupType.Client)
            return {
                'assignContactGroups': this._contactGroupService.assignContactGroups.bind(this._partnerService),
                'assignContactGroup': this._contactGroupService.assignContactGroup.bind(this._partnerService)
            };
    }
}
