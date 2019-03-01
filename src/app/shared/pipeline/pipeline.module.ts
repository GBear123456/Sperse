import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DragulaModule } from 'ng2-dragula/ng2-dragula';
import { PipelineComponent } from './pipeline.component';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { TimeAgoPipe } from 'time-ago-pipe';
import { LeadServiceProxy, PipelineServiceProxy, ActivityServiceProxy } from '@shared/service-proxies/service-proxies';
import { LeadCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { LeadCompleteDialogComponent } from './complete-lead-dialog/complete-lead-dialog.component';

import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { PipelineService } from './pipeline.service';
import { ReplacePipe } from '@shared/common/pipes/replace.pipe';
import { AddRenameMergeDialogComponent } from './add-rename-merge-dialog/add-rename-merge-dialog.component';

@NgModule({
    imports: [
        CommonModule,
        DragulaModule,
        DxDataGridModule,
        DxRadioGroupModule,
        DxTextAreaModule,
        DxNumberBoxModule,
        DxSelectBoxModule,
        MatDialogModule,
        RouterModule,
        DxCheckBoxModule,
        DxTooltipModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        FormsModule
    ],
    declarations: [
        TimeAgoPipe,
        PipelineComponent,
        LeadCancelDialogComponent,
        LeadCompleteDialogComponent,
        ReplacePipe,
        AddRenameMergeDialogComponent
    ],
    exports: [
        PipelineComponent,
        LeadCancelDialogComponent,
        LeadCompleteDialogComponent,
        AddRenameMergeDialogComponent
    ],
    entryComponents: [
        LeadCancelDialogComponent,
        LeadCompleteDialogComponent,
        AddRenameMergeDialogComponent
    ],
    providers: [
        LeadServiceProxy,
        PipelineServiceProxy,
        PipelineService,
        ActivityServiceProxy
    ]
})
export class PipelineModule {
}
