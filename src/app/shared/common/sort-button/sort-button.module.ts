import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SortButtonComponent } from '@app/shared/common/sort-button/sort-button.component';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';

@NgModule({
    imports: [
        DxSelectBoxModule,
        DxTextBoxModule,
        CommonModule
    ],
    declarations: [
        SortButtonComponent
    ],
    exports: [
        SortButtonComponent
    ]
})
export class SortButtonModule {}
