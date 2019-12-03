/** Core imports */
import { ChangeDetectionStrategy, Component, Injector, AfterViewInit,
    Input, EventEmitter, Output, HostBinding, OnDestroy } from '@angular/core';

/** Third party imports */
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { InstanceType } from '@shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { CfoIntroComponent } from '../../cfo-intro/cfo-intro.component';
import { SetupStepsService } from './setup-steps.service';

@Component({
    templateUrl: './setup-steps.component.html',
    styleUrls: ['./setup-steps.component.less'],
    selector: 'setup-steps',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetupStepComponent extends CFOComponentBase implements OnDestroy, AfterViewInit {
    @HostBinding('class.collapsed') @Input() collapsed = true;
    @HostBinding('class.mobile') mobile: boolean = AppConsts.isMobile;
    @HostBinding('style.visibility') visibility = 'hidden';

    @Input() SelectedStepIndex: number;
    @Input() SetupSteps = [
        { caption: 'FinancialAccounts', component: '/linkaccounts', isAlwaysActive: false, visible: this._cfoService.accessAllDepartments },
        { caption: 'BusinessEntity', component: '/business-entities', isAlwaysActive: true, visible: this._cfoService.accessAllDepartments },
        { caption: 'Chart', component: '/chart-of-accounts', isAlwaysActive: true },
        { caption: 'Rules', component: '/rules', isAlwaysActive: false, visible: this._cfoService.accessAllDepartments },
        { caption: 'Permissions', component: '/permissions', visible: this.isInstanceAdmin && this.instanceType == InstanceType.Main, isAlwaysActive: false }
    ];
    @Input() HeaderTitle: string = this.l(this._cfoService.initialized ? 'SetupStep_MainHeader' : 'SetupStep_InitialHeader');
    @Input() headerLink: string = this.instanceUri + '/start';
    @Input() showIntroductionTourLink = false;
    @Input() showToggleButton =
         !this._cfoService.hasStaticInstance && !this.instanceId ||
         this.isInstanceAdmin || this._cfoService.isMainInstanceType;
    @Output() onToggle: EventEmitter<boolean> = new EventEmitter<boolean>();

    private dialogConfig = new MatDialogConfig();
    private subscription: Subscription;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private setupStepsService: SetupStepsService
    ) {
        super(injector);
        this.subscription = setupStepsService.collapsed$.subscribe(collapsed => {
            this.collapsed = collapsed;
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.visibility = 'visible';
        }, 600);
    }

    onClick(elem) {
        if (this.stepLinkIsEnabled(elem)) {
            if (elem.component) {
                this._router.navigate([this.instanceUri + elem.component]);
            } else if (elem.onClick) {
                this.SelectedStepIndex = this.SetupSteps.findIndex(step => step === elem);
                elem.onClick(elem);
            }
        }
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

    toggle() {
        this.setupStepsService.toggle();
        this.onToggle.emit(!this.collapsed);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
