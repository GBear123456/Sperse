import { Component, Injector, HostBinding, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConditionsType } from '@shared/AppEnums';
import { MatDialog } from '@angular/material';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';

@Component({
    templateUrl: 'footer.component.html',
    styleUrls: ['footer.component.less'],
    selector: 'footer'
})
export class FooterComponent extends AppComponentBase implements OnInit {
    @HostBinding('class.pfm-app') hasPfmAppFeature: boolean = false;

    currentYear = new Date().getFullYear();
    conditions = ConditionsType;
    constructor(
        injector: Injector,
        private dialog: MatDialog
    ) {
        super(injector);

        this.hasPfmAppFeature = this.feature.isEnabled('PFM.Applications');
    }

    ngOnInit(): void {
    }

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: { type: type }});
    }
}
