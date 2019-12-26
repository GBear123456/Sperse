/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

/** Third party imports */
import { MatTabsModule } from '@angular/material/tabs';
import { DxDataGridModule } from '../../../../../src/node_modules/devextreme-angular/ui/data-grid';
import { DxTextBoxModule } from '../../../../../src/node_modules/devextreme-angular/ui/text-box';
import { DxSelectBoxModule } from '../../../../../src/node_modules/devextreme-angular/ui/select-box';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { ProductsService } from '@root/bank-code/products/products.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { BankPassHostComponent } from './bank-pass-host.component';
import { BankPassHostRoutingModule } from './bank-pass-host-routing.module';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';
import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';
import { PhoneFormatModule } from '@shared/common/pipes/phone-format/phone-format.module';
import { AccessCodeInstructionsModule } from '@shared/common/access-code-instructions/access-code-instructions.module';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    SessionServiceProxy,
    MemberSubscriptionServiceProxy, LocalizationServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AbpModule } from '@abp/abp.module';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';
import { TitleService } from '@shared/common/title/title.service';
import { AppConsts } from '@shared/AppConsts';
import { LocalizationResolver } from '@shared/common/localization-resolver';

@NgModule({
    imports: [
        AbpModule,
        AccessCodeInstructionsModule,
        CommonModule,
        DxDataGridModule,
        DxTextBoxModule,
        DxSelectBoxModule,
        BankCodeLettersModule,
        LoadingSpinnerModule,
        HttpClientModule,
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

    ]
})
export class BankPassHostModule {
    constructor(ls: AppLocalizationService, localizationResolver: LocalizationResolver) {
        ls.localizationSourceName = 'Platform';
        localizationResolver.checkLoadLocalization('Platform').subscribe();
    }
}
