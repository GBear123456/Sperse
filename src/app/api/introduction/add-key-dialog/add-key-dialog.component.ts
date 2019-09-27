/** Core imports */
import { Component, Inject, Injector } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { GenerateApiKeyInput } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: 'add-key-dialog.component.html',
    styleUrls: ['add-key-dialog.component.less']
})
export class EditKeyDialog extends AppComponentBase {
    isValid = false;
    validator: any;
    maxCalendarDate = new Date(2038, 0, 19);
    model: GenerateApiKeyInput = new GenerateApiKeyInput();

    constructor(injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<EditKeyDialog>) {
        super(injector);
    }

    onSave(event) {
        if (this.validator.validate().isValid)
            this.dialogRef.close(this.model);
    }

    initValidationGroup(event) {
        this.validator = event.component;
    }
}
