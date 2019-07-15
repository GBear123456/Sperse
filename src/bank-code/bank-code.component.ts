/** Core imports */
import { Component, HostBinding, ViewContainerRef, OnInit, OnDestroy, Injector } from '@angular/core';

/** Third party imports */
import { AbpSessionService } from '@abp/session/abp-session.service';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: './bank-code.component.html',
    styleUrls: ['./bank-code.component.less'],
    host: {
        '(window:blur)': 'closeUserMenuPopup($event)'
    }
})
export class BankCodeComponent extends AppComponentBase implements OnInit, OnDestroy {
    private viewContainerRef: ViewContainerRef;
    public constructor(
        injector: Injector,
        viewContainerRef: ViewContainerRef
    ) {
        super(injector);
        this.viewContainerRef = viewContainerRef;
    }

    closeUserMenuPopup(event) {
        let menu = document.querySelector('user-dropdown-menu li');
        if (menu && menu.classList.contains('m-dropdown--open'))
            menu.classList.remove('m-dropdown--open');
    }

    ngOnInit(): void {
        this.getRootComponent().overflowHidden(true);
    }

    ngOnDestroy() {
        this.getRootComponent().overflowHidden();
    }
}
