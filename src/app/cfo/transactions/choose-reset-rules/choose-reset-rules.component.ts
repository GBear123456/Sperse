import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ResetClassificationDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-choose-reset-rules',
    templateUrl: './choose-reset-rules.component.html',
    styleUrls: ['./choose-reset-rules.component.less']
})
export class ChooseResetRulesComponent {
    resetRules = new ResetClassificationDto();

    constructor(
        public dialogRef: MatDialogRef<ChooseResetRulesComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.resetRules.unclassify = true;
    }

    onSave() {
        if (this.resetRules.removeCategoryTree) {
            this.resetRules.unclassify = true;
            this.resetRules.removeRules = true;
        }
        this.dialogRef.close(this.resetRules);
    }

    checkAnyValueIsSet(): boolean {
        return this.resetRules.unclassify ||
            this.resetRules.removeRules ||
            this.resetRules.removeCategoryTree ||
            this.resetRules.removeForecasts;
    }
}
