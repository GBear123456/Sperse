/** Core imports */
import { Component, OnInit, Injector, Input } from '@angular/core';

/** Third party import */
import { MatDialog } from '@angular/material';
import * as _ from 'underscore';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroupStatus } from '@shared/AppEnums';
import { OrganizationDialogComponent } from './organization-dialog/organization-dialog.component';
import { ContactPersonsDialogComponent } from './contact-persons-dialog/contact-persons-dialog.component';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { PersonDialogComponent } from './person-dialog/person-dialog.component';
import { ContactGroupInfoDto, UserServiceProxy, CreateContactPhotoInput,
    ContactPhotoDto, UpdateOrganizationInfoInput, OrganizationContactServiceProxy,
    PersonContactServiceProxy, UpdatePersonInfoInput, ContactPhotoServiceProxy } from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { AppService } from '@app/app.service';
import { StringHelper } from '@shared/helpers/StringHelper';

@Component({
    selector: 'details-header',
    templateUrl: './details-header.component.html',
    styleUrls: ['./details-header.component.less'],
    providers: [ AppService, ContactPhotoServiceProxy, DialogService, UserServiceProxy ]
})
export class DetailsHeaderComponent extends AppComponentBase implements OnInit {
    @Input() data: ContactGroupInfoDto;
    @Input() ratingId: number;
    canSendVerificationRequest = false;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private organizationContactService: OrganizationContactServiceProxy,
        private personContactServiceProxy: PersonContactServiceProxy,
        private contactPhotoServiceProxy: ContactPhotoServiceProxy,
        private nameParserService: NameParserService,
        private appService: AppService,
        private dialogService: DialogService
    ) {
        super(injector);

        this.canSendVerificationRequest = this.appService.canSendVerificationRequest();
    }

    ngOnInit(): void {
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
    }

    requestVerification() {
        this.appService.requestVerification(this.data.primaryContactInfo.id);
    }

    getDialogPossition(event, shiftX) {
        return this.dialogService.calculateDialogPosition(event, event.target.closest('div'), shiftX, -12);
    }

    showOrganizationDetails(event) {
        let dialogData = this.data.organizationContactInfo;
        this.dialog.closeAll();
        this.dialog.open(OrganizationDialogComponent, {
            data: dialogData,
            hasBackdrop: false,
            position: this.getDialogPossition(event, 304)
        }).afterClosed().subscribe(result => {
          // some logic
        });
        event.stopPropagation();
    }

    showContactPersons(event) {
        this.dialog.closeAll();
        this.dialog.open(ContactPersonsDialogComponent, {
            data: this.data,
            hasBackdrop: false,
            position: this.getDialogPossition(event, 170)
        });
        event.stopPropagation();
    }

    showUploadPhotoDialog(event, isCompany = undefined) {
        this.dialog.closeAll();
        this.dialog.open(UploadPhotoDialogComponent, {
            data: this.data,
            hasBackdrop: true
        }).afterClosed().subscribe(result => {
            if (result) {
                let base64OrigImage = StringHelper.getBase64(result.origImage),
                    base64ThumbImage = StringHelper.getBase64(result.thumImage),
                    dataField = (isCompany ? 'organization' : 'primary') + 'ContactInfo';
                this.data[dataField].primaryPhoto = ContactPhotoDto.fromJS({
                    original: base64OrigImage,
                    thumbnail: base64ThumbImage
                });
                this.contactPhotoServiceProxy.createContactPhoto(
                    CreateContactPhotoInput.fromJS({
                        contactId: this.data[dataField].id,
                        originalImage: base64OrigImage,
                        thumbnail: base64ThumbImage
                    })
                ).subscribe((result) => {});
            }
        });
        event.stopPropagation();
    }

    getNameInplaceEditData(field = 'primaryContactInfo') {
        let contactInfo = this.data && this.data[field];
        if (contactInfo)
            return {
                id: contactInfo.id,
                value: contactInfo.fullName.trim(),
                validationRules: [
                    {type: 'required', message: this.l('FullNameIsRequired')},
                    {type: 'pattern', pattern: AppConsts.regexPatterns.fullName, message: this.l('FullNameIsNotValid')}
                ],
                isEditDialogEnabled: true,
                lEntityName: 'Name',
                lEditPlaceholder: this.l('ClientNamePlaceholder')
            };
    }

    showEditPersonDialog(event) {
        this.dialog.closeAll();
        this.dialog.open(PersonDialogComponent, {
            data: this.data.primaryContactInfo,
            hasBackdrop: false,
            position: this.getDialogPossition(event, 200)
        });
        event.stopPropagation();
    }

    updateCompanyName(value) {
        let data = this.data.organizationContactInfo;
        data.organization.companyName = value;
        this.organizationContactService.updateOrganizationInfo(
            UpdateOrganizationInfoInput.fromJS(
                _.extend({id: data.id}, data.organization))
        ).subscribe(result => {
            data.fullName = value;
        });
    }

    updatePrimaryContactName(value) {
        value = value.trim();
        if (!value)
            return;

        this.data.primaryContactInfo.fullName = value;

        let person = this.data.primaryContactInfo.person;
        this.nameParserService.parseIntoPerson(value, person);

        this.personContactServiceProxy.updatePersonInfo(
            UpdatePersonInfoInput.fromJS(
                _.extend({id:  person.contactId},  person))
        ).subscribe(result => {});
    }

    isClientProspective() {
        return this.data ? this.data.statusId == ContactGroupStatus.Prospective : true;
    }
}
