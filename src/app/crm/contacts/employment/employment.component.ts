/** Core imports */
import { Component, OnInit, Injector, Input } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppConsts } from '@shared/AppConsts';
import { LinkType, LinkUsageType } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EditAddressDialog } from '../edit-address-dialog/edit-address-dialog.component';
import { ContactEmploymentServiceProxy, OrganizationContactServiceProxy, OrganizationShortInfoDto, UpdateContactEmploymentInput, ContactAddressDto, ContactInfoBaseDto } from '@shared/service-proxies/service-proxies';

import { finalize } from 'rxjs/operators';

@Component({
    selector: 'employment',
    templateUrl: './employment.component.html',
    styleUrls: ['./employment.component.less'],
    providers: [ DialogService ]
})
export class EmploymentComponent extends AppComponentBase implements OnInit {
    @Input()
    private set contactId(value) {
        this._contactInfoBehaviorSubject.next(value);
    }
    private get contactId() {
        return this._contactInfoBehaviorSubject.getValue();
    }

    private readonly ORGANIZATIONS_TOP_COUNT = 20;

    public contactEmploymentInfo: any = {};
    private organizations: OrganizationShortInfoDto[];
    private organizationAddress: ContactAddressDto;
    private organizationWebsiteUrl: string;
    private organizationPhoneNumber: string;
    private organizationMobilePhoneNumber: string;

    public isEditOrgDetailsAllowed: boolean;

    public masks = AppConsts.masks;

    private _contactInfoBehaviorSubject = new BehaviorSubject<number>(0);
    private _isEditAllowed = false;
    private _originalData = new Object();

    private _selectedOrgName: string;
    private _selectedOrgId: number;

    private _isInPlaceEditAllowed = true;
    private _latestSearchPhrase = '';
    private _lookupTimeout;

