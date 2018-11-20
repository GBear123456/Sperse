/** Core imports  */
import { Component, Injector, ViewChild, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable, BehaviorSubject, forkJoin } from '@node_modules/rxjs';
import { finalize } from 'rxjs/operators';

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
    providers: [],
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent extends AppComponentBase implements OnInit, OnDestroy {
    private tokenLoading$: Observable<GetProviderUITokenOutput>;

    isStartDisabled = false;
    isInstanceInfoLoaded = false;

    currentSection: 'summary';

    menuItems = [
        { name: 'Summary', sectionName: 'summary' },
        { name: 'Goals', sectionName: 'goals' },
        { name: 'Allocation', sectionName: 'allocation' },
        { name: 'SpendingAndBudgeting', sectionName: 'spending' },
        { name: 'Accounts', sectionName: 'accounts' },
        { name: 'Transactions', sectionName: 'transactions' },
        { name: 'Holdings', sectionName: 'holdings' }
    ];

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
            this.loadQouvoPfm();
        });
    }

    loadQouvoPfm() {
        if (this._cfoService.initialized) {
            const element = this.getElementRef().nativeElement.querySelector('.p-content');
            abp.ui.setBusy(element);
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
            ).pipe(finalize(() => abp.ui.clearBusy(element)))
                .subscribe(
                    res => {
                        this._syncService.syncAllAccounts(InstanceType[this._cfoService.instanceType], this._cfoService.instanceId, false, false).subscribe();
                        let token = res[0].token.toString();
                        this.loadQuovo(token);
                    }
                );
        }
    }

    loadQuovo(token) {
        Quovo.embed({
            token: token.toString(),
            elementId: 'quovo-accounts-module',
            moduleName: this.currentSection,
        });
    }

    refreshQuovoSection() {
        const element = this.getElementRef().nativeElement.querySelector('.p-content');
        abp.ui.setBusy(element);
        this.tokenLoading$
            .pipe(finalize(() => abp.ui.clearBusy(element)))
            .subscribe(
                res => {
                    $('.quovo-accounts-module').html('');
                    let token = res.token.toString();
                    this.loadQuovo(token);
                }
            );
    }
    onStart(): void {
        this.isStartDisabled = true;
        if (this._cfoService.initialized)
            this.addAccount();
        else
            this._instanceServiceProxy.setup(InstanceType[this._cfoService.instanceType]).subscribe(data => {
                this._cfoService.instanceChangeProcess();
                this.addAccount();
            });
    }

    private addAccount() {
        const dialogConfig = {
            ...AccountConnectorDialogComponent.defaultConfig,
            ...{
                data: {
                    disabledConnectors: [AccountConnectors.Xero]
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
        this.loadQouvoPfm();
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
