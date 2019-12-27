/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatTabsModule } from '@angular/material/tabs';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { ProductsService } from '@root/bank-code/products/products.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { BankPassHostComponent } from '@root/bank-pass-host/bank-pass-host.component';
import { BankPassHostRoutingModule } from '@root/bank-pass-host/bank-pass-host-routing.module';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';
import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';
import { PhoneFormatModule } from '@shared/common/pipes/phone-format/phone-format.module';
import { AccessCodeInstructionsModule } from '@shared/common/access-code-instructions/access-code-instructions.module';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@NgModule({
    imports: [
        AccessCodeInstructionsModule,
        CommonModule,
        DxDataGridModule,
        DxTextBoxModule,
        DxSelectBoxModule,
        BankCodeLettersModule,
        LoadingSpinnerModule,
        NoDataModule,
        PhoneFormatModule,
        BankPassHostRoutingModule,
        MatTabsModule,
        NgCircleProgressModule.forRoot({
            // defaults config
            'radius': 32,
            'space': -5,
            'outerStrokeGradient': false,
            'outerStrokeWidth': 5,
            'innerStrokeWidth': 5,
            'animateTitle': true,
            'animationDuration': 500,
            'showUnits': false,
            'showBackground': false,
            'clockwise': false,
            'titleFontSize': '13',
            'startFromZero': false
        })
    ],
    exports: [],
    declarations: [ BankPassHostComponent ],
    providers: [
        LifecycleSubjectsService,
        ProductsService,
        AppUrlService,
        CacheHelper,
        ClipboardService,
        LoadingService
    ]
})
export class BankPassHostModule {}
