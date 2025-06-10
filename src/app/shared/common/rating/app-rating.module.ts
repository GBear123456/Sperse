import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxSliderModule } from 'devextreme-angular/ui/slider';

import { AppRatingComponent } from './rating.component';

@NgModule({
    imports: [
        CommonModule,
        DxTooltipModule,
        DxSliderModule
    ],
    exports: [
        AppRatingComponent
    ],
    declarations: [
        AppRatingComponent
    ],
    providers: [],
})
export class AppRatingModule {}