import { Component, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    CustomersServiceProxy,
    CustomerInfoDto,
    UpdateCustomerStatusInput,
    LeadServiceProxy,
    LeadInfoDto
} from '@shared/service-proxies/service-proxies';
import { Router, ActivatedRoute, ActivationEnd } from '@angular/router';
import { MatDialog } from '@angular/material';
import { forkJoin } from 'rxjs';
import { VerificationChecklistItemType, VerificationChecklistItem, VerificationChecklistItemStatus } from '@app/crm/clients/details/verification-checklist/verification-checklist.model';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { OperationsWidgetComponent } from './operations-widget.component';
import { ClientDetailsService } from './client-details.service';
import { CacheService } from 'ng2-cache-service';

import * as _ from 'underscore';

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
    customerInfo: CustomerInfoDto;
    primaryContact: any;
    verificationChecklist: VerificationChecklistItem[];
    leadInfo: LeadInfoDto;
    leadId: number;
    leadStages = [];
    clientStageId: number;
    configMode: boolean;

    private initialData: string;

    navLinks = [
        {'label': 'Contact Information', 'route': 'contact-information'},
        {'label': 'Lead Information', 'route': 'lead-information'},
        {'label': 'Questionnaire', 'route': 'questionnaire'},
        {'label': 'Documents', 'route': 'documents'},
        {'label': 'Application Status', 'route': 'application-status', 'hiddenForLeads': true},
        {'label': 'Referral History', 'route': 'referral-history'},
        {'label': 'Payment Information', 'route': 'payment-information', 'hiddenForLeads': true},
        {'label': 'Activity Logs', 'route': 'activity-logs'},
        {'label': 'Notes', 'route': 'notes'}
    ];

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

    private readonly LOCAL_STORAGE = 0;

    constructor(injector: Injector,
                private _router: Router,
                private _dialog: MatDialog,
                private _route: ActivatedRoute,
                private _cacheService: CacheService,
                private _customerService: CustomersServiceProxy,
                private _leadService: LeadServiceProxy,
                private _pipelineService: PipelineService,
                private _clientDetailsService: ClientDetailsService) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this._cacheService = this._cacheService.useStorage(this.LOCAL_STORAGE);
        _customerService['data'] = {customerInfo: null, leadInfo: null};
        this.rootComponent = this.getRootComponent();
        this.paramsSubscribe.push(this._route.params
            .subscribe(params => {
                let clientId = params['clientId'],
                    leadId = params['leadId'];
                _customerService['data'].customerInfo = {
                    id: clientId
                };

                if (leadId) {
                    this.leadId = leadId;
                }
                this.loadData(clientId, leadId);
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

    private fillCustomerDetails(result) {
        this._customerService['data'].customerInfo = result;
        result.contactPersons.every((contact) => {
            let isPrimaryContact = (contact.id == result.primaryContactInfo.id);
            if (isPrimaryContact)
            result.primaryContactInfo = contact;
            return !isPrimaryContact;
        });

        this.primaryContact = result.primaryContactInfo;
        this.customerInfo = result;
        this.initVerificationChecklist();
    }

    private fillLeadDetails(result) {
        this._customerService['data'].leadInfo = result;
        this.initialData = JSON.stringify(this._customerService['data']);
        this.leadInfo = result;
    }

    loadData(customerId: number, leadId: number) {
        if (customerId) {
            this.startLoading(true);
            this.customerId = customerId;
            let customerInfoObservable = this._customerService.getCustomerInfo(this.customerId);
            if (leadId) {
                let leadInfoObservable = this._leadService.getLeadInfo(leadId);
                forkJoin(customerInfoObservable, leadInfoObservable).subscribe(result => {
                    this.fillCustomerDetails(result[0]);
                    this.fillLeadDetails(result[1]);
                    this.loadLeadsStages(leadId);
                    this.finishLoading(true);
                });
            } else
                customerInfoObservable.subscribe(result => {
                    this.fillCustomerDetails(result);
                    this.fillLeadDetails(result.lastLeadInfo);
                    this.finishLoading(true);
                });
        } else if (leadId) {
            this.loadLeadsStages(leadId);
        }
    }

    private loadLeadsStages(leadId) {
        this._customerService['data'].leadInfo = {
            id: leadId
        };
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

    private getCustomerName() {
        return this.customerInfo.primaryContactInfo.fullName;
    }

    private showConfirmationDialog(statusId: string) {
        this.message.confirm(
            this.l('ClientUpdateStatusWarningMessage'),
            this.l('ClientStatusUpdateConfirmationTitle'),
            isConfirmed => {
                if (isConfirmed) {
                    this.updateStatusInternal(statusId)
                        .subscribe(() => {
                            this.customerInfo.statusId = statusId;
                            this.toolbarComponent.statusComponent.listComponent.option('selectedItemKeys', [statusId]);
                            this.notify.success(this.l('StatusSuccessfullyUpdated'));
                        });
                } else {
                    this.toolbarComponent.statusComponent.listComponent.option('selectedItemKeys', [this.customerInfo.statusId]);
                }
            }
        );
    }

    private updateStatusInternal(statusId: string) {
        return this._customerService.updateCustomerStatus(new UpdateCustomerStatusInput({
            customerId: this.customerId,
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

    close() {
        this._dialog.closeAll();
        let data = JSON.stringify(this._customerService['data']);
        this._router.navigate(
            [this.referrerParams.referrer || 'app/crm/clients'],
            { queryParams: _.extend(_.mapObject(this.referrerParams,
                (val, key) => {
                    return (key == 'referrer' ? undefined : val);
                }), this.initialData != data ? {refresh: true} : {})
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
                        this._customerService['data']['deleted'] = true;
                        this.close();
                    });
                }
            }
        );
    }

    updateStatus(statusId: string) {
        this.showConfirmationDialog(statusId);
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
