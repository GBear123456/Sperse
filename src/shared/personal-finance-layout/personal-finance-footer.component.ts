import { Component, Injector, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConditionsType } from '@shared/AppEnums';
import { MatDialog } from '@angular/material';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';

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

        this.hasPfmAppFeature = this.feature.isEnabled('PFM.Applications');
        this.showDefaultFooter = this.isMemberArea() && !this.hasPfmAppFeature;
    }

    isMemberArea() {
        return Boolean(this.appSession.userId);
    }

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: { type: type }});
    }
}
