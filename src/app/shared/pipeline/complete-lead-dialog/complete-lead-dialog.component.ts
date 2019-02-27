import { Component, Injector, ViewChild } from '@angular/core';

import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxTextAreaComponent } from 'devextreme-angular/ui/text-area';

import * as _ from 'underscore';

import { PipelineService } from '../pipeline.service';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'complete-lead-dialog',
    templateUrl: 'complete-lead-dialog.component.html',
    styleUrls: ['complete-lead-dialog.component.less']
})
export class LeadCompleteDialogComponent extends ConfirmDialogComponent {
    @ViewChild(DxSelectBoxComponent) stageComponent: DxSelectBoxComponent;
    @ViewChild(DxTextAreaComponent) textComponent: DxTextAreaComponent;
    orderStages: any = [];
    orderStage: string;
    comment: string;
    amount: string;

    constructor(
        injector: Injector,
        private _pipelineService: PipelineService
    ) {
        super(injector);

        _pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.order)
            .subscribe((definitions) => {
                this.orderStages = definitions.stages;
            }
        );
    }

    confirm() {
        this.dialogRef.close({
            amount: this.amount,
            comment: this.comment,
            stage: this.orderStage
        });
    }

    orderStageChanged($event) {
    }
}
