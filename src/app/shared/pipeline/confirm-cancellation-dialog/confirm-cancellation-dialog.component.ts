import { Component, Injector, OnInit, ViewChild } from '@angular/core';

import { DxRadioGroupComponent, DxTextAreaComponent } from 'devextreme-angular';
import * as _ from 'underscore';

import { LeadServiceProxy } from '@shared/service-proxies/service-proxies';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';

@Component({
    selector: 'confirm-cancellation-dialog',
    templateUrl: 'confirm-cancellation-dialog.component.html',
    styleUrls: ['confirm-cancellation-dialog.component.less']
})
export class LeadCancelDialogComponent extends ConfirmDialogComponent implements OnInit {
    @ViewChild(DxRadioGroupComponent) radioComponent: DxRadioGroupComponent;
    @ViewChild(DxTextAreaComponent) textComponent: DxTextAreaComponent;
    reasons: any = [];
    comment: string;
    reasonId: string;

    constructor(
        injector: Injector,
        private _leadService: LeadServiceProxy
    ) {
        super(injector);

        _leadService.getCancellationReasons().subscribe((result) => {
            this.reasons = result && result.items;
        });
    }

    ngOnInit() {}

    confirm() {
        if (!this.validateReason(this.comment))
            return;

        this.dialogRef.close({
            reasonId: this.reasonId,
            comment: this.comment
        });
    }

    validateReason(comment) {
        let reason = _.findWhere(this.reasons, {id: this.reasonId});

        let isReasonSelected = reason ? true : false;
        this.setIsValidOption(this.radioComponent, isReasonSelected);
        if (!isReasonSelected)
            return false;

        let isCommentValid = !reason.isCommentRequired || comment;
        this.setIsValidOption(this.textComponent, isCommentValid);
        return isCommentValid;
    }

    setIsValidOption(component, value) {
        component.instance.option('isValid', value);
    }

    onCommentKeyUp(event) {
        let comment = event.element.getElementsByTagName('textarea')[0].value;
        this.validateReason(comment);
    }
}
