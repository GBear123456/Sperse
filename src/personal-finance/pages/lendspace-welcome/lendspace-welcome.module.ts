import { NgModule } from '@angular/core';
import { LendspaceWelcomeComponent } from '@root/personal-finance/pages/lendspace-welcome/lendspace-welcome.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutModule } from '@root/personal-finance/shared/layout/layout.module';
import { RecommendedCardsComponent } from './recommended-cards/recommended-cards.component';
import { RecommendedLendersComponent } from './recommended-lenders/recommended-lenders.component';
import { RecommendedArticlesComponent } from './recommended-articles/recommended-articles.component';
import { FreeCheckingComponent } from './free-checking/free-checking.component';
import { ShopNowComponent } from './shop-now/shop-now.component';

@NgModule({
    imports: [
        CommonModule,
        LayoutModule,
        RouterModule.forChild([{
            path: '',
            component: LendspaceWelcomeComponent
        }])
    ],
    declarations: [
        LendspaceWelcomeComponent,
        RecommendedCardsComponent,
        RecommendedLendersComponent,
        RecommendedArticlesComponent,
        FreeCheckingComponent,
        ShopNowComponent
    ]
})
export class LendspaceWelcomeModule {}
