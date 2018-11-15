import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OffersComponent } from '@root/personal-finance/member-area/offers/offers.component';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { StarsRatingComponent } from '@root/personal-finance/member-area/offers/stars-rating/stars-rating.component';
import { DxScrollViewModule } from '@root/node_modules/devextreme-angular';
import { OfferDetailsComponent } from '@root/personal-finance/member-area/offers/offer-details/offer-details.component';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { CreditCardsService } from '@root/personal-finance/member-area/offers/credit-cards.service';

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
        CreditCardsService
    ]
})
export class OffersModule {
}
