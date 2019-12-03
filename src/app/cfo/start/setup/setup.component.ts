/** Core imports */
import { AfterViewInit, Component, OnInit, Injector, OnDestroy, Output, EventEmitter } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { InstanceServiceProxy, InstanceType } from 'shared/service-proxies/service-proxies';
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';

@Component({
    selector: 'setup',
    templateUrl: './setup.component.html',
    styleUrls: ['./setup.component.less'],
    animations: [appModuleAnimation()]
})
export class SetupComponent extends CFOComponentBase implements AfterViewInit, OnInit, OnDestroy {
    @Output() onOpenIntro: EventEmitter<boolean> = new EventEmitter<boolean>();
    private rootComponent: any;
    public headlineConfig;
    isDisabled = !this.isInstanceAdmin;
    setupContainerElement: Element;
    showGetStartedSection$: Observable<boolean> = !this._cfoService.isMainInstanceType
        ? of(true)
        : this._cfoService.hasAccountsAccess$;

    constructor(
        injector: Injector,
        private instanceServiceProxy: InstanceServiceProxy,
        public dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    ngOnInit(): void {
        this.headlineConfig = {
            names: [this.l('Setup_Title')],
            iconSrc: 'assets/common/icons/magic-stick-icon.svg',
            buttons: []
        };
        this.rootComponent.overflowHidden(true);
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    ngAfterViewInit() {
        this.setupContainerElement = this.getElementRef().nativeElement.querySelector('.cashflow-setup');
    }

    private addAccount() {
        this.finishLoading(false, this.setupContainerElement);

        if (!this.isInstanceAdmin)
            return;

        const dialogConfig = { ...AccountConnectorDialogComponent.defaultConfig, ...{
            data: { loadingContainerElement: this.setupContainerElement }
        }};

        this.dialog.open(AccountConnectorDialogComponent, dialogConfig).afterClosed().subscribe(() => {
            this.isDisabled = !this.isInstanceAdmin;
        });
    }

    onStart(): void {
        this.isDisabled = true;
        this.startLoading(false, this.setupContainerElement);
        this.addAccount();
        if (this._cfoService.instanceId == null)
            this.instanceServiceProxy.setup(InstanceType[this.instanceType], undefined).pipe(
                switchMap(() => this._cfoService.instanceChangeProcess()),
                catchError(() => of(this.isDisabled = !this.isInstanceAdmin))
            ).subscribe();
    }

    ngOnDestroy() {
        this.rootComponent.removeScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.removeScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
        this.rootComponent.overflowHidden();
    }
}
