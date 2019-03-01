import { Component, OnInit, Inject } from '@angular/core';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-add-rename-dialog',
    templateUrl: './add-rename-merge-dialog.component.html',
    styleUrls: ['./add-rename-merge-dialog.component.less']
})
export class AddRenameMergeDialogComponent implements OnInit {
    availableStages: any[];

    constructor(
        @Inject(MAT_DIALOG_DATA) public dialogData: any,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        if (this.dialogData.stages && this.dialogData.stages.length)
            this.availableStages = this.dialogData.stages.filter(item => item.id != this.dialogData.currentStageId);
    }

    onStageSelected(stage) {
        this.dialogData.moveToStage = stage.value;
    }
}
