/** Core imports */
import { Component, Inject } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'cancel-subscription-dialog',
    templateUrl: './cancel-subscription-dialog.component.html',
    styleUrls: ['./cancel-subscription-dialog.component.less']
})
export class CancelSubscriptionDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<CancelSubscriptionDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data,
        public ls: AppLocalizationService
    ) {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}
