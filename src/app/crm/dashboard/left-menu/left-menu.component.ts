/** Core imports */
import { ChangeDetectionStrategy, Component, Injector, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';

@Component({
    templateUrl: './left-menu.component.html',
    styleUrls: ['./left-menu.component.less'],
    selector: 'left-menu',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardMenuComponent extends AppComponentBase {
    @Output() openIntro: EventEmitter<any> = new EventEmitter();
    @Output() openPaymentWizard: EventEmitter<any> = new EventEmitter();
    items = [];
    public abp = abp;
    constructor(injector: Injector,
                private _router: Router,
                public appService: AppService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.items = [
            {
                caption: 'ManageClients',
                component: '/clients',
                showPlus: true,
                hidden: !this.permission.isGranted('Pages.CRM.Customers')
            },
            {
                caption: 'ManageLeads',
                component: '/leads',
                showPlus: true,
                hidden: !this.permission.isGranted('Pages.CRM.Customers')
            },
            {
                caption: 'ImportYourList',
                component: '/import-list',
                hidden: !this.permission.isGranted('Pages.CRM.BulkImport')
            },
            {
                caption: 'CustomizeSettings',
                component: '/editions',
                disabled: true
            }
        ];
    }

    onClick(event, elem, i) {
        if (elem.caption === 'PaymentWizard') {
            this.openPaymentWizard.emit();
            return;
        }

        if (elem.disabled)
            return;

        if (event.clientX < 260)
            elem.component && this._router.navigate(
                ['/app/crm' + elem.component]);
        else if (event.target.classList.contains('add-button'))
            this._router.navigate(['/app/crm' + elem.component],
                {queryParams: {action: 'addNew'}});
    }
}
