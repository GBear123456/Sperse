import { Component, OnInit, Injector, OnDestroy } from '@angular/core';

import { MatDialog, MatDialogConfig } from '@angular/material';
import { finalize } from 'rxjs/operators';

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
export class SetupComponent extends CFOComponentBase implements OnInit, OnDestroy {
    private rootComponent: any;
    public headlineConfig;
    isDisabled = false;
    dialogConfig = new MatDialogConfig();

    constructor(injector: Injector,
        private _instanceServiceProxy: InstanceServiceProxy,
        private _syncService: SyncServiceProxy,
        private _appService: AppService,
        public dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    private finishSetup() {
        this._cfoService.instanceChangeProcess(() => this.addAccount());
    }

    private addAccount() {
        this.finishLoading(true);

        if (!this.isInstanceAdmin)
            return;

        this.dialog.open(AccountConnectorDialogComponent, AccountConnectorDialogComponent.defaultConfig).afterClosed().subscribe(e => {
            this.isDisabled = false;
        });
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

    onStart(): void {
        this.isDisabled = true;
        this.startLoading(true);
        if (this._cfoService.instanceId != null)
            this.finishSetup();
        else
            this._instanceServiceProxy.setup(InstanceType[this.instanceType]).subscribe((data) => {
                this.finishSetup();
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
