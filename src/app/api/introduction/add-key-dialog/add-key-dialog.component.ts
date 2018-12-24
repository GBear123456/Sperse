/** Core imports */
import { Component, Inject, Injector, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import * as _ from 'underscore';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    GenerateApiKeyInput
} from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: 'add-key-dialog.component.html',
    styleUrls: ['add-key-dialog.component.less']
})
export class EditKeyDialog extends AppComponentBase {
    isValid = false;
    validator: any;
    model: GenerateApiKeyInput = new GenerateApiKeyInput();

    constructor(injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private elementRef: ElementRef,
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
