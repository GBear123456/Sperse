import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragulaModule } from 'ng2-dragula/ng2-dragula';
import { PipelineComponent } from './pipeline.component';
import { DxDataGridModule, DxRadioGroupModule, DxTextAreaModule } from 'devextreme-angular';
import { TimeAgoPipe } from 'time-ago-pipe';
import { LeadServiceProxy } from '@shared/service-proxies/service-proxies';
import { LeadCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';

import { MatDialogModule } from '@angular/material';

import { PipelineService } from './pipeline.service';

@NgModule({
    imports: [
        CommonModule,
        DragulaModule,
        DxDataGridModule,
        DxRadioGroupModule,
        DxTextAreaModule,
        MatDialogModule
    ],
    declarations: [
        TimeAgoPipe,
        PipelineComponent,
        LeadCancelDialogComponent
    ],
    exports: [
        PipelineComponent
    ],
    entryComponents: [
        LeadCancelDialogComponent
    ],
    providers: [
        LeadServiceProxy,
        PipelineService
    ]
})
export class PipelineModule {
}