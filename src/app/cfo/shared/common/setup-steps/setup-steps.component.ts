import { Component, OnInit, Injector, Input, ChangeDetectionStrategy } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { CfoIntroComponent } from '../../cfo-intro/cfo-intro.component';
import { PaymentWizardComponent } from '@app/shared/common/payment-wizard/payment-wizard.component';
import { AppService } from '@app/app.service';
import { Module } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './setup-steps.component.html',
    styleUrls: ['./setup-steps.component.less'],
    selector: 'setup-steps',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupStepComponent extends CFOComponentBase implements OnInit {
    @Input() SelectedStepIndex: number;
    @Input() SetupSteps = [
        { caption: 'FinancialAccounts', component: '/linkaccounts', isAlwaysActive: false },
        { caption: 'BusinessEntity', component: '/business-entities', isAlwaysActive: true },
        { caption: 'Chart', component: '/chart-of-accounts', isAlwaysActive: true },
        { caption: 'Rules', component: '/rules', isAlwaysActive: false },
        { caption: 'Permissions', component: '/permissions', visible: this.isInstanceAdmin, isAlwaysActive: false },
        {
            caption: 'PaymentWizard',
            visible: abp.session.multiTenancySide == abp.multiTenancy.sides.TENANT &&
                     this.appService.subscriptionIsFree()
        }
    ];
    @Input() HeaderTitle: string = this.l(this._cfoService.initialized ? 'SetupStep_MainHeader' : 'SetupStep_InitialHeader');
    @Input() headerLink: string = '/app/cfo/' + this.instanceType.toLowerCase() + '/start';

    dialogConfig = new MatDialogConfig();

    constructor(injector: Injector,
        public dialog: MatDialog,
        private appService: AppService
    ) {
        super(injector);
    }

    ngOnInit(): void {
    }

    onClick(index: number, elem) {
        if (elem.caption === 'PaymentWizard') {
            this.showPaymentWizard();
            return;
        }

        if (elem.isAlwaysActive || this._cfoService.hasTransactions && elem.component)
            this._router.navigate(['/app/cfo/' + this.instanceType.toLowerCase() + elem.component]);
    }

    getItemClass(index: number) {
        if (index < this.SelectedStepIndex) return 'passed';
        else if (index == this.SelectedStepIndex) return 'current';
        else return '';
    }

    showPaymentWizard() {
        this.dialog.open(PaymentWizardComponent, {
            height: '655px',
            width: '980px',
            id: 'payment-wizard',
            panelClass: ['payment-wizard', 'setup'],
            data: {
                module: Module.CFO,
                title: this.ls('Platform', 'UpgradeYourSubscription', Module.CFO)
            }
        });
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
