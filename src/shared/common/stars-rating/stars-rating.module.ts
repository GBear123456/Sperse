/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Application imports */
import { StarsRatingComponent } from '@shared/common/stars-rating/stars-rating.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        StarsRatingComponent
    ],
    exports: [
        StarsRatingComponent
    ]
})
export class StarsRatingModule {
}
