/** Core imports */
import { ChangeDetectionStrategy, Component, Output, Input, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppPermissions } from '@shared/AppPermissions';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PermissionCheckerService } from 'abp-ng2-module';
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LeftMenuItem } from '@app/shared/common/left-menu/left-menu-item.interface';
import { AppFeatures } from '@shared/AppFeatures';
import { TenantSettingsWizardComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-wizard.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { ContactGroup } from '@shared/AppEnums';

@Component({
    templateUrl: './left-menu.component.html',
    styleUrls: ['./left-menu.component.less'],
    selector: 'crm-left-menu',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeftMenuComponent implements OnInit {
    @Input() selectedItemIndex: number;
    @Input() showIntroductionTour = false;
    @Input() currentContactGroup: ContactGroup;
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
        private permissionChecker: AppPermissionService,
        private feature: FeatureCheckerService,
        private dialog: MatDialog,
        public appService: AppService,
        public ls: AppLocalizationService,
        private changeDetector: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        this.initMenuItems();
    }

    initMenuItems() {
        this.leftMenuItems = [
            {
                caption: this.ls.l('MySubscriptions'),
                visible: !this.appService.isHostTenant,
                iconSrc: 'assets/common/icons/similar-contacts.svg',
                isModalDialog: true,
                onClick: () => this.openPaymentWizard.emit()
            },
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
                showPlus: this.currentContactGroup ? 
                    this.permissionChecker.checkCGPermission([this.currentContactGroup]) :
                    !!this.permissionChecker.getFirstManageCG(),
                visible: !!this.permissionChecker.getFirstAvailableCG(),
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
                iconSrc: 'assets/common/icons/setup.svg',
                isModalDialog: true,
                onClick: () => this.openProfileTenantSettingsDialog(),
                visible: this.appService.isHostTenant ?
                    this.permission.isGranted(AppPermissions.AdministrationHostSettings) :
                    this.permission.isGranted(AppPermissions.AdministrationTenantSettings)
            },
            {
                caption: this.ls.l('CRMDashboardMenu_IntroductionTour'),
                visible: this.showIntroTour && this.showIntroductionTour,
                iconSrc: 'assets/common/icons/introduction-tour.svg',
                isModalDialog: true,
                onClick: () => this.openIntro.emit()
            },
            {
                caption: this.ls.l('CRMDashboardMenu_Dashboard'),
                component: '/dashboard',
                visible: !this.showIntroductionTour,
                iconSrc: './assets/common/icons/statistics.svg'
            },
            {
                caption: this.ls.l('CRMDashboardMenu_CommissionHistory'),
                component: '/commission-history',
                visible: this.feature.isEnabled(AppFeatures.CRMCommissions)
                    && this.permission.isGranted(AppPermissions.CRMAffiliatesCommissions),
                iconSrc: './assets/common/icons/dollar.svg'
            },
            {
                component: '/documents',
                caption: this.ls.l('CRMDashboardMenu_Documents'),
                visible: this.permission.isGranted(AppPermissions.CRMFileStorageTemplates),
                iconSrc: './assets/common/icons/folder.svg'
            }
        ];
        this.changeDetector.detectChanges();
    }

    openProfileTenantSettingsDialog() {
        this.dialog.open(TenantSettingsWizardComponent, {
            width: '960px',
            height: '700px',
            id: 'tenant-settings',
            panelClass: ['tenant-settings']
        });
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
