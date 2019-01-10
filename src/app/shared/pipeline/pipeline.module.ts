import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragulaModule } from 'ng2-dragula/ng2-dragula';
import { PipelineComponent } from './pipeline.component';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { TimeAgoPipe } from 'time-ago-pipe';
import { LeadServiceProxy, PipelineServiceProxy, ActivityServiceProxy } from '@shared/service-proxies/service-proxies';
import { LeadCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';

import { MatDialogModule } from '@angular/material/dialog';

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
        PipelineService,
        ActivityServiceProxy
    ]
})
export class PipelineModule {
}
