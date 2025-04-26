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
    CommissionSettings,
    Tier2CommissionSource,
    CommissionAffiliateAssignmentMode,
    AffiliateNameGenerationMode
} from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

@Component({
    selector: 'commissions-settings-settings',
    templateUrl: 'commissions-settings.component.html',
    styleUrls: [
        'commissions-settings.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommissionsComponent implements ITenantSettingsStepComponent {
    settings: CommissionSettings;
    tier2SourceOptions = Object.keys(Tier2CommissionSource).map(item => {
        return {
            id: Tier2CommissionSource[item],
            text: this.ls.l(item)
        };
    });
    commissionAffiliateAssignmentModeOptions = Object.keys(CommissionAffiliateAssignmentMode).map(item => {
        return {
            id: CommissionAffiliateAssignmentMode[item],
            text: this.ls.l('AffiliateAssignmentMode_' + item)
        };
    });
    affiliateNameGenerationEntities = Object.keys(AffiliateNameGenerationMode)
        .filter(v => !Number(v))
        .map(item => {
            return {
                id: AffiliateNameGenerationMode[item],
                text: item
            };
        });

    affiliateNameGenerationModes: AffiliateNameGenerationMode[] = [];

    constructor(
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.tenantPaymentSettingsProxy.getCommissionSettings().subscribe(
            (settings: CommissionSettings) => {
                this.settings = settings;
                this.settings.defaultAffiliateRate = this.convertFromPercent(this.settings.defaultAffiliateRate);
                this.settings.defaultAffiliateRateTier2 = this.convertFromPercent(this.settings.defaultAffiliateRateTier2);
                this.setAffiliateNameGenerationModes();
                this.changeDetectorRef.detectChanges();
            }
        );
    }

    convertFromPercent(value: number): number {
        if (value !== null)
            return parseFloat((value * 100).toFixed(2));
        return value;
    }

    convertToPercent(value: number): number {
        if (value !== null)
            return parseFloat((value / 100).toFixed(4));
        return value;
    }

    setAffiliateNameGenerationModes() {
        this.affiliateNameGenerationEntities.forEach(entity => {
            if ((entity.id & this.settings.affiliateNameGenerationMode) == entity.id)
                this.affiliateNameGenerationModes.push(entity.id);
        });
    }

    getAffiliateNameGenerationModes(): any {
        let result = 0;
        this.affiliateNameGenerationModes.forEach(v => {
            result |= v;
        });
        return result;
    }

    save(): Observable<any> {
        this.settings.defaultAffiliateRate = this.convertToPercent(this.settings.defaultAffiliateRate);
        this.settings.defaultAffiliateRateTier2 = this.convertToPercent(this.settings.defaultAffiliateRateTier2);
        this.settings.affiliateNameGenerationMode = this.getAffiliateNameGenerationModes();

        return this.tenantPaymentSettingsProxy.updateCommissionSettings(this.settings);
    }

    isValid(): boolean {
        return true;
    }
}