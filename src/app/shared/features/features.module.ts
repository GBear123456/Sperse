/** Core imports */
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { TreeModule } from 'primeng/tree';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';

/** Application imports */
import { FeatureTreeComponent } from './feature-tree.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        TreeModule,
        DxTreeViewModule,
        DxCheckBoxModule,
        DxTextBoxModule,
        DxNumberBoxModule,
        DxValidatorModule
    ],
    declarations: [
        FeatureTreeComponent
    ],
    exports: [
        FeatureTreeComponent
    ]
})

export class FeaturesModule { }