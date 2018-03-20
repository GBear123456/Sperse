import {AppComponentBase} from '@shared/common/app-component-base';
import {Component, Inject, Injector} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {AppConsts} from '@shared/AppConsts';
import {ResetClassificationDto} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-choose-reset-rules',
    templateUrl: './choose-reset-rules.component.html',
    styleUrls: ['./choose-reset-rules.component.less']
})
export class ChooseResetRulesComponent extends AppComponentBase {
    resetRules = new ResetClassificationDto();

    constructor(
        injector: Injector,
        public dialogRef: MatDialogRef<ChooseResetRulesComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        super(injector, AppConsts.localization.defaultLocalizationSourceName);
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
            this.resetRules.removeForecasts ||
            this.resetRules.recalculateTransactionAttributes;
    }
}
