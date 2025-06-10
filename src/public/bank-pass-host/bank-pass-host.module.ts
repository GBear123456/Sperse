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
import { BankPassHostComponent } from '@root/public/bank-pass-host/bank-pass-host.component';
import { BankPassHostRoutingModule } from '@root/public/bank-pass-host/bank-pass-host-routing.module';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';
import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';
import { PhoneFormatModule } from '@shared/common/pipes/phone-format/phone-format.module';
import { AccessCodeInstructionsModule } from '@shared/common/access-code-instructions/access-code-instructions.module';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { InplaceEditModule } from '@app/shared/common/inplace-edit/inplace-edit.module';
import { DocumentServiceProxy, MemberSettingsServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponent } from './app.component';
import { CommonModule as BankCodeCommonModule} from '@root/bank-code/shared/common/common.module';
import { ExportService } from '@shared/common/export/export.service';
import { ExportGoogleSheetService } from '@shared/common/export/export-google-sheets/export-google-sheets';
import { CreateEntityModule } from '@shared/common/create-entity-dialog/create-entity.module';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { ImpersonationService } from '@admin/users/impersonation.service';
import { LinkedAccountService } from '@app/shared/layout/linked-accounts-modal/linked-account.service';
import { DateTimeModule } from '@shared/common/pipes/datetime/datetime.module';

@NgModule({
    imports: [
        AccessCodeInstructionsModule,
        CommonModule,
        DateTimeModule,
        BankCodeCommonModule,
        DxDataGridModule,
        DxTextBoxModule,
        DxSelectBoxModule,
        BankCodeLettersModule,
        LoadingSpinnerModule,
        NoDataModule,
        PhoneFormatModule,
        BankPassHostRoutingModule,
        MatTabsModule,
        InplaceEditModule,
        CreateEntityModule,
        NgCircleProgressModule.forRoot({
            // defaults config
            radius: 40,
            space: -7,
            outerStrokeGradient: false,
            outerStrokeWidth: 7,
            innerStrokeWidth: 7,
            showUnits: false,
            showBackground: false,
            titleFontSize: '18',
            subtitleFontSize: '12.3',
            titleFontWeight: '700',
            subtitleFontWeight: '700',
            startFromZero: false,
            animation: false,
            animateTitle: false,
            animationDuration: 0
        })
    ],
    exports: [],
    declarations: [ AppComponent, BankPassHostComponent ],
    providers: [
        LifecycleSubjectsService,
        ProductsService,
        MemberSettingsServiceProxy,
        AppUrlService,
        CacheHelper,
        ClipboardService,
        LoadingService,
        ExportService,
        ExportGoogleSheetService,
        UserManagementService,
        ImpersonationService,
        LinkedAccountService,
        DocumentServiceProxy,
        { provide: 'shared', useValue: true }
    ]
})
export class BankPassHostModule {}
