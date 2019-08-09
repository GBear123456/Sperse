/** Core imports */
import { Component, OnInit, Injector, ViewChild, ElementRef } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';
import * as moment from 'moment';
import startCase from 'lodash/startCase';
import upperCase from 'lodash/upperCase';

/** Application imports */
import { ContactGroup } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ActivatedRoute } from '@angular/router';
import {
    ApplicationServiceProxy, LeadServiceProxy, LeadInfoDto,
    ContactInfoDto, ContactServiceProxy, UpdateLeadInfoInput } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    selector: 'lead-information',
    templateUrl: './lead-information.component.html',
    styleUrls: ['./lead-information.component.less'],
    providers: [ApplicationServiceProxy]
})
export class LeadInformationComponent extends AppComponentBase implements OnInit {
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

    private paramsSubscribe: any = [];
    private formatting = AppConsts.formatting;
    private _selectedTabIndex = 0;
    private readonly APP_TAB_INDEX = 1;

    isEditAllowed = false;
    startCase = startCase;
    upperCase = upperCase;

    stages: any[];
    types: any[];
    sources: any[];

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
                    items: [ { name: 'campaignCode' }, { name: 'affiliateCode' }, { name: 'channelCode' } ]
                },
                {
                    name: 'Comments',
                    items: [ { name: 'comments', hideLabel: true} ]
                }
            ]
        }
    ];

    constructor(injector: Injector,
        private _route: ActivatedRoute,
        private _contactProxy: ContactServiceProxy,
        private _leadService: LeadServiceProxy,
        private _contactsService: ContactsService,
        private _applicationProxy: ApplicationServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data = this._contactProxy['data'];
        this._contactsService.contactInfoSubscribe((contactInfo) => {
            this.data.contactInfo = contactInfo;
            this.isEditAllowed = this.data.leadInfo && this.data.leadInfo.id &&
                this._contactsService.checkCGPermission(contactInfo.groupId);
            this.showApplicationAllowed = this.isGranted(AppPermissions.PagesPFMApplicationsViewApplications) &&
                contactInfo.personContactInfo.userId && contactInfo.groupId == ContactGroup.Client;
        });
        this._contactsService.loadLeadInfo();
    }

    loadApplication() {
        this.startLoading(false, this.loaderWrapper.nativeElement);
        this._applicationProxy.getInitialMemberApplication(
            this.data.contactInfo.personContactInfo.userId,
            this.data.leadInfo.applicationId).pipe(finalize(() => this.finishLoading(false, this.loaderWrapper.nativeElement))).subscribe((responce) => {
                this.application = responce;
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
        let result = {
            id: (this.data && this.data.leadInfo) ? this.data.leadInfo.id : null,
            value: this.getPropValue(field),
            isEditDialogEnabled: false,
            lEntityName: field,
            lEditPlaceholder: this.l('EditValuePlaceholder')
        };
        return result;
    }

    getPropValue(field) {
        let leadInfo = this.data && this.data.leadInfo;
        let value = leadInfo && leadInfo[field];
        if (!value)
            return null;

        return value instanceof moment ? value.format(this.formatting.dateMoment) : value;
    }

    updateValue(value, item) {
        let fieldName = item.name;
        this.data.leadInfo[fieldName] = value;
        this._leadService.updateLeadInfo(
            UpdateLeadInfoInput.fromJS(this.data.leadInfo)
        ).subscribe(result => {});
    }

    getObjectKeys(obj) {
        return obj && Object.keys(obj);
    }
}
