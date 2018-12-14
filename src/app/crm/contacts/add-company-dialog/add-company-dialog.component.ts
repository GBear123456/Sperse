/** Core imports */
import { Component, Inject, Injector, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { filter, finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonOrgRelationType } from '@shared/AppEnums';
import { OrganizationContactServiceProxy, CreateOrUpdatePersonOrgRelationInput, PersonOrgRelationServiceProxy } from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';

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

    onSave(event) {        
        this.startLoading(true);
        this.relationServiceProxy.createOrUpdate(
            CreateOrUpdatePersonOrgRelationInput.fromJS({
                personId: this.data.contactId,
                organizationId: this.data.id,
                organizationName: this.data.company,
                relationshipType: PersonOrgRelationType.Employee,
                jobTitle: this.data.title     
            }
        )).pipe(finalize(() => {
            this.finishLoading(true);
        })).subscribe((res) => {
            this.finishLoading(true);
            this.dialogRef.close(true);
        });        
    }
}