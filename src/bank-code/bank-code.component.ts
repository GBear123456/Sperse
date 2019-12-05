/** Core imports */
import { Component, ViewContainerRef, OnInit, Injector, OnDestroy, Renderer2, Inject } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { filter, takeUntil } from 'rxjs/operators';

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
    private rootComponent: any;
    public constructor(
        injector: Injector,
        viewContainerRef: ViewContainerRef,
        @Inject(DOCUMENT) private document: any,
        private renderer: Renderer2
    ) {
        super(injector);
        this.viewContainerRef = viewContainerRef;
        this.rootComponent = this.getRootComponent();
        this.titleService.setTitle('');
    }

    closeUserMenuPopup(event) {
        let menu = document.querySelector('user-dropdown-menu li');
        if (menu && menu.classList.contains('m-dropdown--open'))
            menu.classList.remove('m-dropdown--open');
    }

    ngOnInit(): void {
        this.rootComponent.addStyleSheet('', 'https://fonts.googleapis.com/css?family=IBM+Plex+Sans:400,700&display=swap');
        this.renderer.addClass(this.document.body, 'member-area');
        this._router.events.pipe(
            takeUntil(this.destroy$),
            filter((event: Event) => event instanceof NavigationEnd)
        ).subscribe((event: Event) => {
            scrollTo(0, 0);
        });
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        this.renderer.removeClass(this.document.body, 'member-area');
    }
}
