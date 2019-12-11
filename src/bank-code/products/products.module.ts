/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

/** Application imports */
import { ProductsComponent } from './products.component';
import { ProductsRoutingModule } from '@root/bank-code/products/products-routing.module';
import { CodeBreakerAiComponent } from '@root/bank-code/products/codebreaker-ai/code-breaker-ai.component';
import { BankAffiliateComponent } from '@root/bank-code/products/bank-affiliate/bank-affiliate.component';
import { BankGearComponent } from '@root/bank-code/products/bank-gear/bank-gear.component';
import { BankPassComponent } from '@root/bank-code/products/bank-pass/bank-pass.component';
import { BankTrainerComponent } from '@root/bank-code/products/bank-trainer/bank-trainer.component';
import { BankVaultComponent } from '@root/bank-code/products/bank-vault/bank-vault.component';
import { BankCardsComponent } from '@root/bank-code/products/bank-cards/bank-cards.component';
import { SidebarModule } from '@root/bank-code/shared/sidebar/sidebar.module';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { PhoneFormatModule } from '@shared/common/pipes/phone-format/phone-format.module';
import { DxTextBoxModule } from '@root/node_modules/devextreme-angular';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';
import { BankCodeLayoutModule } from '@root/bank-code/shared/layout/bank-code-layout.module';
import { SubscriptionComponent } from '@root/bank-code/products/shared/subscription.component/subscription.component';
import { WhyTheyBuyComponent } from './why-they-buy/why-they-buy.component';

@NgModule({
    imports: [
        CommonModule,
        ProductsRoutingModule,
        SidebarModule,
        DxDataGridModule,
        DxTextBoxModule,
        BankCodeLettersModule,
        PhoneFormatModule,
        LoadingSpinnerModule,
        BankCodeLayoutModule,
        NgxExtendedPdfViewerModule
    ],
    declarations: [
        CodeBreakerAiComponent,
        ProductsComponent,
        BankAffiliateComponent,
        BankCardsComponent,
        BankGearComponent,
        BankPassComponent,
        BankTrainerComponent,
        BankVaultComponent,
        SubscriptionComponent,
        WhyTheyBuyComponent
    ]
})
export class ProductsModule {}
