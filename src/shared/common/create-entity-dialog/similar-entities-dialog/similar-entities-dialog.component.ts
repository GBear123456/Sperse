import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SimilarContactOutput } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'similar-entities-dialog',
    templateUrl: './similar-entities-dialog.component.html',
    styleUrls: ['./similar-entities-dialog.component.less'],
})
export class SimilarEntitiesDialogComponent {

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private router: Router,
        public dialogRef: MatDialogRef<SimilarEntitiesDialogComponent>,
        public ls: AppLocalizationService,
        public profileService: ProfileService
    ) {}

    selectSimilarEntity(similarEntity: SimilarContactOutput): void {
        this.data.componentRef.close();
        this.dialogRef.close();
        this.router.navigate(
            ['app/crm/contact/' + similarEntity.id + '/contact-information'],
            { queryParams: { referrer: this.router.url } }
        );
    }

    closeSimilarCustomersDialog() {
        this.dialogRef.close();
    }
}
