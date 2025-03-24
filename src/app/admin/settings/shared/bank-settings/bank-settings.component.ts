/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { NotifyService } from 'abp-ng2-module';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissions } from '@shared/AppPermissions';
import { TenantPaymentSettingsServiceProxy, BankTransferSettings, BeneficiaryInfo } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'bank-settings',
    templateUrl: 'bank-settings.component.html',
    styleUrls: [ 'bank-settings.component.less' ],
    providers: [ TenantPaymentSettingsServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankSettingsComponent {
    settings = new BankTransferSettings({
        bankAccountNumber: undefined,
        bankRoutingNumberForACH: undefined,
        bankRoutingNumber: undefined,
        swiftCodeForUSDollar: undefined,
        swiftCode: undefined,
        beneficiaryInfo: new BeneficiaryInfo(),
        beneficiaryBank: new BeneficiaryInfo()
    });
    isManageUnallowed = !this.permission.isGranted(AppPermissions.CRMSettingsConfigure);

    constructor(
        private notifyService: NotifyService,
        private settingsProxy: TenantPaymentSettingsServiceProxy,
        private permission: AppPermissionService,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
    ) {
        this.settingsProxy.getBankTransferSettings().subscribe(res => {
            changeDetectorRef.markForCheck();
            this.settings = res;
        });
    }

    save() {
        this.settingsProxy.updateBankTransferSettings(this.settings).subscribe(() => {
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
        });
    }
}