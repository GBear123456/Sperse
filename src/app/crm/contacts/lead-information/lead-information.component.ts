/** Core imports */
import { Component, OnInit, Injector, ViewChild, ElementRef, OnDestroy } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { finalize, filter, takeUntil } from 'rxjs/operators';
import * as moment from 'moment-timezone';
import startCase from 'lodash/startCase';
import upperCase from 'lodash/upperCase';

/** Application imports */
import { ContactGroup } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ActivatedRoute } from '@angular/router';
import {
    ApplicationServiceProxy, LeadServiceProxy, LeadInfoDto, UpdateContactOrganizationUnitInput,
    ContactInfoDto, ContactServiceProxy, UpdateLeadInfoInput, OrganizationUnitShortDto, UpdateSourceContactInput
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { CrmStore, OrganizationUnitsStoreActions, OrganizationUnitsStoreSelectors } from '@app/crm/store';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { SourceContactListComponent } from '../source-contact-list/source-contact-list.component';

@Component({
    selector: 'lead-information',
    templateUrl: './lead-information.component.html',
    styleUrls: ['./lead-information.component.less'],
    providers: [ ApplicationServiceProxy, LifecycleSubjectsService ]
})
export class LeadInformationComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(SourceContactListComponent) sourceComponent: SourceContactListComponent;
    @ViewChild('loaderWrapper') loaderWrapper: ElementRef;
    data: {
        contactInfo: ContactInfoDto,
        leadInfo: LeadInfoDto
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

    isCGManageAllowed = false;
    isEditAllowed = false;
    startCase = startCase;
    upperCase = upperCase;

    stages: any[];
    types: any[];
    sources: any[];
    sourceContacts = [];
    sourceContactId: number;
    sourceContactName: string;
    layoutColumns: any[] = [
        {
            sections: [
                {
                    name: '',
                    items: [
                        { name: 'stage', readonly: true },
                        { name: 'amount', readonly: true },
                        { name: 'creationDate', readonly: true },
                        { name: 'modificationDate', readonly: true }
                    ]
                },
                {
                    name: 'LeadSource',
                    items: [ { name: 'sourceCode' } ]
                },
                {
                    name: 'TrackingInfo',
                    items: [
                        { name: 'applicantId', readonly: true, action: this.showApplications.bind(this) },
                        { name: 'applicationId', readonly: true, action: this.showApplications.bind(this) },
                        { name: 'clickId', readonly: true },
                        { name: 'siteId', readonly: true },
                        { name: 'siteUrl', readonly: true },
                        { name: 'refererUrl', readonly: true },
                        { name: 'entryUrl', readonly: true },
                        { name: 'clientIp', readonly: true },
                        { name: 'userAgent', readonly: true },
                    ]
                }
            ]
        },
        {
            sections: [
                {
                    name: 'Campaign',
                    items: [ { name: 'campaignCode' }, { name: 'affiliateCode' }, { name: 'partnerSource' }, { name: 'channelCode' } ]
                },
                {
                    name: 'Comments',
                    items: [ { name: 'comments', hideLabel: true } ]
                }
            ]
        }
    ];

    constructor(injector: Injector,
        private route: ActivatedRoute,
        private contactProxy: ContactServiceProxy,
        private leadService: LeadServiceProxy,
        private contactsService: ContactsService,
        private applicationProxy: ApplicationServiceProxy,
        private store$: Store<CrmStore.State>,
        private lifeCycleService: LifecycleSubjectsService
    ) {
        super(injector);

        this.contactsService.loadLeadInfo();
        contactsService.orgUnitsSaveSubscribe((data) => {
            let orgUnitId = data.length ? data[0] : undefined;
            if (orgUnitId && orgUnitId != this.data.leadInfo.organizationUnitId) {
                this.data.leadInfo.organizationUnitId = orgUnitId;
                contactProxy.updateOrganizationUnit(new UpdateContactOrganizationUnitInput({
                    contactId: this.data.contactInfo.id,
                    organizationUnitId: orgUnitId
                })).subscribe(() =>
                    this.notify.info(this.l('SavedSuccessfully'))
                );
            }
        }, this.constructor.name);
    }

    ngOnInit() {
        this.data = this.contactProxy['data'];
        this.contactsService.contactInfoSubscribe(contactInfo => {
            this.data.contactInfo = contactInfo;
            this.sourceContactId = contactInfo.sourceContactId;
            this.isCGManageAllowed = this.contactsService.checkCGPermission(contactInfo.groupId);
            this.showApplicationAllowed = this.isGranted(AppPermissions.PFMApplicationsViewApplications) &&
                contactInfo.personContactInfo.userId && contactInfo.groupId == ContactGroup.Client;
            this.updateSourceContactName();
            this.loadOrganizationUnits();
        }, this.constructor.name);
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
                    allOrganizationUnits: organizationUnits,
                    selectedOrgUnits: [organizationUnits.find((organizationUnit: OrganizationUnitShortDto) => {
                        return organizationUnit.id === (leadInfo.organizationUnitId || this.data.contactInfo.organizationUnitId);
                    })].filter(Boolean).map(item => item.id)
                });
            }, this.constructor.name);
        });
    }

    loadApplication() {
        this.startLoading(false, this.loaderWrapper.nativeElement);
        this.applicationProxy.getInitialMemberApplication(
            this.data.contactInfo.personContactInfo.userId,
            this.data.leadInfo.applicationId).pipe(finalize(() => this.finishLoading(false, this.loaderWrapper.nativeElement))).subscribe((response) => {
                this.application = response;
            }
        );
    }

    showApplications() {
        this.selectedTabIndex = this.APP_TAB_INDEX;
    }

    getPropData(item) {
        if (item.data)
            return item.data;

        let field = item.name;
        return {
            id: (this.data && this.data.leadInfo) ? this.data.leadInfo.id : null,
            value: this.getPropValue(field),
            isEditDialogEnabled: false,
            lEntityName: field,
            lEditPlaceholder: this.l('EditValuePlaceholder')
        };
    }

    getPropValue(field) {
        let leadInfo = this.data && this.data.leadInfo;
        let value = leadInfo && leadInfo[field];
        if (!value)
            return null;

        return this.formatFieldValue(value);
    }

    updateValue(value, item) {
        let fieldName = item.name;
        this.data.leadInfo[fieldName] = value;
        this.leadService.updateLeadInfo(
            UpdateLeadInfoInput.fromJS(this.data.leadInfo)
        ).subscribe();
    }

    getObjectKeys(obj) {
        return obj && Object.keys(obj);
    }

    formatFieldValue(value) {
        return value instanceof moment ? value.format(this.formatting.dateMoment) : value;
    }

    updateSourceContactName() {
        let contact = this.sourceContacts.find(item => 
            item.id == this.sourceContactId);
        if (contact)
            this.sourceContactName = contact.name;
    }

    onSourceContactLoaded(contacts) {
        this.sourceContacts = contacts;
        this.updateSourceContactName();
    }

    onSourceContactChanged(event) {
        if (this.sourceContactId == event.id)
            event = {id: undefined, name: undefined};

        let prevName = this.sourceContactName;
        this.sourceContactName = event.name;
        this.contactProxy.updateSourceContact(
            new UpdateSourceContactInput({
                contactId: this.data.contactInfo.id,
                sourceContactId: event.id
            })
        ).subscribe((orgUnitId) => {
            this.contactsService.orgUnitsUpdate({
                allOrganizationUnits: this.organizationUnits,
                selectedOrgUnits: [orgUnitId]
            });

            this.sourceContactId = event.id;
            this.notify.info(this.l('SavedSuccessfully'));
        }, () => {
            this.sourceContactName = prevName;
            this.notify.error(this.l('AnErrorOccurred'));
        });
        this.sourceComponent.toggle();
    }

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.constructor.name);
    }
}