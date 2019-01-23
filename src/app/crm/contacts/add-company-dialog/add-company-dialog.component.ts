/** Core imports */
import { Component, Inject, Injector, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';
import { PersonOrgRelationType } from '@shared/AppEnums';
import { OrganizationContactServiceProxy, CreatePersonOrgRelationInput, 
    PersonOrgRelationServiceProxy, PersonOrgRelationShortInfo } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: 'add-company-dialog.html',
    styleUrls: ['add-company-dialog.less']
})
export class AddCompanyDialogComponent extends AppComponentBase {
    companies: any = [];
    private lookupTimeout: any;
    private latestSearchPhrase: string;
    constructor(injector: Injector,
                @Inject(MAT_DIALOG_DATA) public data: any,
                private elementRef: ElementRef,
                private relationServiceProxy: PersonOrgRelationServiceProxy,
                private orgServiceProxy: OrganizationContactServiceProxy,
                public dialogRef: MatDialogRef<AddCompanyDialogComponent>,
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    lookupCompanies(search?: string) {
        return this.orgServiceProxy.getOrganizations(search, this.data.contactInfo.groupId, 10);
    }

    lookupItems($event) {
        let search = this.latestSearchPhrase = $event.event.target.value;
        if (this.companies.length) {
            setTimeout(() => { $event.event.target.value = search; });
            this.companies = [];
        }

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            $event.component.option('opened', true);
            $event.component.option('noDataText', this.l('LookingForItems'));
            this.lookupCompanies(search).subscribe((res) => {
                if (search == this.latestSearchPhrase) {
                    this.companies = res;
                    setTimeout(() => { $event.event.target.value = search; });
                    $event.component.option('opened', Boolean(this.companies.length));
                }
            });
        }, 500);
    }

    lookupFocusOut($event) {
        if (isNaN(this.data.company))
            this.data.company = this.latestSearchPhrase;
        else {
            this.data.id = this.data.company;
            this.data.company = $event.event.target.value;
        }
    }

    lookupFocusIn($event) {
        $event.component.option('opened', Boolean(this.companies.length));
    }

    applyContactInfo(responce) {
        let contactInfo = this.data.contactInfo;
        if (responce && contactInfo) {            
            let orgId = responce.organizationId;
            this.orgServiceProxy.getOrganizationContactInfo(orgId).subscribe((result) => {
                contactInfo['organizationContactInfo'] = result;                
            });
            contactInfo.primaryOrganizationContactId = orgId;
            contactInfo.personContactInfo.orgRelations.push(
                contactInfo.personContactInfo['personOrgRelationInfo'] = PersonOrgRelationShortInfo.fromJS({
                    id: responce.id,
                    isActive: true,
                    jobTitle: this.data.title,
                    organization: {id: orgId, name: this.data.company, thumbnail: ""},
                    relationType: {id: PersonOrgRelationType.Employee, name: "Employee"}
                })
            );
        }
    }

    onSave(event) {
        this.startLoading(true);
        this.relationServiceProxy.create(
            CreatePersonOrgRelationInput.fromJS({
                personId: this.data.contactId,
                organizationId: this.data.id,
                organizationName: this.data.company,
                relationshipType: PersonOrgRelationType.Employee,
                jobTitle: this.data.title
            }
        )).pipe(finalize(() => {
            this.data.id = undefined;
            this.finishLoading(true);
        })).subscribe((responce) => {
            this.finishLoading(true);
            if (responce.organizationId) {
                let isPartner = this.data.contactInfo.groupId == ContactGroup.Partner;
                this.data.updateLocation(isPartner ? null: this.data.contactId, this.data.contactInfo['leadId'],
                    isPartner ? this.data.contactId: null, responce.organizationId);
                this.applyContactInfo(responce);
            }
            this.dialogRef.close(responce);
        });
    }
}