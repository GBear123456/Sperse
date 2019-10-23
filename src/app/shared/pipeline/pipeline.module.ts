/** Core imports */
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { DragulaModule } from 'ng2-dragula/ng2-dragula';
import { PipelineComponent } from './pipeline.component';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';

/** Application imports */
import { OrderServiceProxy, LeadServiceProxy, PipelineServiceProxy,
    ActivityServiceProxy } from '@shared/service-proxies/service-proxies';
import { EntityCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { LeadCompleteDialogComponent } from './complete-lead-dialog/complete-lead-dialog.component';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { PipelineService } from './pipeline.service';
import { ReplacePipe } from '@shared/common/pipes/replace.pipe';
import { AddRenameMergeDialogComponent } from './add-rename-merge-dialog/add-rename-merge-dialog.component';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
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
        BankCodeLettersModule,
        FormsModule,
        LoadingSpinnerModule
    ],
    declarations: [
        PipelineComponent,
        EntityCancelDialogComponent,
        LeadCompleteDialogComponent,
        ReplacePipe,
        AddRenameMergeDialogComponent
    ],
    exports: [
        PipelineComponent,
        EntityCancelDialogComponent,
        LeadCompleteDialogComponent,
        AddRenameMergeDialogComponent
    ],
    entryComponents: [
        EntityCancelDialogComponent,
        LeadCompleteDialogComponent,
        AddRenameMergeDialogComponent
    ],
    providers: [
        OrderServiceProxy,
        LeadServiceProxy,
        PipelineServiceProxy,
        PipelineService,
        ActivityServiceProxy
    ]
})
export class PipelineModule {
}
