import { NgModule } from '@angular/core';
import { ExpandButtonComponent } from '@app/shared/common/expand-button/expand-button.component';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';

@NgModule({
    imports: [
        DxSelectBoxModule,
        DxButtonModule,
        DxTextBoxModule
    ],
    declarations: [
        ExpandButtonComponent
    ],
    exports: [
        ExpandButtonComponent
    ]
})
export class ExpandButtonModule {}
