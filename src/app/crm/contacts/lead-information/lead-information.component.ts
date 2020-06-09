/** Core imports */
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, filter, takeUntil, first, skip } from 'rxjs/operators';
import * as moment from 'moment-timezone';
import startCase from 'lodash/startCase';
import upperCase from 'lodash/upperCase';
import { ClipboardService } from 'ngx-clipboard';
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { ContactGroup } from '@shared/AppEnums';
import { ActivatedRoute } from '@angular/router';
import {
    ApplicationServiceProxy, LeadServiceProxy, LeadInfoDto, UpdateLeadSourceOrganizationUnitInput, InvoiceSettings,
    ContactInfoDto, ContactServiceProxy, UpdateLeadInfoInput, OrganizationUnitShortDto, UpdateLeadSourceContactInput
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { CrmStore, OrganizationUnitsStoreActions, OrganizationUnitsStoreSelectors } from '@app/crm/store';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';
import { OrganizationUnitsDialogComponent } from '../organization-units-tree/organization-units-dialog/organization-units-dialog.component';
import { InplaceEditModel } from '@app/shared/common/inplace-edit/inplace-edit.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';

@Component({
    selector: 'lead-information',
    templateUrl: './lead-information.component.html',
    styleUrls: ['./lead-information.component.less'],
    providers: [ ApplicationServiceProxy, LifecycleSubjectsService, CurrencyPipe ]
})
export class LeadInformationComponent implements OnInit, OnDestroy {
    @ViewChild(SourceContactListComponent, { static: false }) sourceComponent: SourceContactListComponent;
    @ViewChild('loaderWrapper', { static: false }) loaderWrapper: ElementRef;
    data = {
        contactInfo: new ContactInfoDto(),
        leadInfo: new LeadInfoDto()
    };
    application: any;
    showApplicationAllowed = false;
    set selectedTabIndex(val: number) {
        if (this._selectedTabIndex = val)
            this.application || this.loadApplication();
    }
    get selectedTabIndex(): number {
        return this._selectedTabIndex;
    }

    private formatting = AppConsts.formatting;
    private _selectedTabIndex = 0;
    private readonly APP_TAB_INDEX = 1;
    private organizationUnits: any;
    private invoiceSettings: InvoiceSettings = new InvoiceSettings();

    private readonly ident = 'LeadInformation';

    isCGManageAllowed = false;
    isEditAllowed = false;
    startCase = startCase;
    upperCase = upperCase;

    stages: any[];
    types: any[];
    sources: any[];
    sourceContacts = [];
    sourceContactName: string;
    layoutColumns: any[] = [
        {
            sections: [
                {
                    name: 'Status',
                    icon: 'c-info',
                    items: [
                        { name: 'stage', readonly: true },
                        { name: 'amount', readonly: true },
                        { name: 'creationDate', readonly: true },
                        { name: 'modificationDate', readonly: true }
                    ]
                },
/*
                {
                    name: 'LeadSource',
                    icon: 'goal',
                    items: [ { name: 'sourceCode' } ]
                },
*/
                {
                    name: 'CustomFields',
                    icon: 'single-content',
                    items: [
                        { name: 'customField1', lname: 'Request_CustomField1', readonly: true },
                        { name: 'customField2', lname: 'Request_CustomField2', readonly: true },
                        { name: 'customField3', lname: 'Request_CustomField3', readonly: true },
                        { name: 'customField4', lname: 'Request_CustomField4', readonly: true },
                        { name: 'customField5', lname: 'Request_CustomField5', readonly: true }
                    ]
                }
            ]
        },
        {
            sections: [
                {
                    name: 'Source',
                    icon: 'c-info',
                    items: [
                        { name: 'campaignCode' },
                        { name: 'affiliateCode', lname: 'SourceAffiliateCode' },
                        { name: 'contact', lname: 'SourceContact' },
                        { name: 'channelCode' }
                    ]
                },
                {
                    name: 'TrackingInfo',
                    icon: 'single-content',
                    items: [
                        { name: 'applicantId', readonly: true, action: this.showApplications.bind(this) },
                        { name: 'applicationId', readonly: true, action: this.showApplications.bind(this) },
                        { name: 'clickId', readonly: true },
                        { name: 'siteId', readonly: true },
                        { name: 'siteUrl', readonly: true, wide: true },
                        { name: 'refererUrl', readonly: true, wide: true },
                        { name: 'entryUrl', readonly: true, wide: true },
                        { name: 'clientIp', readonly: true },
                        { name: 'userAgent', readonly: true, wide: true },
                    ]
                }
            ]
        }, {
            sections: [
                {
                    name: 'Comments',
                    icon: 'f-chat',
                    items: [ { name: 'comments', hideLabel: true } ]
                }
            ]
        }
    ];
    capitalize = capitalize;

    constructor(
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private invoicesService: InvoicesService,
        private contactProxy: ContactServiceProxy,
        private leadService: LeadServiceProxy,
        private contactsService: ContactsService,
        private clipboardService: ClipboardService,
        private applicationProxy: ApplicationServiceProxy,
        private store$: Store<CrmStore.State>,
        private lifeCycleService: LifecycleSubjectsService,
        private notifyService: NotifyService,
        private loadingService: LoadingService,
        private permissionCheckerService: PermissionCheckerService,
        private currencyPipe: CurrencyPipe,
        private permissionService: AppPermissionService,
        public ls: AppLocalizationService
    ) {
        this.contactsService.loadLeadInfo();
        contactsService.orgUnitsSaveSubscribe((data) => {
            let orgUnitId = data.length ? data[0] : undefined;
            if (orgUnitId && orgUnitId != this.data.leadInfo.sourceOrganizationUnitId) {
                this.data.leadInfo.sourceOrganizationUnitId = orgUnitId;
                leadService.updateSourceOrganizationUnit(new UpdateLeadSourceOrganizationUnitInput({
                    leadId: this.data.leadInfo.id,
                    sourceOrganizationUnitId: orgUnitId
                })).subscribe(() =>
                    this.notifyService.info(this.ls.l('SavedSuccessfully'))
                );
            }
        }, this.ident);
    }

    ngOnInit() {
        this.contactsService.leadInfoSubscribe(leadInfo => {
            this.data.leadInfo = leadInfo;
            this.updateSourceContactName();
        }, this.ident);
        this.contactsService.contactInfoSubscribe(contactInfo => {
            this.data.contactInfo = contactInfo;
            this.initToolbarInfo();
            if (this.contactsService.settingsDialogOpened.value)
                this.toggleOrgUnitsDialog(false);
            this.isCGManageAllowed = this.permissionService.checkCGPermission(contactInfo.groupId);
            this.showApplicationAllowed = this.permissionCheckerService.isGranted(AppPermissions.PFMApplicationsViewApplications) &&
                contactInfo.personContactInfo.userId && contactInfo.groupId == ContactGroup.Client;
            this.updateSourceContactName();
            this.loadOrganizationUnits();
        }, this.ident);
        this.invoicesService.settings$.pipe(first()).subscribe(settings => {
            this.invoiceSettings = settings;
        });
    }

    initToolbarInfo() {
        setTimeout(() => this.contactsService.toolbarUpdate({
            optionButton: {
                name: 'options',
                options: { checkPressed: () => this.contactsService.settingsDialogOpened.value },
                action: this.toggleOrgUnitsDialog.bind(this)
            }
        }));
    }

    private loadOrganizationUnits() {
        this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(false));
        this.store$.pipe(
            select(OrganizationUnitsStoreSelectors.getOrganizationUnits),
            takeUntil(this.lifeCycleService.destroy$),
            filter(Boolean)
        ).subscribe((organizationUnits: OrganizationUnitShortDto[]) => {
            this.organizationUnits = organizationUnits;
            this.contactsService.leadInfoSubscribe(leadInfo => {
                this.isEditAllowed = leadInfo && leadInfo.id && this.isCGManageAllowed;
                this.contactsService.orgUnitsUpdate({
                    allOrganizationUnits: leadInfo ? organizationUnits : [],
                    selectedOrgUnits: leadInfo ? [organizationUnits.find((organizationUnit: OrganizationUnitShortDto) => {
                        return organizationUnit.id === (leadInfo.sourceOrganizationUnitId || this.data.leadInfo.sourceOrganizationUnitId);
                    })].filter(Boolean).map(item => item.id) : []
                });
            }, this.ident);
        });
    }

    loadApplication() {
        this.loadingService.startLoading(this.loaderWrapper.nativeElement);
        this.applicationProxy.getInitialMemberApplication(
            this.data.contactInfo.personContactInfo.userId,
            this.data.leadInfo.applicationId
        ).pipe(
            finalize(() => this.loadingService.finishLoading(this.loaderWrapper.nativeElement))
        ).subscribe((response) => {
            this.application = response;
        });
    }

    showApplications() {
        this.selectedTabIndex = this.APP_TAB_INDEX;
    }

    getPropData(item): InplaceEditModel {
        if (item.data)
            return item.data;

        let field = item.name;
        return {
            id: (this.data && this.data.leadInfo) ? this.data.leadInfo.id : null,
            value: this.getPropValue(field),
            isEditDialogEnabled: false,
            lEntityName: field,
            editPlaceholder: this.ls.l('EditValuePlaceholder')
        };
    }

    getPropValue(field) {
        let leadInfo = this.data && this.data.leadInfo;
        let value = leadInfo && leadInfo[field];
        if (!value && isNaN(value))
            return null;

        return this.formatFieldValue(field, value);
    }

    updateValue(value, item) {
        let fieldName = item.name;
        const initialValue = this.data.leadInfo[fieldName];
        this.data.leadInfo[fieldName] = value;
        this.leadService.updateLeadInfo(
            UpdateLeadInfoInput.fromJS(this.data.leadInfo)
        ).subscribe(
            () => {},
            () => this.data.leadInfo[fieldName] = initialValue
        );
    }

    getObjectKeys(obj) {
        return obj && Object.keys(obj);
    }

    formatFieldValue(field, value) {
        if (value instanceof moment) {
            if (['doB', 'payNextDate', 'payAfterNextDate'].indexOf(field) >= 0)
                return value.utc().format(this.formatting.fieldDate);
            else
                return value.format(this.formatting.fieldDateTime);
        } else if (field == 'netMonthlyIncome' || field.toLowerCase().indexOf('amount') >= 0)
            return this.currencyPipe.transform(value, this.invoiceSettings.currency);
        else if (field == 'ssn')
            return [value.slice(0, 3), value.slice(3, 5), value.slice(5, 9)].filter(Boolean).join('-');
        else
            return value;
    }

    updateSourceContactName() {
        let contact = this.sourceContacts.find(item =>
            item.id == (this.data && this.data.leadInfo && this.data.leadInfo.sourceContactId));
        this.sourceContactName = contact && contact.name;
    }

    onSourceContactLoaded(contacts) {
        this.sourceContacts = contacts;
        this.updateSourceContactName();
    }

    onSourceContactChanged(event) {
        if (this.data.leadInfo.sourceContactId == event.id)
            event = {id: undefined, name: undefined};

        let prevName = this.sourceContactName;
        this.sourceContactName = event.name;
        this.leadService.updateSourceContact(
            new UpdateLeadSourceContactInput({
                leadId: this.data.leadInfo.id,
                sourceContactId: event.id
            })
        ).subscribe((response) => {
            this.contactsService.orgUnitsUpdate({
                allOrganizationUnits: this.organizationUnits,
                selectedOrgUnits: [response.newSourceOrganizationUnitId]
            });

            this.data.leadInfo.sourceContactId = event.id;
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
        }, () => {
            this.sourceContactName = prevName;
            this.notifyService.error(this.ls.l('AnErrorOccurred'));
        });
        this.sourceComponent.toggle();
    }

    toggleOrgUnitsDialog(closeIfExists = true): void {
        setTimeout(() => {
            if (!this.dialog.getDialogById('lead-organization-units-dialog')) {
                this.dialog.open(OrganizationUnitsDialogComponent, {
                    id: 'lead-organization-units-dialog',
                    panelClass: ['slider'],
                    hasBackdrop: false,
                    closeOnNavigation: true,
                    data: {
                        title: this.ls.l('Owner'),
                        selectionMode: 'single'
                    }
                }).afterClosed().pipe(filter(Boolean)).subscribe(() => {
                    this.contactsService.closeSettingsDialog();
                });
                this.contactsService.openSettingsDialog();
            } else if(closeIfExists) {
                this.contactsService.closeSettingsDialog();
            }
        });
    }

    saveToClipboard(event, value: string) {
        event.preventDefault();
        event.stopPropagation();
        this.clipboardService.copyFromContent(value);
        this.notifyService.info(this.ls.l('SavedToClipboard'));
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
        this.lifeCycleService.destroy.next();
    }
}
