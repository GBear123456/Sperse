import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './apply-offer-dialog.component.html',
    styleUrls: [
        '../../common/styles/apply-button.less',
        './apply-offer-dialog.component.less'
    ]
})
export class ApplyOfferDialogComponent implements OnInit {
    processingSteps;
    defaultCompleteInterval = 250;
    completeDelays: number[];
    delayMessages: string[];
    redirectUrl: string;
    currentStepIndex = 0;
    title: string;
    subtitle: string;
    errorMessage: string;
    constructor(
        private dialogRef: MatDialogRef<ApplyOfferDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.processingSteps = this.data.processingSteps;
        this.defaultCompleteInterval = this.data.defaultCompleteInterval || this.defaultCompleteInterval;
        this.completeDelays = this.data.completeDelays;
        this.delayMessages = this.data.delayMessages;
        this.title = this.ls.l(this.data.title);
        this.subtitle = this.ls.l(this.data.subtitle);
    }

    ngOnInit() {
        this.processingSteps.forEach((step, index) => {
            if (!this.completeDelays || (this.completeDelays[index])) {
                setTimeout(
                    () => {
                        this.currentStepIndex = index + 1;
                        if ((index + 1) === this.processingSteps.length) {
                            /** Redirect to the provided link */
                            if (this.data.redirectUrl) {
                                window.open(this.data.redirectUrl, '_blank');
                            }
                            /** Close after 100 ms after last completed step */
                            setTimeout(() => this.dialogRef.close(), 100);
                        }
                    },
                    this.getStepCompleteTimeout(index)
                );
            }
        });
    }

    private getStepCompleteTimeout(stepIndex: number): number {
        return this.completeDelays && this.completeDelays.reduce(
                    (finalTimeout, current, i) => {
                        finalTimeout += i <= stepIndex && !isNaN(current) ? current : 0;
                        return finalTimeout;
                    }, 0)
                    || (stepIndex + 1) * (this.defaultCompleteInterval);
    }

    hideDialog() {
        this.dialogRef.close();
    }
}
