/** Core imports */
import { ChangeDetectionStrategy, Component, Output, Input, EventEmitter, OnInit } from '@angular/core';

/** Third party imports */

/** Application imports */
import { AppService } from '@app/app.service';
import { AppPermissions } from '@shared/AppPermissions';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LeftMenuItem } from '@app/shared/common/left-menu/left-menu-item.interface';

@Component({
    templateUrl: './left-menu.component.html',
    styleUrls: ['./left-menu.component.less'],
    selector: 'crm-left-menu',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeftMenuComponent implements OnInit {
    @Input() selectedItemIndex: number;
    @Input() showIntroductionTour = false;
    @Output() openIntro: EventEmitter<any> = new EventEmitter();
    @Output() openPaymentWizard: EventEmitter<any> = new EventEmitter();
    get showIntroTour(): boolean {
        let tenant = this.appSessionService.tenant;
        return !tenant || !tenant.customLayoutType || tenant.customLayoutType == LayoutType.Default;
    }
    leftMenuItems: LeftMenuItem[];
    constructor(
        private appSessionService: AppSessionService,
        private permission: PermissionCheckerService,
        public appService: AppService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.leftMenuItems = [
            {
                caption: this.ls.l('CRMDashboardMenu_ManageClients'),
                component: '/clients',
                showPlus: true,
                visible: this.permission.isGranted(AppPermissions.CRMCustomers),
                iconSrc: 'assets/common/icons/person.svg'
            },
            {
                caption: this.ls.l('CRMDashboardMenu_ManageLeads'),
                component: '/leads',
                showPlus: true,
                visible: this.permission.isGranted(AppPermissions.CRMCustomers),
                iconSrc: 'assets/common/icons/setup-chart.svg'
            },
            {
                caption: this.ls.l('CRMDashboardMenu_ImportYourList'),
                component: '/import-list',
                visible: this.permission.isGranted(AppPermissions.CRMBulkImport),
                iconSrc: 'assets/common/icons/document.svg'
            },
            {
                caption: this.ls.l('CRMDashboardMenu_CustomizeSettings'),
                component: '/editions',
                disabled: true,
                iconSrc: 'assets/common/icons/setup.svg'
            },
            {
                caption: this.ls.l('CRMDashboardMenu_IntroductionTour'),
                visible: this.showIntroTour && this.showIntroductionTour,
                iconSrc: 'assets/common/icons/introduction-tour.svg',
                onClick: () => this.openIntro.emit()
            },
            {
                caption: this.ls.l('CRMDashboardMenu_Dashboard'),
                component: '/dashboard',
                visible: !this.showIntroductionTour,
                iconSrc: './assets/common/icons/statistics.svg'
            },
            {
                caption: this.ls.l('CRMDashboardMenu_CommisionHistory'),
                component: '/commition-history',
                visible: this.appSessionService.tenant && this.appSessionService.tenant.customLayoutType == LayoutType.BankCode,
                iconSrc: './assets/common/icons/dollar.svg'
            }
        ];
    }
    //
    // onClick(event, elem) {
    //     if (event.clientX < 260)
    //         elem.component && this.router.navigate(['/app/crm' + elem.component]);
    //     else if (event.target.classList.contains('add-button'))
    //         this.router.navigate(
    //             ['/app/crm' + elem.component],
    //             { queryParams: { action: 'addNew' }}
    //         );
    // }
}
