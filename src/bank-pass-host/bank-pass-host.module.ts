import { NgModule } from '@angular/core';
import { ProductsService } from '@root/bank-code/products/products.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { BankPassHostComponent } from '@root/bank-pass-host/bank-pass-host.component';
import { BankPassHostRoutingModule } from '@root/bank-pass-host/bank-pass-host-routing.module';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxTextBoxModule } from '@root/node_modules/devextreme-angular';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';
import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';
import { PhoneFormatModule } from '@shared/common/pipes/phone-format/phone-format.module';

@NgModule({
    imports: [
        CommonModule,
        DxTextBoxModule,
        DxDataGridModule,
        BankCodeLettersModule,
        LoadingSpinnerModule,
        NoDataModule,
        PhoneFormatModule,
        BankPassHostRoutingModule
    ],
    exports: [],
    declarations: [ BankPassHostComponent ],
    providers: [
        ProductsService,
        AppUrlService,
        CacheHelper,
        LoadingService
    ]
})
export class BankPassHostModule {}
