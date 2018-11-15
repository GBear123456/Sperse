import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OffersComponent } from '@root/personal-finance/shared/offers/offers.component';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { StarsRatingComponent } from '@root/personal-finance/shared/offers/stars-rating/stars-rating.component';
import { DxScrollViewModule } from '@root/node_modules/devextreme-angular';
import { OfferDetailsComponent } from '@root/personal-finance/shared/offers/offer-details/offer-details.component';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        MatSelectModule,
        MatRadioModule,
        MatCheckboxModule,
        DxScrollViewModule,
        RoundProgressModule
    ],
    declarations: [
        StarsRatingComponent,
        OffersComponent,
        OfferDetailsComponent
    ],
    bootstrap: [
        OffersComponent
    ],
    providers: [
        OffersService
    ]
})
export class OffersModule {
}
