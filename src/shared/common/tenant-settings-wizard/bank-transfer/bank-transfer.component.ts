<<<<<<< HEAD
/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component
} from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    TenantPaymentSettingsServiceProxy,
    BankTransferSettings
} from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

@Component({
    selector: 'bank-transfer',
    templateUrl: 'bank-transfer.component.html',
    styleUrls: [
        '../shared/styles/common.less',
        'bank-transfer.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankTransferComponent implements ITenantSettingsStepComponent {
    settings: BankTransferSettings;

    constructor(
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.tenantPaymentSettingsProxy.getBankTransferSettings().subscribe(settings => {
            this.settings = settings;
            this.changeDetectorRef.detectChanges();
        });
    }

    save(): Observable<any> {
        return this.tenantPaymentSettingsProxy.updateBankTransferSettings(this.settings);
    }
=======
/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component
} from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    TenantPaymentSettingsServiceProxy,
    BankTransferSettings
} from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

@Component({
    selector: 'bank-transfer',
    templateUrl: 'bank-transfer.component.html',
    styleUrls: [
        '../shared/styles/common.less',
        'bank-transfer.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankTransferComponent implements ITenantSettingsStepComponent {
    settings: BankTransferSettings;

    constructor(
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.tenantPaymentSettingsProxy.getBankTransferSettings().subscribe(settings => {
            this.settings = settings;
            this.changeDetectorRef.detectChanges();
        });
    }

    save(): Observable<any> {
        return this.tenantPaymentSettingsProxy.updateBankTransferSettings(this.settings);
    }
>>>>>>> f999b481882149d107812286d0979872df712626
}