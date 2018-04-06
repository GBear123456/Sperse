import { Component, OnInit, Injector, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { OrganizationDialogComponent } from './organization-dialog/organization-dialog.component';
import { ContactPersonsDialogComponent } from './contact-persons-dialog/contact-persons-dialog.component';
import { UploadPhotoDialogComponent } from './upload-photo-dialog/upload-photo-dialog.component';
import { PersonDialogComponent } from './person-dialog/person-dialog.component';
import { CustomerInfoDto, UserServiceProxy, ActivateUserForContactInput, InstanceServiceProxy, 
    SetupInput, TenantHostType, PersonContactServiceProxy, UpdatePersonInfoInput } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { ClientService } from '@app/crm/clients/clients.service';

@Component({
    selector: 'details-header',
    templateUrl: './details-header.component.html',
    styleUrls: ['./details-header.component.less'],
    providers: [UserServiceProxy, InstanceServiceProxy, ClientService]
})
export class DetailsHeaderComponent extends AppComponentBase implements OnInit {
    @Input()
    data: CustomerInfoDto;
    canSendVerificationRequest: boolean = false;

    person = {
        id: 1,
        first_name: 'Matthew',
        second_name: 'Robertson',
        rating: 7,
        person_photo_url: 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png',
        approved_sum: '45000',
        requested_sum_min: '100000',
        requested_sum_max: '245000',
        profile_created: '6/6/2016',
        lead_owner_photo_url: 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png',
        lead_owner_name: 'R.Hibbert',
        org_photo_url: 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png'
    };
    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private userServiceProxy: UserServiceProxy,
        private instanceServiceProxy: InstanceServiceProxy,
        private personContactServiceProxy: PersonContactServiceProxy,
        private nameParserService: NameParserService,
        private clientService: ClientService
    ) {
        super(injector);

        this.canSendVerificationRequest = this.clientService.canSendVerificationRequest();
    }

    ngOnInit(): void {
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        //  this.person = this.PersonService.getPersonInfo();
    }

    requestVerification() {
        this.clientService.requestVerification(this.data.primaryContactInfo.id);
    }

    getDialogPossition(event, shiftX) {
        return this.calculateDialogPosition(event, event.target.closest('div'), shiftX, -12);
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

    showUploadPhotoDialog(event) {
        this.dialog.closeAll();
        this.dialog.open(UploadPhotoDialogComponent, {
          data: this.data,
          hasBackdrop: true
        });
        event.stopPropagation();
    }

    getNameInplaceEditData() {
        var primaryContactInfo = this.data && this.data.primaryContactInfo;
        if (primaryContactInfo)
            return {
                id: primaryContactInfo.id,
                value: primaryContactInfo.fullName,
                validationRules: [],
                isEditDialogEnabled: true,
                lEntityName: "Name",
                lEditPlaceholder: 'Enter value'
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

    updatePrimaryContactName(value) {
        value = value.trim();
        if (!value)
            return;

        this.data.primaryContactInfo.fullName = value;
        
        var person = this.data.primaryContactInfo.person;
        this.nameParserService.parseIntoPerson(value, person);
        
        this.personContactServiceProxy.updatePersonInfo(
            UpdatePersonInfoInput.fromJS(
                _.extend({id:  person.contactId},  person))
        ).subscribe(result => {});
    }
}
