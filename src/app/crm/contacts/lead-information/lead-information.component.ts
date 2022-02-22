/** Core imports */
import { Component, AfterViewInit, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { finalize, filter, takeUntil, first, debounceTime } from 'rxjs/operators';
import * as moment from 'moment-timezone';
import startCase from 'lodash/startCase';
import upperCase from 'lodash/upperCase';
import { ClipboardService } from 'ngx-clipboard';
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { ContactGroup } from '@shared/AppEnums';
import {
    ApplicationServiceProxy, LeadServiceProxy, LeadInfoDto, UpdateLeadSourceOrganizationUnitInput, InvoiceSettings,
    ContactInfoDto, ContactServiceProxy, UpdateLeadInfoInput, OrganizationUnitShortDto, UpdateLeadSourceContactInput
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { CrmStore, OrganizationUnitsStoreActions, OrganizationUnitsStoreSelectors } from '@app/crm/store';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';
import { OrganizationUnitsDialogComponent } from '@shared/common/organization-units-tree/organization-units-dialog/organization-units-dialog.component';
import { InplaceEditModel } from '@app/shared/common/inplace-edit/inplace-edit.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { PermissionCheckerService } from 'abp-ng2-module';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { SourceContact } from '@shared/common/source-contact-list/source-contact.interface';
import { LayoutSection } from '@app/crm/contacts/lead-information/layout-section.interface';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { OrganizationUnitsDialogData } from '@shared/common/organization-units-tree/organization-units-dialog/organization-units-dialog-data.interface';

@Component({
    selector: 'lead-information',
    templateUrl: './lead-information.component.html',
    styleUrls: ['./lead-information.component.less'],
    providers: [ ApplicationServiceProxy, LifecycleSubjectsService, CurrencyPipe ]
})
export class LeadInformationComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(SourceContactListComponent) sourceComponent: SourceContactListComponent;
    @ViewChild(ActionMenuComponent) actionMenu: ActionMenuComponent;
    @ViewChild('loaderWrapper') loaderWrapper: ElementRef;

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
    private readonly ident = 'LeadInformation';
    public invoiceSettings: InvoiceSettings = new InvoiceSettings();

    urlHelper = UrlHelper;
    isCGManageAllowed = false;
    isEditAllowed = false;
    startCase = startCase;
    upperCase = upperCase;

    stages: any[];
    types: any[];
    sources: any[];
    sourceContacts: SourceContact[] = [];
    sourceContactName: string;
    layoutColumns: LayoutSection[][] = [
        [
            {
                name: 'Status',
                icon: 'c-info',
                items: [
                    { name: 'stage', readonly: true },
                    { name: 'dealAmount', type: { useGrouping: true } },
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
            },
            {
                name: 'Comments',
                icon: 'f-chat',
                items: [
                    { name: 'comments', hideLabel: true, readonly: true, wide: true }
                ]
            }
        ],
        [
            {
                name: 'Source',
                icon: 'c-info',
                items: [
                    { name: 'affiliateCode', lname: 'LeadInformation_SourceAffiliateCode' },
                    { name: 'contact', lname: 'ReferredByPerson' },
                    { name: 'campaignCode' },
                    { name: 'channelCode' },
                    { name: 'importFileName', lname: 'FileName', readonly: true, hideEmpty: true }
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
    ];
    capitalize = capitalize;

    constructor(
        private dialog: MatDialog,
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
        contactsService.orgUnitsSaveSubscribe((data) => {
            let orgUnitId = data.length ? data[0] : undefined;
            if (orgUnitId && orgUnitId != this.data.leadInfo.sourceOrganizationUnitId) {
                this.data.leadInfo.sourceOrganizationUnitId = orgUnitId;
                leadService.updateSourceOrganizationUnit(new UpdateLeadSourceOrganizationUnitInput({
                    leadId: this.data.leadInfo.id,
                    sourceOrganizationUnitId: orgUnitId
                })).subscribe(() => {
                    this.notifyService.info(this.ls.l('SavedSuccessfully'));
                    this.contactsService.orgUnitsUpdate({
                        allOrganizationUnits: this.organizationUnits,
                        selectedOrgUnits: [orgUnitId]
                    });
                });
            }
        }, this.ident);
    }

    ngOnInit() {
        this.contactsService.leadInfoSubscribe(leadInfo => {
            if (this.data.leadInfo = leadInfo) {
                this.isCGManageAllowed = this.permissionService.checkCGPermission([leadInfo.contactGroupId]);
                this.sourceContactName = leadInfo.sourceContactName || `<${this.ls.l('ClientNoName')}>`;
            }
        }, this.ident);
        this.contactsService.contactInfoSubscribe((contactInfo: ContactInfoDto) => {
            if (contactInfo) {
                this.data.contactInfo = contactInfo;
                this.initToolbarInfo();
                this.showApplicationAllowed = this.permissionCheckerService.isGranted(AppPermissions.PFMApplicationsViewApplications) &&
                    contactInfo.personContactInfo.userId && contactInfo.groups.some(group => group.groupId == ContactGroup.Client);
                this.loadOrganizationUnits();
            }
        }, this.ident);

        this.invoicesService.settings$.pipe(
            filter(Boolean), first()
        ).subscribe((settings: InvoiceSettings) => {
            this.invoiceSettings = settings;
            this.layoutColumns[0][0].items.some(item => {
                if (item.type && item.type.style == 'currency') {
                    item.type.currency = settings.currency;
                    return true;
                }
            });
        });
    }

    ngAfterViewInit() {
        this.contactsService.settingsDialogOpened$.pipe(
            takeUntil(this.lifeCycleService.destroy$),
            debounceTime(300)
        ).subscribe(opened => {
            this.toggleOrgUnitsDialog(opened);
        });
    }

    initToolbarInfo() {
        setTimeout(() => this.contactsService.toolbarUpdate({
            optionButton: {
                name: 'options',
                options: { checkPressed: () => this.contactsService.settingsDialogOpened.value },
                action: () => this.contactsService.toggleSettingsDialog()
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
            value: this.getPropValue(field, !this.hasFieldMoneyType(field)),
            displayValue: this.getPropValue(field),
            isEditDialogEnabled: false,
            lEntityName: field,
            editPlaceholder: this.ls.l('EditValuePlaceholder')
        };
    }

    getPropValue(field, format = true) {
        let leadInfo = this.data && this.data.leadInfo;
        let value = leadInfo && leadInfo[field];

        if (!value && isNaN(value))
            return null;

        return format ? this.formatFieldValue(field, value) : value;
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
        } else if (this.hasFieldMoneyType(field))
            return this.currencyPipe.transform(value, this.invoiceSettings.currency);
        else if (field == 'ssn')
            return [value.slice(0, 3), value.slice(3, 5), value.slice(5, 9)].filter(Boolean).join('-');
        else
            return value;
    }

    hasFieldMoneyType(field) {
        return field == 'netMonthlyIncome'
            || field.toLowerCase().indexOf('amount') >= 0;
    }

    onSourceContactLoaded(contacts: SourceContact[]) {
        this.sourceContacts = contacts;
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

    toggleOrgUnitsDialog(open: boolean = true): void {
        let dialog = this.dialog.getDialogById('lead-organization-units-dialog');
        if (!dialog) {
            if (open) {
                const dialogData: OrganizationUnitsDialogData = {
                    title: this.ls.l('Toolbar_ReferredBy') + ' ' + this.ls.l('ReferredByOrgUnit'),
                    selectionMode: 'single'
                };
                this.dialog.open(OrganizationUnitsDialogComponent, {
                    id: 'lead-organization-units-dialog',
                    panelClass: ['slider'],
                    hasBackdrop: false,
                    closeOnNavigation: true,
                    data: dialogData
                }).afterClosed().subscribe(
                    () => this.contactsService.closeSettingsDialog()
                );
            }
        } else if (!open)
            dialog.close();
    }

    saveToClipboard(event, value: string) {
        event.preventDefault();
        event.stopPropagation();
        this.clipboardService.copyFromContent(value);
        this.notifyService.info(this.ls.l('SavedToClipboard'));
    }

    openSourceContactList() {
        if (this.isCGManageAllowed) {
            this.sourceComponent.leadId = this.data &&
                this.data.leadInfo && this.data.leadInfo.id;
            this.sourceComponent.toggle();
        }
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
        this.lifeCycleService.destroy.next();
    }
}