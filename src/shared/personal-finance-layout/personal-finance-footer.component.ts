import { Component, HostBinding } from '@angular/core';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';
import { AppFeatures } from '@shared/AppFeatures';
import { LayoutType } from '../service-proxies/service-proxies';
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: 'personal-finance-footer.component.html',
    styleUrls: ['personal-finance-footer.component.less'],
    selector: 'personal-finance-footer'
})
export class PersonalFinanceFooterComponent {
    @HostBinding('class.default') showDefaultFooter = true;

    hasPfmAppFeature = false;
    currentYear = new Date().getFullYear();
    conditions = ConditionsType;
    constructor(
        private feature: FeatureCheckerService,
        private appSession: AppSessionService,
        public conditionsModalService: ConditionsModalService
    ) {
        this.hasPfmAppFeature = this.feature.isEnabled(AppFeatures.PFMApplications) && this.appSession.tenant.customLayoutType == LayoutType.LendSpace;
        this.showDefaultFooter = this.isMemberArea() && !this.hasPfmAppFeature;
    }

    isMemberArea() {
        return Boolean(this.appSession.userId);
    }

    openConditionsDialog(type: ConditionsType) {
        this.conditionsModalService.openModal({
            panelClass: ['slider'],
            data: { type: type }
        });
    }
}
