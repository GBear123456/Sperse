/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatTabsModule } from '@angular/material/tabs';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { NgCircleProgressModule } from 'ng-circle-progress';

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
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';
import { SubscriptionComponent } from '@root/bank-code/products/shared/subscription.component/subscription.component';
import { WhyTheyBuyComponent } from './why-they-buy/why-they-buy.component';
import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';
import { ProductsService } from '@root/bank-code/products/products.service';
import { AccessCodeInstructionsModule } from '@shared/common/access-code-instructions/access-code-instructions.module';
import { InplaceEditModule } from '@app/shared/common/inplace-edit/inplace-edit.module';
import { CommonModule as BankCodeCommonModule} from '@root/bank-code/shared/common/common.module';
import { CreateEntityModule } from '@shared/common/create-entity-dialog/create-entity.module';
import { CreateEntityDialogComponent } from '@shared/common/create-entity-dialog/create-entity-dialog.component';
import { DateTimeModule } from '@shared/common/pipes/datetime/datetime.module';

@NgModule({
    imports: [
        AccessCodeInstructionsModule,
        CommonModule,
        BankCodeCommonModule,
        ProductsRoutingModule,
        SidebarModule,
        DxDataGridModule,
        DxTextBoxModule,
        DxSelectBoxModule,
        MatTabsModule,
        BankCodeLettersModule,
        PhoneFormatModule,
        LoadingSpinnerModule,
        NgxExtendedPdfViewerModule,
        NgCircleProgressModule,
        InplaceEditModule,
        NoDataModule,
        CreateEntityModule,
        DateTimeModule
    ],
    declarations: [
        CodeBreakerAiComponent,
        ProductsComponent,
        BankAffiliateComponent,
        BankCardsComponent,
        BankPassComponent,
        BankGearComponent,
        BankTrainerComponent,
        BankVaultComponent,
        SubscriptionComponent,
        WhyTheyBuyComponent
    ],
    providers: [
        ProductsService
    ],
    entryComponents: [ CreateEntityDialogComponent ]
})
export class ProductsModule {}
