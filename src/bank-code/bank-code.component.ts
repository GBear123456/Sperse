/** Core imports */
import { Component, ViewContainerRef, OnInit, OnDestroy, Injector } from '@angular/core';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: './bank-code.component.html',
    styleUrls: [
        '../account/layouts/bank-code/bank-code-dialog.component.less',
        './bank-code.component.less',
        '../shared/aviano-sans-font.less'
    ],
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
        // this.getRootComponent().overflowHidden(true);
    }

    ngOnDestroy() {
        // this.getRootComponent().overflowHidden();
    }
}
