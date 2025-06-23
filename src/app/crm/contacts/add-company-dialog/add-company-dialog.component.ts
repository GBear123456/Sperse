/** Core imports */
import { Component, Inject, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';

/** Application imports */
import { ContactGroup, PersonOrgRelationType } from '@shared/AppEnums';
import {
    CreatePersonOrgRelationInput,
    CreatePersonOrgRelationOutput,
    OrganizationContactInfoDto,
    OrganizationContactServiceProxy,
    OrganizationShortInfo,
    PersonOrgRelationServiceProxy,
    PersonOrgRelationShortInfo
} from '@shared/service-proxies/service-proxies';
import { CrmStore, OrganizationUnitsStoreActions } from '@app/crm/store';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AddCompanyDialogData } from '@app/crm/contacts/add-company-dialog/add-company-dialog-data.interface';

@Component({
    templateUrl: 'add-company-dialog.html',
    styleUrls: ['add-company-dialog.less']
})
export class AddCompanyDialogComponent {
    companies: OrganizationShortInfo[] = [];
    private lookupTimeout: any;
    private latestSearchPhrase: string;
    title: string;
    id: any;
    company: any;
    constructor(
        private elementRef: ElementRef,
        private relationServiceProxy: PersonOrgRelationServiceProxy,
        private orgServiceProxy: OrganizationContactServiceProxy,
        private store$: Store<CrmStore.State>,
        private loadingService: LoadingService,
        public dialogRef: MatDialogRef<AddCompanyDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: AddCompanyDialogData
    ) {}

    lookupCompanies(search?: string) {
        return this.orgServiceProxy.getOrganizations(search, 10);
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
            $event.component.option('noDataText', this.ls.l('LookingForItems'));
            this.lookupCompanies(search).subscribe((companies: OrganizationShortInfo[]) => {
                if (search == this.latestSearchPhrase) {
                    this.companies = companies;
                    setTimeout(() => { $event.event.target.value = search; });
                    $event.component.option('opened', Boolean(this.companies.length));
                }
            });
        }, 500);
    }

    lookupFocusOut($event) {
        if (isNaN(this.company))
            this.company = this.latestSearchPhrase;
        else {
            this.id = this.company;
            this.company = $event.event.target.value;
        }
    }

    lookupFocusIn($event) {
        $event.component.option('opened', Boolean(this.companies.length));
    }

    private applyContactInfo(response: CreatePersonOrgRelationOutput): Observable<any> {
        let result$: Observable<any> = of(true);
        let contactInfo = this.data.contactInfo;
        if (response && contactInfo) {
            let orgId = response.organizationId;
            contactInfo.personContactInfo.orgRelationId = response.id;
            contactInfo.primaryOrganizationContactId = orgId;
            if (!contactInfo.personContactInfo.orgRelations)
                contactInfo.personContactInfo.orgRelations = [];
            contactInfo.personContactInfo.orgRelations.push(
                contactInfo.personContactInfo['personOrgRelationInfo'] = PersonOrgRelationShortInfo.fromJS({
                    id: response.id,
                    isActive: true,
                    jobTitle: this.title,
                    organization: {id: orgId, name: this.company, thumbnail: ''},
                    relationType: {id: PersonOrgRelationType.Employee, name: 'Employee'}
                })
            );
            result$ = this.orgServiceProxy.getOrganizationContactInfo(orgId).pipe(
                tap((result: OrganizationContactInfoDto) => {
                    contactInfo.personContactInfo['personOrgRelationInfo'].organization.rootOrganizationUnitId =
                    (contactInfo['organizationContactInfo'] = result).organization.rootOrganizationUnitId;
                })
            );
        }
        return result$;
    }

    onSave() {
        this.loadingService.startLoading();
        this.relationServiceProxy.create(
            CreatePersonOrgRelationInput.fromJS({
                personId: this.data.contactId,
                organizationId: this.id,
                organizationName: this.company,
                relationshipType: PersonOrgRelationType.Employee,
                jobTitle: this.title
            }
        )).pipe(
            finalize(() => {
                this.id = undefined;
                this.loadingService.finishLoading();
            }),
            switchMap((response: CreatePersonOrgRelationOutput) => {
                let result = of(response);
                if (response.organizationId) {
                    this.data.updateLocation(this.data.contactId, this.data.leadId, response.organizationId);
                    this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(true));
                    result = this.applyContactInfo(response);
                }
                return result;
            })
        ).subscribe((response: any) => {
            this.dialogRef.close(response);
        });
    }
}
