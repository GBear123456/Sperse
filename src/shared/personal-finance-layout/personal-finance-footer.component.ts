import { Component, Injector, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConditionsType } from '@shared/AppEnums';
import { MatDialog } from '@angular/material/dialog';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { AppFeatures } from '@shared/AppFeatures';
import { LayoutType } from '../service-proxies/service-proxies';

@Component({
    templateUrl: 'personal-finance-footer.component.html',
    styleUrls: ['personal-finance-footer.component.less'],
    selector: 'personal-finance-footer'
})
export class PersonalFinanceFooterComponent extends AppComponentBase {
    @HostBinding('class.default') showDefaultFooter = true;

    hasPfmAppFeature = false;
    currentYear = new Date().getFullYear();
    conditions = ConditionsType;
    constructor(
        injector: Injector,
        private dialog: MatDialog
    ) {
        super(injector);

        this.hasPfmAppFeature = this.feature.isEnabled(AppFeatures.PFMApplications) && this.appSession.tenant.customLayoutType == LayoutType.LendSpace;
        this.showDefaultFooter = this.isMemberArea() && !this.hasPfmAppFeature;
    }

    isMemberArea() {
        return Boolean(this.appSession.userId);
    }

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: { type: type }});
    }
}
