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
import { CrmStoreState, PartnerTypesStoreSelectors } from '@app/crm/shared/store';
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
    UpdatePartnerTypeInput
} from '@shared/service-proxies/service-proxies';
import { VerificationChecklistItemType, VerificationChecklistItem, VerificationChecklistItemStatus } from '@app/crm/clients/details/verification-checklist/verification-checklist.model';
import { OperationsWidgetComponent } from './operations-widget.component';
import { ClientDetailsService } from './client-details.service';


@Component({
    selector: 'client-details',
    templateUrl: './client-details.component.html',
    styleUrls: ['./client-details.component.less'],
    host: {
        '(document:click)': 'closeEditDialogs($event)'
    }
})
export class ClientDetailsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(OperationsWidgetComponent) toolbarComponent: OperationsWidgetComponent;

    customerId: number;
    customerType: string;
    customerInfo: ContactGroupInfoDto;
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
        clientScores: true,
        totalApproved: true,
        verification: true,
        opened: true
    };

    private rootComponent: any;
    private paramsSubscribe: any = [];
    private referrerParams;
    private pipelinePurposeId: string = AppConsts.PipelinePurposeIds.lead;

    constructor(injector: Injector,
                private _router: Router,
                private _dialog: MatDialog,
                private _route: ActivatedRoute,
                private _cacheService: CacheService,
                private _contactGroupService: ContactGroupServiceProxy,
                private _partnerService: PartnerServiceProxy,
                private _leadService: LeadServiceProxy,
                private _pipelineService: PipelineService,
                private _clientDetailsService: ClientDetailsService,
                private store$: Store<CrmStoreState.CrmState>) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this._cacheService = this._cacheService.useStorage(AppConsts.CACHE_TYPE_LOCAL_STORAGE);
        _contactGroupService['data'] = {
            customerInfo: null,
            leadInfo: null,
            partnerInfo: null
        };
        this.rootComponent = this.getRootComponent();
        this.paramsSubscribe.push(this._route.params
            .subscribe(params => {
                let clientId = params['clientId'],
                    partnerId = params['partnerId'],
                    customerId = clientId || partnerId,
                    leadId = params['leadId'];
                _contactGroupService['data'].customerInfo = {
                    id: customerId
                };

                if (leadId) {
                    this.leadId = leadId;
                }
                this.loadData(customerId, leadId, partnerId);
                this.InitNavLinks();
            }));

        this.paramsSubscribe.push(this._route.queryParams
            .subscribe(params => {
                this.referrerParams = params;
        }));
        _clientDetailsService.verificationSubscribe(
            this.initVerificationChecklist.bind(this)
        );
        let optionTimeout = null;
        this._router.events.subscribe((event) => {
            if (event instanceof ActivationEnd && !optionTimeout)
                optionTimeout = setTimeout(() => {
                    optionTimeout = null;
                    let data = event.snapshot.data;
                    this.rightPanelSetting.opened = data.hasOwnProperty(
                        'rightPanelOpened') ? data.rightPanelOpened : true;
                });
        });
    }

    private InitNavLinks() {
        this.navLinks = [
            {'label': 'Contact Information', 'route': 'contact-information'},
            {'label': 'Lead Information', 'route': 'lead-information', 'hidden': this.customerType == ContactGroupType.Partner},
            {'label': 'Questionnaire', 'route': 'questionnaire'},
            {'label': 'Documents', 'route': 'documents'},
            {'label': 'Application Status', 'route': 'application-status', 'hidden': !!this.leadId},
            {'label': 'Referral History', 'route': 'referral-history'},
            {'label': 'Payment Information', 'route': 'payment-information', 'hidden': !!this.leadId},
            {'label': 'Activity Logs', 'route': 'activity-logs'},
            {'label': 'Notes', 'route': 'notes'}
        ];
    }

    private fillCustomerDetails(result) {
        this._contactGroupService['data'].customerInfo = result;
        result.contactPersons.every((contact) => {
            let isPrimaryContact = (contact.id == result.primaryContactInfo.id);
            if (isPrimaryContact)
            result.primaryContactInfo = contact;
            return !isPrimaryContact;
        });

        this.ratingId = result.ratingId;
        this.primaryContact = result.primaryContactInfo;
        this.customerInfo = result;
        this.initVerificationChecklist();
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

    loadData(customerId: number, leadId: number, partnerId: number) {
        if (customerId) {
            this.startLoading(true);
            this.customerId = customerId;
            let customerInfo$ = this._contactGroupService.getContactGroupInfo(this.customerId);
            if (leadId) {
                let leadData, leadInfo$ = this._leadService.getLeadInfo(leadId);
                forkJoin(customerInfo$, leadInfo$).pipe(finalize(() => {
                    this.finishLoading(true);
                    if (!leadData)
                        this.close(true);
                })).subscribe(result => {
                    leadData = result;
                    this.fillCustomerDetails(result[0]);
                    this.fillLeadDetails(result[1]);
                    this.loadLeadsStages();
                });
            } else {
                this.customerType = partnerId ? ContactGroupType.Partner : ContactGroupType.Client;
                if (this.customerType == ContactGroupType.Partner) {
                    let partnerInfo$ = this._partnerService.get(partnerId);
                    forkJoin(customerInfo$, partnerInfo$).pipe(finalize(() => {
                        this.finishLoading(true);
                        if (!this.partnerInfo)
                            this.close(true);
                    })).subscribe(result => {
                        this.fillCustomerDetails(result[0]);
                        this.fillPartnerDetails(result[1]);
                        this.loadPartnerTypes();
                    });
                } else {
                    let lastLeadInfo$ = this._leadService.getLast(customerId);
                    forkJoin(customerInfo$, lastLeadInfo$).pipe(finalize(() => {
                        this.finishLoading(true);
                        if (!this.customerInfo)
                            this.close(true);
                    })).subscribe(result => {
                        this.fillCustomerDetails(result[0]);
                        this.fillLeadDetails(result[1]);
                    });
                }
            }
        } else if (leadId) {
            this._contactGroupService['data'].leadInfo = {
                id: leadId
            };
            this.loadLeadsStages();
        }
    }

    private loadLeadsStages() {
        this._pipelineService.getPipelineDefinitionObservable(this.pipelinePurposeId)
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
        return this.customerInfo.primaryContactInfo.fullName;
    }

    private showConfirmationDialog(status) {
        this.message.confirm(
            this.l('ClientUpdateStatusWarningMessage'),
            this.l('ClientStatusUpdateConfirmationTitle'),
            isConfirmed => {
                if (isConfirmed) {
                    this.updateStatusInternal(status.id)
                        .subscribe(() => {
                            this.customerInfo.statusId = status.id;
                            this.toolbarComponent.statusComponent.listComponent.option('selectedItemKeys', [status.id]);
                            this.notify.success(this.l('StatusSuccessfullyUpdated'));
                        });
                } else {
                    this.toolbarComponent.statusComponent.listComponent.option('selectedItemKeys', [this.customerInfo.statusId]);
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

    delete() {
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
        let contactDetails = this.primaryContact.details;
        this.verificationChecklist = [
            this.getVerificationChecklistItem(
                VerificationChecklistItemType.Identity,
                this.primaryContact.person.identityConfirmationDate
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
}
