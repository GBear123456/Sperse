/** Core imports */
import { Component, Injector, Input, ChangeDetectionStrategy } from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

/** Application imports */
import { InstanceType } from '@shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { CfoIntroComponent } from '../../cfo-intro/cfo-intro.component';

@Component({
    templateUrl: './setup-steps.component.html',
    styleUrls: ['./setup-steps.component.less'],
    selector: 'setup-steps',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetupStepComponent extends CFOComponentBase {
    @Input() SelectedStepIndex: number;
    @Input() SetupSteps = [
        { caption: 'FinancialAccounts', component: '/linkaccounts', isAlwaysActive: false },
        { caption: 'BusinessEntity', component: '/business-entities', isAlwaysActive: true },
        { caption: 'Chart', component: '/chart-of-accounts', isAlwaysActive: true },
        { caption: 'Rules', component: '/rules', isAlwaysActive: false },
        { caption: 'Permissions', component: '/permissions', visible: this.isInstanceAdmin && this.instanceType == InstanceType.Main, isAlwaysActive: false }
    ];
    @Input() HeaderTitle: string = this.l(this._cfoService.initialized ? 'SetupStep_MainHeader' : 'SetupStep_InitialHeader');
    @Input() headerLink: string = this.instanceUri + '/start';

    private dialogConfig = new MatDialogConfig();

    constructor(
        injector: Injector,
        public dialog: MatDialog
    ) {
        super(injector);
    }

    onClick(elem) {
        if (this.stepLinkIsEnabled(elem))
            this._router.navigate([this.instanceUri + elem.component]);
    }

    stepLinkIsEnabled(elem) {
        return elem.isAlwaysActive || this._cfoService.hasTransactions && elem.component;
    }

    showIntro() {
        this.dialogConfig.height = '655px';
        this.dialogConfig.width = '880px';
        this.dialogConfig.id = this.dialogConfig.backdropClass = 'cfo-intro';
        this.dialogConfig.panelClass = ['cfo-intro', 'dashboard'];
        this.dialogConfig.data = { alreadyStarted: true };
        this.dialog.open(CfoIntroComponent, this.dialogConfig);
    }
}
