/** Core imports */
import { ChangeDetectionStrategy, Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */

/** Application imports */
import { AppService } from '@app/app.service';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './left-menu.component.html',
    styleUrls: ['./left-menu.component.less'],
    selector: 'left-menu',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardMenuComponent {
    @Output() openIntro: EventEmitter<any> = new EventEmitter();
    @Output() openPaymentWizard: EventEmitter<any> = new EventEmitter();
    items = [];
    constructor(
        private permission: PermissionCheckerService,
        private router: Router,
        public appService: AppService,
        public ls: AppLocalizationService
    ) {
        this.items = [
            {
                caption: 'ManageClients',
                component: '/clients',
                showPlus: true,
                hidden: !this.permission.isGranted(AppPermissions.CRMCustomers)
            },
            {
                caption: 'ManageLeads',
                component: '/leads',
                showPlus: true,
                hidden: !this.permission.isGranted(AppPermissions.CRMCustomers)
            },
            {
                caption: 'ImportYourList',
                component: '/import-list',
                hidden: !this.permission.isGranted(AppPermissions.CRMBulkImport)
            },
            {
                caption: 'CustomizeSettings',
                component: '/editions',
                disabled: true
            }
        ];
    }

    onClick(event, elem) {
        if (elem.caption === 'PaymentWizard') {
            this.openPaymentWizard.emit();
            return;
        }

        if (elem.disabled)
            return;

        if (event.clientX < 260)
            elem.component && this.router.navigate(
                ['/app/crm' + elem.component]);
        else if (event.target.classList.contains('add-button'))
            this.router.navigate(['/app/crm' + elem.component],
                {queryParams: {action: 'addNew'}});
    }
}
