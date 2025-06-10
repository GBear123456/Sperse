/** Core imports */
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import kebabCase from 'lodash/kebabCase';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-pfm-intro',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './pfm-intro.component.html',
    styleUrls: [
        '../../../shared/common/styles/close-button.less',
        './pfm-intro.component.less'
    ]
})
export class PfmIntroComponent {
    readonly bankNames: string[] = [
        'PNC',
        'Fidelity',
        'Wells Fargo',
        'Bank of America',
        'UCBank',
        'Ameritrade',
        'Vanguard',
        'Chase',
        'Citibank',
        'Navy Federal'
    ];

    constructor(
        private dialogRef: MatDialogRef<PfmIntroComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    getBankLogoName(bankName: string): string {
        return kebabCase(bankName);
    }

    closeDialog(addAccount?: boolean) {
        this.dialogRef.close(addAccount);
    }

    onNext() {
        this.closeDialog(true);
    }

}
