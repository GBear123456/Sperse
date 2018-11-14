/** Core imports  */
import { Component, Injector, ViewChild, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable, BehaviorSubject, forkJoin } from '@node_modules/rxjs';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CFOService } from '@shared/cfo/cfo.service';
import { QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import { InstanceType, SyncServiceProxy, InstanceServiceProxy, GetProviderUITokenOutput } from '@shared/service-proxies/service-proxies';
import { AccountConnectors } from '@shared/AppEnums';

declare const Quovo: any;

@Component({
    templateUrl: './accounts.component.html',
    providers: [ ],
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent extends AppComponentBase implements OnInit, OnDestroy {
    private quovoLoaded$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private tokenLoading$: Observable<GetProviderUITokenOutput>;

    isStartDisabled = false;
    isInstanceInfoLoaded = false;

    currentSection: string;

    constructor(
        injector: Injector,
        private _cfoService: CFOService,
        private _quovoService: QuovoService,
        private _syncService: SyncServiceProxy,
        private _instanceServiceProxy: InstanceServiceProxy,
        private dialog: MatDialog
    ) {
        super(injector, AppConsts.localization.CreditReportLocalizationSourceName);
    }

    ngOnInit() {
        this._cfoService.instanceChangeProcess(() => {
            this.isInstanceInfoLoaded = true;

            if (this._cfoService.initialized) {
                this.currentSection = 'summary';
                this.loadQouvoPfm();
            }
        });
    }

    loadQouvoPfm() {
        this.tokenLoading$ = this._syncService.createProviderUIToken(InstanceType[this._cfoService.instanceType], this._cfoService.instanceId, 'Q');
        /** Load quovo script (jquery getScript to observable) */
        const quovoLoading$ = new Observable(observer => {
            jQuery.getScript('https://app.quovo.com/ui.js').done(() => {
                observer.next();
                observer.complete();
            });
        });

        forkJoin(
            this.tokenLoading$,
            quovoLoading$
        ).subscribe(
            res => {
                this._syncService.syncAllAccounts(InstanceType[this._cfoService.instanceType], this._cfoService.instanceId, false, false).subscribe();
                let token = res[0].token.toString();
                Quovo.embed({
                    token: token.toString(),
                    elementId: 'quovo-accounts-module',
                    moduleName: this.currentSection,
                });
            }
        );
    }

    refreshQuovoSection() {
        abp.ui.setBusy();
        this.tokenLoading$.subscribe(
            res => {
                $('.quovo-accounts-module').html('');
                let token = res.token.toString();
                Quovo.embed({
                    token: token.toString(),
                    elementId: 'quovo-accounts-module',
                    moduleName: this.currentSection,
                });
                abp.ui.clearBusy();
            }
        );
    }
    onStart(): void {
        this.isStartDisabled = true;
        if (this._cfoService.initialized)
            this.addAccount();
        else
            this._instanceServiceProxy.setup(InstanceType[this._cfoService.instanceType]).subscribe(data => {
                this.addAccount();
            });
    }

    private addAccount() {
        const dialogConfig = {
            ...AccountConnectorDialogComponent.defaultConfig,
            ...{
                data: {
                    disabledConnectors: [ AccountConnectors.Xero ]
                }
            }
        };
        const dialogRef = this.dialog.open(AccountConnectorDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe(e => {
            this.onQuovoClose(e);
        });
    }

    private onQuovoClose(e) {
        this.isStartDisabled = false;
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }

    openQuovoSection(sectionName) {
        if (this.currentSection !== sectionName) {
            this.currentSection = sectionName;
            this.refreshQuovoSection();
        }
    }
    
}
