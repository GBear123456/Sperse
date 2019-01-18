import { ChangeDetectionStrategy, Component, Inject, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonOrgRelationShortInfo, ContactInfoDto } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'relation-companies-dialog',
    templateUrl: './relation-companies-dialog.component.html',
    styleUrls: ['./relation-companies-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelationCompaniesDialogComponent extends AppComponentBase {

    displayedCompanies: PersonOrgRelationShortInfo[];

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: ContactInfoDto,
        public dialogRef: MatDialogRef<RelationCompaniesDialogComponent>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.filterList();
    }

    selectCompany(company): void {
        this.dialogRef.close(company);
    }

    addNewCompany() {
        this.dialogRef.close('addCompany');
    }

    filterList(event?) {
        let search = event && event.target.value.toLowerCase() || '';
        this.displayedCompanies = this.data.personContactInfo.orgRelations.filter((item) => {
            return (item.organization.id != this.data.primaryOrganizationContactId)
                && (item.organization.name.toLowerCase().indexOf(search) >= 0)
        });
    }
}
