import { Component, Injector, OnInit, HostBinding } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'app-pages-footer',
    templateUrl: './pages-footer.component.html',
    styleUrls: ['./pages-footer.component.less']
})
export class PagesFooterComponent extends AppComponentBase {
    @HostBinding('class.pfm-app') hasPfmAppFeature = false;

    appMenuItems = [
        { url: '', name: 'Terms of Use', action: this.openConditionsDialog.bind(this, { type: ConditionsType.Terms, title: 'Terms of Use' }) },
        { url: '', name: 'Privacy Policy', action: this.openConditionsDialog.bind(this, { type: ConditionsType.Policies})},
        { url: '', name: 'Lender Terms', action: () => {
            this.openConditionsDialog({
                title: 'Lender Terms',
                bodyUrl: AppConsts.appBaseHref + 'assets/documents/lend-space/lender-terms.html',
                downloadDisabled: true
            });
        } },
        { url: '', name: 'About Us', action: () => {
            this.openConditionsDialog({
                    title: 'About Us',
                    bodyUrl: AppConsts.appBaseHref + 'assets/documents/lend-space/about-us.html',
                    downloadDisabled: true,
                    width: '50em'
                });
        } }
    ];
    defaultMenuItems = [
        { url: '/personal-finance/about', name: 'AboutUs' },
        { url: '/personal-finance/contact-us', name: 'ContactUs' },
        { url: '/account/login', name: 'LoginBtn' },
        { url: '/personal-finance/', name: 'GetStarted' }
    ];
    footerMenuItems = [];
    loggedUserId: number;
    currentYear = new Date().getFullYear();
    constructor(
        injector: Injector,
        private dialog: MatDialog
    ) {
        super(injector);

        this.loggedUserId = this.appSession.userId;
        this.hasPfmAppFeature = this.feature.isEnabled('PFM.Applications');
        this.footerMenuItems = this.hasPfmAppFeature ? this.appMenuItems : this.defaultMenuItems;
    }

    openConditionsDialog(data: any) {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: data });
    }
}
