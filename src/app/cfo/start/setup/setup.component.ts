import { Component, OnInit, Injector, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { MatDialog, MatDialogConfig } from '@angular/material';
import { finalize } from 'rxjs/operators';

import { QuovoService } from '@app/cfo/shared/common/quovo/QuovoService';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { InstanceServiceProxy, InstanceType, SyncServiceProxy } from 'shared/service-proxies/service-proxies';
import { CfoIntroComponent } from '../../shared/cfo-intro/cfo-intro.component';

@Component({
    selector: 'setup',
    templateUrl: './setup.component.html',
    styleUrls: ['./setup.component.less'],
    animations: [appModuleAnimation()],
    providers: [InstanceServiceProxy]
})
export class SetupComponent extends CFOComponentBase implements OnInit, OnDestroy {
    private rootComponent: any;
    public headlineConfig;
    isDisabled = false;
    dialogConfig = new MatDialogConfig();

    quovoHandler: any;

    constructor(injector: Injector,
        private _instanceServiceProxy: InstanceServiceProxy,
        private _router: Router,
        private _quovoService: QuovoService,
        private _syncService: SyncServiceProxy,
        public dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    private finishSetup() {
        this._cfoService.instanceChangeProcess(() => this.addAccount());
    }

    private addAccount() {
        if (!this.quovoHandler) {
            this.initQuovoHandler();
        }
        if (this.quovoHandler.isLoaded) {
            if (this.loading) {
                this.finishLoading(true);
            }
            this.quovoHandler.open(e => this.onQuovoHandlerClose(e));
            return;
        } else {
            if (!this.loading) {
                this.startLoading(true);
            }
            setTimeout(() => this.addAccount(), 100);
        }
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.headlineConfig = {
            names: [this.l('Setup_Title')],
            iconSrc: 'assets/common/icons/magic-stick-icon.svg',
            buttons: []
        };
        this.rootComponent.overflowHidden(true);
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');

        setTimeout(() => {
            this.openDialog();
        }, 300);
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

    onQuovoHandlerClose(e) {
        if (e.addedIds.length) {
            this.startLoading(true);
            this._syncService.syncAllAccounts(InstanceType[this.instanceType], this.instanceId, true, true)
                .pipe(finalize(() => {
                    this.isDisabled = false;
                }))
                .subscribe(() => {
                    this.finishLoading(true);
                    this._cfoService.instanceChangeProcess(() => this._router.navigate(['/app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']));
                });
        } else {
            this.isDisabled = false;
        }
    }

    initQuovoHandler() {
        if (!this.quovoHandler) {
            this.quovoHandler = this._quovoService.getQuovoHandler(this.instanceType, this.instanceId);
        }
    }

    openDialog() {
        this.dialogConfig.height = '655px';
        this.dialogConfig.width = '880px';
        this.dialogConfig.id = 'cfo-intro';
        this.dialogConfig.panelClass = ['cfo-intro', 'setup'];

        const dialogRef = this.dialog.open(CfoIntroComponent, this.dialogConfig);
        dialogRef.afterClosed().subscribe(result => {
            if (result.isGetStartedButtonClicked) this.onStart();
        });
    }
}
