import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OffersComponent } from '@root/personal-finance/member-area/offers/offers.component';
import { MatSelectModule } from '@angular/material/select';
import { StarsRatingComponent } from '@root/personal-finance/member-area/offers/stars-rating/stars-rating.component';
import { MatCheckboxModule } from '@angular/material';
import { DxScrollViewModule } from '@root/node_modules/devextreme-angular';

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        MatSelectModule,
        MatCheckboxModule,
        DxScrollViewModule
    ],
    declarations: [
        StarsRatingComponent,
        OffersComponent
    ],
    bootstrap: [
        OffersComponent
    ]
})
export class OffersModule {
}
