import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DragulaModule} from 'ng2-dragula/ng2-dragula';
import {PipelineComponent} from './pipeline.component';
import {DxDataGridModule} from 'devextreme-angular';

@NgModule({
    imports: [
        CommonModule,
        DragulaModule,
        DxDataGridModule
    ],
    declarations: [
        PipelineComponent
    ],
    exports: [
        PipelineComponent
    ]
})
export class PipelineModule {
}
