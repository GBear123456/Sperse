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
    PersonOrgRelationServiceProxy,
    PersonOrgRelationShortInfo
} from '@shared/service-proxies/service-proxies';
import { CrmStore, OrganizationUnitsStoreActions } from '@app/crm/store';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: 'add-company-dialog.html',
    styleUrls: ['add-company-dialog.less']
})
export class AddCompanyDialogComponent {
    companies: any = [];
    private lookupTimeout: any;
    private latestSearchPhrase: string;
    constructor(
        private elementRef: ElementRef,
        private relationServiceProxy: PersonOrgRelationServiceProxy,
        private orgServiceProxy: OrganizationContactServiceProxy,
        private store$: Store<CrmStore.State>,
        private loadingService: LoadingService,
        public dialogRef: MatDialogRef<AddCompanyDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

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
            $event.component.option('noDataText', this.ls.l('LookingForItems'));
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
                    jobTitle: this.data.title,
                    organization: {id: orgId, name: this.data.company, thumbnail: ''},
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
                organizationId: this.data.id,
                organizationName: this.data.company,
                relationshipType: PersonOrgRelationType.Employee,
                jobTitle: this.data.title
            }
        )).pipe(
            finalize(() => {
                this.data.id = undefined;
                this.loadingService.finishLoading();
            }),
            switchMap((response: CreatePersonOrgRelationOutput) => {
                let result = of(response);
                if (response.organizationId) {
                    this.data.updateLocation(this.data.contactId, this.data.contactInfo['leadId'], response.organizationId);
                    /** Reload list of organization units */
                    if (this.data.contactInfo.groupId === ContactGroup.Partner) {
                        this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(true));
                    }
                    result = this.applyContactInfo(response);
                }
                return result;
            })
        ).subscribe((response: CreatePersonOrgRelationOutput) => {
            this.dialogRef.close(response);
        });
    }
}
