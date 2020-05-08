/** Core imports */
import { ApplicationRef, ChangeDetectionStrategy, Component, Inject, Injector, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { filter } from 'rxjs/operators';

/** Application imports */
import { TitleService } from '../shared/common/title/title.service';

@Component({
    selector: 'bank-code',
    templateUrl: 'bank-code.component.html',
    styleUrls: [
        '../account/layouts/bank-code/bank-code-dialog.component.less',
        './bank-code.component.less',
        '../shared/aviano-sans-font.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(window:blur)': 'closeUserMenuPopup($event)'
    }
})
export class BankCodeComponent {
    private rootComponent: any;
    constructor(
        injector: Injector,
        applicationRef: ApplicationRef,
        private renderer: Renderer2,
        private router: Router,
        private titleService: TitleService,
        @Inject(DOCUMENT) private document: any
    ) {
        this.rootComponent = injector.get(applicationRef.componentTypes[0]);
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
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            scrollTo(0, 0);
        });
    }

    ngOnDestroy() {
        this.renderer.removeClass(this.document.body, 'member-area');
    }
}