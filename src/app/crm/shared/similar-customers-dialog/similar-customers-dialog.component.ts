import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SimilarContactOutput } from 'shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'similar-customers-dialog',
    templateUrl: './similar-customers-dialog.component.html',
    styleUrls: ['./similar-customers-dialog.component.less'],
})
export class SimilarCustomersDialogComponent {

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private router: Router,
        public dialogRef: MatDialogRef<SimilarCustomersDialogComponent>,
        public ls: AppLocalizationService,
        public profileService: ProfileService
    ) {}

    selectSimilarCustomer(similarCustomer: SimilarContactOutput): void {
        this.data.componentRef.close();
        this.dialogRef.close();
        this.router.navigate(
            ['app/crm/contact/' + similarCustomer.id + '/contact-information'],
            { queryParams: { referrer: this.router.url } }
        );
    }

    closeSimilarCustomersDialog() {
        this.dialogRef.close();
    }
}
