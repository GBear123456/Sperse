/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */

/** Application imports */
import { FeatureTreeComponent } from './feature-tree.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        FeatureTreeComponent
    ],
    exports: [
        FeatureTreeComponent
    ]
})

export class FeaturesModule { }