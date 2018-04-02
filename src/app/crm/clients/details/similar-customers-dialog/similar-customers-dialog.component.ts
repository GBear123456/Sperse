import { Component, Inject, Injector } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonContactInfoDto, CustomerInfoDto, SimilarCustomerOutput } from 'shared/service-proxies/service-proxies';
import { Router } from '@angular/router';

@Component({
    selector: 'similar-customers-dialog',
    templateUrl: './similar-customers-dialog.component.html',
    styleUrls: ['./similar-customers-dialog.component.less'],
})
export class SimilarCustomersDialogComponent extends AppComponentBase {

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
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<SimilarCustomersDialogComponent>,
        private _router: Router
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    selectSimilarCustomer(similarCustomer: SimilarCustomerOutput): void {
        this.data.componentRef.close();
        this.dialogRef.close();
        this._router.navigate(['app/crm/client/' + similarCustomer.id + '/contact-information']);
    }

    closeSimilarCustomersDialog() {
        this.dialogRef.close();
    }
}
