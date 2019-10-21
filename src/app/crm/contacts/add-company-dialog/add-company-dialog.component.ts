/** Core imports */
import { Component, Inject, Injector, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactGroup, PersonOrgRelationType } from '@shared/AppEnums';
import {
    CreatePersonOrgRelationInput,
    CreatePersonOrgRelationOutput,
    OrganizationContactServiceProxy,
    PersonOrgRelationServiceProxy,
    PersonOrgRelationShortInfo
} from '@shared/service-proxies/service-proxies';
import { CrmStore, OrganizationUnitsStoreActions } from '@app/crm/store';

@Component({
    templateUrl: 'add-company-dialog.html',
    styleUrls: ['add-company-dialog.less']
})
export class AddCompanyDialogComponent extends AppComponentBase {
    companies: any = [];
    private lookupTimeout: any;
    private latestSearchPhrase: string;
    constructor(
        injector: Injector,
        private elementRef: ElementRef,
        private relationServiceProxy: PersonOrgRelationServiceProxy,
        private orgServiceProxy: OrganizationContactServiceProxy,
        private store$: Store<CrmStore.State>,
        public dialogRef: MatDialogRef<AddCompanyDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        super(injector);
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

    private applyContactInfo(response: CreatePersonOrgRelationOutput) {
        let contactInfo = this.data.contactInfo;
        if (response && contactInfo) {
            let orgId = response.organizationId;
            this.orgServiceProxy.getOrganizationContactInfo(orgId).subscribe((result) => {
                contactInfo.personContactInfo['personOrgRelationInfo'].organization.rootOrganizationUnitId =
                    (contactInfo['organizationContactInfo'] = result).organization.rootOrganizationUnitId;
            });
            contactInfo.personContactInfo.orgRelationId = response.id;
            contactInfo.primaryOrganizationContactId = orgId;
            if (!contactInfo.personContactInfo.orgRelations)
                contactInfo.personContactInfo.orgRelations = [];
            contactInfo.personContactInfo.orgRelations.push(
                contactInfo.personContactInfo['personOrgRelationInfo'] = PersonOrgRelationShortInfo.fromJS({
                    id: response.id,
                    isActive: true,
                    jobTitle: this.data.title,
                    organization: {id: orgId, name: this.data.company, thumbnail: ''},
                    relationType: {id: PersonOrgRelationType.Employee, name: 'Employee'}
                })
            );
        }
    }

    onSave() {
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
        })).subscribe((response: CreatePersonOrgRelationOutput) => {
            if (response.organizationId) {
                this.data.updateLocation(this.data.contactId, this.data.contactInfo['leadId'], response.organizationId);
                this.applyContactInfo(response);
                /** Reload list of organization units */
                if (this.data.contactInfo.groupId === ContactGroup.Partner) {
                    this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(true));
                }
            }
            this.dialogRef.close(response);
        });
    }
}
