import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragulaModule } from 'ng2-dragula/ng2-dragula';
import { PipelineComponent } from './pipeline.component';
import { DxDataGridModule, DxRadioGroupModule, DxTextAreaModule, DxCheckBoxModule } from 'devextreme-angular';
import { TimeAgoPipe } from 'time-ago-pipe';
import { LeadServiceProxy, PipelineServiceProxy } from '@shared/service-proxies/service-proxies';
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
        MatDialogModule,
        RouterModule,
        DxCheckBoxModule
    ],
    declarations: [
        TimeAgoPipe,
        PipelineComponent,
        LeadCancelDialogComponent
    ],
    exports: [
        PipelineComponent,
        LeadCancelDialogComponent
    ],
    entryComponents: [
        LeadCancelDialogComponent
    ],
    providers: [
        LeadServiceProxy,
        PipelineServiceProxy,
        PipelineService
    ]
})
export class PipelineModule {
}
