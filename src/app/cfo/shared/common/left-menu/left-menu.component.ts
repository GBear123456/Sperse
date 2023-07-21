/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostBinding,
    Injector,
    Input,
    OnInit,
    Output
} from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { map } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { InstanceType, LayoutType } from '@shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { CfoIntroComponent } from '../../cfo-intro/cfo-intro.component';
import { CFOService } from '@shared/cfo/cfo.service';
import { LeftMenuItem } from '@app/shared/common/left-menu/left-menu-item.interface';
import { GetStatusOutput } from '@shared/service-proxies/service-proxies';
import { LayoutService } from '@app/shared/layout/layout.service';

@Component({
    templateUrl: './left-menu.component.html',
    styleUrls: ['./left-menu.component.less'],
    selector: 'cfo-left-menu',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeftMenuComponent extends CFOComponentBase implements OnInit{
    @HostBinding('class.show-left-bar') showLeftBar;
    @HostBinding('class.mobile') mobile: boolean = AppConsts.isMobile;
    @Input() collapsed = true;
    @Input() selectedItemIndex: number;
    @Input() showIntroductionTourLink = false;
    @Input() items: LeftMenuItem[];
    @Input() headerTitle: string = this.l(this.cfoService.initialized ? 'SetupStep_MainHeader' : 'SetupStep_InitialHeader');
    @Input() headerLink: string = this.instanceUri + '/start';
    @Output() onToggle: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() collapsedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    get showIntroTour(): boolean {
        let tenant = this.appSessionService.tenant;
        return !tenant || !tenant.customLayoutType || tenant.customLayoutType == LayoutType.Default;
    }
    private dialogConfig = new MatDialogConfig();

    constructor(
        injector: Injector,
        public layoutService: LayoutService,
        private appSessionService: AppSessionService,
        public dialog: MatDialog,
        public cfoService: CFOService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.showLeftBar = this.layoutService.showLeftBar;
        if (!this.items || !this.items.length) {
            this.items = [
                {
                    caption: this.l('SetupStep_FinancialAccounts'),
                    component: '/linkaccounts',
                    visible: this.cfoService.currentInstanceStatus$.pipe(
                        map((instanceStatus: GetStatusOutput) => {
                            return instanceStatus.hasTransactions && this.cfoService.accessAllDepartments;
                        })
                    ),
                    iconSrc: './assets/common/icons/document.svg'
                },
                {
                    caption: this.l('SetupStep_BusinessEntity'),
                    component: '/business-entities',
                    visible: this.cfoService.accessAllDepartments,
                    iconSrc: './assets/common/icons/person.svg'
                },
                {
                    caption: this.l('SetupStep_Chart'),
                    component: '/chart-of-accounts',
                    iconSrc: './assets/common/icons/setup-chart.svg'
                },
                {
                    caption: this.l('SetupStep_Rules'),
                    component: '/rules',
                    visible: this.appSessionService.tenant
                    && this.appSessionService.tenant.customLayoutType == LayoutType.AdvicePeriod
                        ? false
                        : (this.cfoService.currentInstanceStatus$.pipe(
                            map((instanceStatus: GetStatusOutput) => {
                                return instanceStatus.hasTransactions
                                    && this.cfoService.hasCategorizationSupported
                                    && this.cfoService.accessAllDepartments;
                            })
                        )),
                    iconSrc: './assets/common/icons/setup.svg'
                },
                {
                    caption: this.l('SetupStep_Permissions'),
                    component: '/permissions',
                    visible: (this.cfoService.currentInstanceStatus$.pipe(
                        map((instanceStatus: GetStatusOutput) => {
                            return instanceStatus.hasTransactions
                                && this.cfoService.isInstanceAdmin
                                && this.cfoService.instanceType == InstanceType.Main;
                        })
                    )),
                    iconSrc: './assets/common/icons/person.svg'
                },
                {
                    caption: this.l('SetupStep_InvitedUsers'),
                    component: '/users',
                    visible: this.cfoService.instanceId && this.cfoService.isMemberAccessManage,
                    iconSrc: './assets/common/icons/people.svg'
                },
                {
                    caption: this.l('SetupStep_IntroductionTour'),
                    visible: this.showIntroTour && this.showIntroductionTourLink && this.cfoService.instanceType == 'Main',
                    onClick: this.showIntro.bind(this),
                    iconSrc: './assets/common/icons/introduction-tour.svg'
                }
            ];
        }
        if (!this.showIntroductionTourLink && this.instanceType == 'Main') {
            this.items.push({
                caption: this.l('SetupStep_YourDashboard'),
                component: '/start',
                iconSrc: './assets/common/icons/statistics.svg'
            });
        }
    }

    showIntro() {
        this.dialogConfig.height = '655px';
        this.dialogConfig.width = '880px';
        this.dialogConfig.id = this.dialogConfig.backdropClass = 'cfo-intro';
        this.dialogConfig.panelClass = ['cfo-intro', 'dashboard'];
        this.dialogConfig.data = { alreadyStarted: true };
        this.dialog.open(CfoIntroComponent, this.dialogConfig);
    }

    toggle(collapsed: boolean) {
        this.onToggle.emit(collapsed);
        this.collapsedChange.emit(collapsed);
    }
}