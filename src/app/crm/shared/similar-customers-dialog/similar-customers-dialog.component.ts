import { Component, Inject, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { SimilarContactGroupOutput } from 'shared/service-proxies/service-proxies';
import { Router } from '@angular/router';

@Component({
    selector: 'similar-customers-dialog',
    templateUrl: './similar-customers-dialog.component.html',
    styleUrls: ['./similar-customers-dialog.component.less'],
})
export class SimilarCustomersDialogComponent extends AppComponentBase {

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<SimilarCustomersDialogComponent>,
        private _router: Router
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    selectSimilarCustomer(similarCustomer: SimilarContactGroupOutput): void {
        this.data.componentRef.close();
        this.dialogRef.close();
        this._router.navigate(['app/crm/client/' + similarCustomer.id + '/contact-information'],
            { queryParams: { referrer: this._router.url } });
    }

    closeSimilarCustomersDialog() {
        this.dialogRef.close();
    }
}