    constructor(
        injector: Injector,
        private _contactEmploymentService: ContactEmploymentServiceProxy,
        private _organizationContactServiceProxy: OrganizationContactServiceProxy,
        private dialog: MatDialog,
        private dialogService: DialogService) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this._isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
    }

    ngOnInit() {
        if (!this._contactEmploymentService['data'])
            this._contactEmploymentService['data'] = {};

        if (!this._organizationContactServiceProxy['data'])
            this._organizationContactServiceProxy['data'] = {};

        this.initializeEmploymentInfo();
    }

    initializeEmploymentInfo() {
        this._contactInfoBehaviorSubject.subscribe(r => {
            let contactId = this.contactId;
            if (contactId) {
                if (this._contactEmploymentService['data'] && this._contactEmploymentService['data'].id == contactId) {
                    this.contactEmploymentInfo = this._contactEmploymentService['data'].contactEmploymentInfo;
                    if (this.isEditOrgDetailsAllowed = Boolean(this.contactEmploymentInfo['orgId']))
                        this.loadOrganizationContactInfo(this.contactEmploymentInfo.orgId);                    
                } else {
                    this.startLoading();
                    this._contactEmploymentService.get(contactId).pipe(finalize(() => this.finishLoading()))
                        .subscribe(response => {
                            this._contactEmploymentService['data'].id = contactId;
                            this._contactEmploymentService['data'].contactEmploymentInfo = response.contactEmploymentInfo;

                            this.contactEmploymentInfo = response.contactEmploymentInfo || {};
                            if (this.isEditOrgDetailsAllowed = Boolean(this.contactEmploymentInfo['orgId']))
                                this.loadOrganizationContactInfo(this.contactEmploymentInfo.orgId);
                        }
                    );
                }
            }
        });
    }

    initializeOrganizationList(searchString = '') {
        return new Promise((resolve, reject) => {
            this._organizationContactServiceProxy.getOrganizations(searchString, 
                this.ORGANIZATIONS_TOP_COUNT).subscribe(response => {
                    resolve(response);
                }
            );
        });
    }

    setOrganizationContactInfo(data) {
        this.organizationAddress = this.getOrganizationPrimaryAddress(data);
        this.organizationWebsiteUrl = this.getOrganizationWebsiteUrl(data);
        this.organizationPhoneNumber = this.getOrganizationPrimaryPhoneNumber(data);
        this.organizationMobilePhoneNumber = this.getOrganizationMobilePhoneNumber(data);
    }

    loadOrganizationContactInfo(orgId: number) {
        if (this._organizationContactServiceProxy['data'].id == orgId)
            this.setOrganizationContactInfo(this._organizationContactServiceProxy['data']);
        else 
            this._organizationContactServiceProxy.getOrganizationContactInfo(orgId).subscribe(response => {
                this._organizationContactServiceProxy['data'] = response;
                this.setOrganizationContactInfo(response);
            });
    }

    getOrganizationPrimaryAddress(organizationContactInfo: ContactInfoBaseDto) {
        return organizationContactInfo.primaryAddress;
    }

    getOrganizationWebsiteUrl(organizationContactInfo: ContactInfoBaseDto) {
        let links = organizationContactInfo.details.links.filter(item => item.linkTypeId == LinkType.Website);
        return links.length > 0 ? links[0].url : null;
    }

    getOrganizationPrimaryPhoneNumber(organizationContactInfo: ContactInfoBaseDto) {
        let phone = organizationContactInfo.primaryPhone;
        return phone ? phone.phoneNumber : null;
    }

    getOrganizationMobilePhoneNumber(organizationContactInfo: ContactInfoBaseDto) {
        let phones = organizationContactInfo.details.phones.filter(item => item.usageTypeId == LinkUsageType.Mobile);
        return phones.length > 0 ? phones[0].phoneNumber : null;
    }

    inPlaceEdit(field, contactEmploymentData, isActionAllowed = true) {
        if (this._isEditAllowed && isActionAllowed && this._isInPlaceEditAllowed) {
            contactEmploymentData.inplaceEditField = field;
            this._originalData[field] = contactEmploymentData[field];
        }
    }

    closeInPlaceEdit(field, contactEmploymentData) {
        contactEmploymentData.inplaceEditField = null;
        contactEmploymentData[field] = this._originalData[field];
        this._isInPlaceEditAllowed = true;
    }

    valueChanged(field) {
        this._isInPlaceEditAllowed = this.contactEmploymentInfo[field] == this._originalData[field];
    }

    inPlaceEditOrganization(contactEmploymentData) {
        if (this._isEditAllowed && this._isInPlaceEditAllowed) {
            let orgNameField = 'orgName', orgIdField = 'orgId';
            contactEmploymentData.inplaceEditField = orgNameField;
            this._originalData[orgNameField] = contactEmploymentData[orgNameField];
            this._originalData[orgIdField] = contactEmploymentData[orgIdField];

            this.initializeOrganizationList().then((res: OrganizationShortInfoDto[]) => {
                this.organizations = res;
            });
        }
    }

    closeInPlaceEditOrganization(contactEmploymentData) {
        contactEmploymentData.inplaceEditField = null;
        this._selectedOrgName = this._originalData['orgName'];
        this._selectedOrgId = this._originalData['orgId'];
        this._isInPlaceEditAllowed = true;
    }

    updateDataField(field, contactEmploymentData, event) {
        if (!event.validationGroup || event.validationGroup.validate().isValid) {
            if (contactEmploymentData[field] != this._originalData[field]) {
                this.updateContactEmployment(contactEmploymentData);
            }

            contactEmploymentData.inplaceEditField = null;
            this._isInPlaceEditAllowed = true;
        }
    }

    updateOrganizationData(contactEmploymentData, event) {
        if (event.validationGroup && !event.validationGroup.validate().isValid) {
            return;
        }

        if (this._selectedOrgName != this._originalData['orgName']) {
            if (this._selectedOrgId) {
                this.loadOrganizationContactInfo(this._selectedOrgId);
                this.clearPersonEmploymentContacts();
                this.isEditOrgDetailsAllowed = false;
            } else {
                this.isEditOrgDetailsAllowed = true;
            }

            this.contactEmploymentInfo.orgName = this._selectedOrgName;
            this.contactEmploymentInfo.orgId = this._selectedOrgId;
            this.updateContactEmployment(contactEmploymentData);
        }

        contactEmploymentData.inplaceEditField = null;
        this._isInPlaceEditAllowed = true;
    }

    clearPersonEmploymentContacts() {
        this.contactEmploymentInfo.websiteUrl = null;
        this.contactEmploymentInfo.phoneNumber = null;
        this.contactEmploymentInfo.mobilePhoneNumber = null;
        this.contactEmploymentInfo.country = null;
        this.contactEmploymentInfo.countryId = null;
        this.contactEmploymentInfo.state = null;
        this.contactEmploymentInfo.stateId = null;
        this.contactEmploymentInfo.city = null;
        this.contactEmploymentInfo.zip = null;
        this.contactEmploymentInfo.streetAddress = null;
    }

    organizationNameChanged(event) {
        if (!event.selectedItem) {
            return;
        }

        if ( event.selectedItem.name) {
            this._selectedOrgName = event.selectedItem.name;
            this._selectedOrgId = event.selectedItem.id;
        } else {
            this._selectedOrgName = event.selectedItem;
            this._selectedOrgId = null;
        }

        this._isInPlaceEditAllowed = this._selectedOrgName == this._originalData['orgName'];
    }

    updateContactEmployment(contactEmploymentData) {
        this._contactEmploymentService.update(UpdateContactEmploymentInput.fromJS({
            id: contactEmploymentData.id,
            contactEmploymentEditInfo: contactEmploymentData
        })).subscribe(response => {});
    }

    showEditAddressDialog(contactEmploymentInfo, event) {
        let dialogData = _.pick(contactEmploymentInfo || {},
            'city', 'country', 'state', 'streetAddress', 'zip');
        dialogData.editAddressOnly = true;
        dialogData.title = this.l('EditAddress');
        this.dialog.closeAll();
        this.dialog.open(EditAddressDialog, {
            data: dialogData,
            hasBackdrop: false,
            position: this.getDialogPossition(event)
        }).afterClosed().subscribe(result => {
            scrollTo(0, 0);
            if (result) {
                this.updateAddressFields(contactEmploymentInfo, dialogData);
                this.updateContactEmployment(contactEmploymentInfo);
            }
        });
        event.stopPropagation();
    }

    updateAddressFields (contactEmploymentInfo, data) {
        contactEmploymentInfo.country = data.country;
        contactEmploymentInfo.countryId = data.countryId;
        contactEmploymentInfo.state = data.state;
        contactEmploymentInfo.stateId = data.stateId;
        contactEmploymentInfo.city = data.city;
        contactEmploymentInfo.zip = data.zip;
        contactEmploymentInfo.streetAddress = data.streetAddress;
    }

    getDialogPossition(event) {
        let shiftY = this.calculateShiftY(event);
        let parent = event.target.closest('.address-wrapper');
        return this.dialogService.calculateDialogPosition(event, parent, 0, shiftY);
    }

    calculateShiftY(event) {
        let shift = 245;

        let availableSpaceY = window.innerHeight - event.clientY;
        if (availableSpaceY < shift + 40)
            shift += shift - availableSpaceY + 130;

        return shift;
    }

    lookupOrganizationItems($event) {
        let search = this._latestSearchPhrase = $event.event.target.value;

        if (this.organizations.length) {
            setTimeout(() => {$event.event.target.value = search;});
            this.organizations = [];
        }

        clearTimeout(this._lookupTimeout);
        this._lookupTimeout = setTimeout(() => {
            $event.component.option('opened', true);
            $event.component.option('noDataText', this.l('LookingForItems'));
            this.initializeOrganizationList(search).then((res: OrganizationShortInfoDto[]) => {
                if (search == this._latestSearchPhrase) {
                    this.organizations = res;
                    $event.component.option('opened', true);
                    setTimeout(() => {$event.event.target.value = search;});
                    if (!res['length'])
                        $event.component.option('noDataText', this.l('NoItemsFound'));
                } else
                    $event.component.option('opened', false);
            });
        }, 500);
    }
}