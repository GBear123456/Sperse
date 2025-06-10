import { NgModule } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RatingBarComponent } from './rating-bar.component';

@NgModule({
    imports: [
        MatProgressBarModule
    ],
    exports: [
        RatingBarComponent
    ],
    declarations: [
        RatingBarComponent
    ],
    providers: [],
})
export class RatingBarModule {}
