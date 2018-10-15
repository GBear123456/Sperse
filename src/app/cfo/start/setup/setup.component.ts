import { AfterViewInit, Component, OnInit, Injector, OnDestroy, ElementRef } from '@angular/core';

import { MatDialog, MatDialogConfig } from '@angular/material';

import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { InstanceServiceProxy, InstanceType, SyncServiceProxy } from 'shared/service-proxies/service-proxies';
import { CfoIntroComponent } from '../../shared/cfo-intro/cfo-intro.component';
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { AppService } from '@app/app.service';

@Component({
    selector: 'setup',
    templateUrl: './setup.component.html',
    styleUrls: ['./setup.component.less'],
    animations: [appModuleAnimation()]
})
export class SetupComponent extends CFOComponentBase implements AfterViewInit, OnInit, OnDestroy {
    private rootComponent: any;
    public headlineConfig;
    isDisabled = false;
    dialogConfig = new MatDialogConfig();
    setupContainerElement: Element;

    constructor(injector: Injector,
        private _instanceServiceProxy: InstanceServiceProxy,
        private _syncService: SyncServiceProxy,
        private _appService: AppService,
        public dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.headlineConfig = {
            names: [this.l('Setup_Title')],
            iconSrc: './assets/common/icons/magic-stick-icon.svg',
            buttons: []
        };
        this.rootComponent.overflowHidden(true);
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');

        if (this._appService.hasModuleSubscription())
            setTimeout(() => this.openDialog(), 300);
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

        this.dialog.open(AccountConnectorDialogComponent, dialogConfig).afterClosed().subscribe(e => {
            this.isDisabled = false;
        });
    }

    onStart(): void {
        this.isDisabled = true;
        this.startLoading(false, this.setupContainerElement);
        this.addAccount();
        if (this._cfoService.instanceId == null)
            this._instanceServiceProxy.setup(InstanceType[this.instanceType]).subscribe(data => {
                this._cfoService.instanceChangeProcess();
            });
    }

    ngOnDestroy() {
        this.rootComponent.removeScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.removeScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
        this.rootComponent.overflowHidden();
    }

    openDialog() {
        this.dialogConfig.height = '655px';
        this.dialogConfig.width = '880px';
        this.dialogConfig.id = 'cfo-intro';
        this.dialogConfig.panelClass = ['cfo-intro', 'setup'];
        this.dialogConfig.data = { alreadyStarted: false };

        const dialogRef = this.dialog.open(CfoIntroComponent, this.dialogConfig);
        dialogRef.afterClosed().subscribe(result => {
            if (result && result.isGetStartedButtonClicked) this.onStart();
        });
    }
}
