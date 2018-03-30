import { AppConsts } from '@shared/AppConsts';
import { LinkType, LinkUsageType } from '@shared/AppEnums';
import { Component, OnInit, Injector, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/takeWhile';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatDialog } from '@angular/material';
import { EditAddressDialog } from '../edit-address-dialog/edit-address-dialog.component';
import { ContactEmploymentServiceProxy, OrganizationContactServiceProxy, OrganizationShortInfoDto,
    ContactEmploymentInfo, UpdateContactEmploymentInput, ContactAddressDto, ContactInfoBaseDto } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
    selector: 'employment',
    templateUrl: './employment.component.html',
    styleUrls: ['./employment.component.less']
})
export class EmploymentComponent extends AppComponentBase implements OnInit {
    @Input()
    private set contactId(value) {
        this._contactInfoBehaviorSubject.next(value);
    }
    private get contactId() {
        return this._contactInfoBehaviorSubject.getValue();
    }
    private contactEmploymentInfo: ContactEmploymentInfo;
    private organizations: OrganizationShortInfoDto[];
    private organizationAddress: ContactAddressDto;
    private organizationWebsiteUrl: string;
    private organizationPhoneNumber: string;
    private organizationMobilePhoneNumber: string;

    private isEditOrgDetailsAllowed: boolean;

    private masks = AppConsts.masks;

    private _contactInfoBehaviorSubject = new BehaviorSubject<number>(0);
    private _isEditAllowed = false;
    private _originalData = new Object();

    private _selectedOrgName: string;
    private _selectedOrgId: number;

    private _isInPlaceEditAllowed = true;

    constructor(
        injector: Injector,
        private _сontactEmploymentService: ContactEmploymentServiceProxy,
        private _organizationContactServiceProxy: OrganizationContactServiceProxy,
        private dialog: MatDialog) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this._isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
    }

    ngOnInit() {
        this.initializeEmploymentInfo();
        this.initializeOrganizationList();
    }

    initializeEmploymentInfo() {
        this._contactInfoBehaviorSubject
        .subscribe(r => {
            let contactId = this.contactId;
            if (contactId) {
                this._сontactEmploymentService.get(contactId).subscribe(response => {
                    this.contactEmploymentInfo = response.contactEmploymentInfo;
                    if (this.contactEmploymentInfo) {
                        let orgId = this.contactEmploymentInfo.orgId;
                        this.isEditOrgDetailsAllowed = orgId == null;
                        if (orgId) {
                            this.setOrganizationContactInfo(orgId);
                        }
                    }
                });
            }
        });
    }

    initializeOrganizationList() {
        this._organizationContactServiceProxy.getOrganizations().subscribe(response => {
            this.organizations = response;
        });
    }

    setOrganizationContactInfo(orgId: number) {
        this._organizationContactServiceProxy.getOrganizationContactInfo(orgId).subscribe(response => {
            this.organizationAddress = this.getOrganizationPrimaryAddress(response);
            this.organizationWebsiteUrl = this.getOrganizationWebsiteUrl(response);
            this.organizationPhoneNumber = this.getOrganizationPrimaryPhoneNumber(response);
            this.organizationMobilePhoneNumber = this.getOrganizationMobilePhoneNumber(response);
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
                this.setOrganizationContactInfo(this._selectedOrgId);
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
        let contactEmploymentInputData = new UpdateContactEmploymentInput();
        contactEmploymentInputData.contactEmploymentEditInfo = contactEmploymentData;
        contactEmploymentInputData.id = contactEmploymentData.id;

        this._сontactEmploymentService.update(contactEmploymentInputData).subscribe(response => {});
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
        return this.calculateDialogPosition(event, parent, 0, shiftY);
    }

    calculateShiftY(event) {
        let shift = 245;

        let availableSpaceY = window.innerHeight - event.clientY;
        if (availableSpaceY < shift + 40)
            shift += shift - availableSpaceY + 130;

        return shift;
    }
}
