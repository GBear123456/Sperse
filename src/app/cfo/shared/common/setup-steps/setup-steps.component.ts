import {Component, OnInit, Injector, Input, Output, EventEmitter, ChangeDetectionStrategy} from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { CfoIntroComponent } from '../../cfo-intro/cfo-intro.component';

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
        { caption: 'Permissions', component: '/permissions', visible: this.isInstanceAdmin, isAlwaysActive: false }
    ];
    @Input() HeaderTitle: string = this.l(this._cfoService.initialized ? 'SetupStep_MainHeader' : 'SetupStep_InitialHeader');
    @Input() headerLink: string = '/app/cfo/' + this.instanceType.toLowerCase() + '/start';

    dialogConfig = new MatDialogConfig();

    constructor(injector: Injector,
        public dialog: MatDialog
    ) {
        super(injector);
    }

    ngOnInit(): void {
    }

    onClick(index: number, elem) {
        if (elem.isAlwaysActive || this._cfoService.hasTransactions && elem.component)
            this._router.navigate(['/app/cfo/' + this.instanceType.toLowerCase() + elem.component]);
    }

    getItemClass(index: number) {
        if (index < this.SelectedStepIndex) return 'passed';
        else if (index == this.SelectedStepIndex) return 'current';
        else return '';
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
