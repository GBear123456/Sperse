/** Core imports  */
import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable, forkJoin } from 'rxjs';
import { finalize, first, filter, pluck, takeUntil, tap, skip, map } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CFOService } from '@shared/cfo/cfo.service';
import { QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import {
    InstanceType,
    SyncServiceProxy,
    InstanceServiceProxy,
    GetProviderUITokenOutput,
    TenantLoginInfoDtoCustomLayoutType
} from '@shared/service-proxies/service-proxies';
import { AccountConnectors } from '@shared/AppEnums';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { PfmIntroComponent } from '@root/personal-finance/shared/pfm-intro/pfm-intro.component';

declare const Quovo: any;

@Component({
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent extends AppComponentBase implements OnInit, OnDestroy {
    private tokenLoading$: Observable<GetProviderUITokenOutput>;

    isStartDisabled = false;
    isInstanceInfoLoaded = false;

    defaultSection = 'summary';
    sectionName$: Observable<string>;
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
        private dialog: MatDialog,
        public featureCheckerService: FeatureCheckerService
    ) {
        super(injector, AppConsts.localization.PFMLocalizationSourceName);
    }

    ngOnInit() {
        if (this.appSession.userId)
            this.checkInstanceChangeProcess();
    }

    private checkInstanceChangeProcess() {
        this._cfoService.instanceChangeProcess(() => {
            this.isInstanceInfoLoaded = true;
            this.loadQouvoPfm();
        });
        this.sectionName$ = this._activatedRoute.params.pipe(
            takeUntil(this.destroy$),
            pluck('sectionName'),
            /** If section name is in menuItems array - use it, else - default section */
            map((sectionName: string) => sectionName && this.menuItems.some(item => item.sectionName === sectionName) ? sectionName : this.defaultSection)
        );
    }

    private loadQouvoPfm() {
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
                this.tokenLoading$.pipe(map(tokenRes => tokenRes.token.toString())),
                this.sectionName$.pipe(first()),
                quovoLoading$
            ).pipe(
                finalize(() => abp.ui.clearBusy(element)),
                tap(() => {
                    this._syncService.syncAllAccounts(
                        InstanceType[this._cfoService.instanceType],
                        this._cfoService.instanceId,
                        false,
                        false
                    ).subscribe();
                })
            ).subscribe(
                ([token, sectionName]) => {
                    this.loadQuovo(token, sectionName);
                    /** Subscribe to section name changes
                     *  skip first to avoid double loading at the first time) */
                    this.sectionName$.pipe(takeUntil(this.destroy$), skip(1)).subscribe(sectionName => {
                        this.refreshQuovoSection(sectionName);
                    });
                }
            );
        }
    }

    private loadQuovo(token, sectionName: string) {
        let settings = {
            token: token.toString(),
            elementId: 'quovo-accounts-module',
            moduleName: sectionName
        };
        if (this.appSession.tenant.customLayoutType === TenantLoginInfoDtoCustomLayoutType.LendSpace) {
            settings['userCss'] = AppConsts.appBaseHref + 'assets/common/styles/custom/lend-space/lend-space-quovo.css';
        }
        Quovo.embed(settings);
    }

    private refreshQuovoSection(sectionName: string) {
        const element = this.getElementRef().nativeElement.querySelector('.p-content');
        abp.ui.setBusy(element);
        this.tokenLoading$
            .pipe(finalize(() => abp.ui.clearBusy(element)))
            .subscribe(
                res => {
                    $('.quovo-accounts-module').html('');
                    let token = res.token.toString();
                    this.loadQuovo(token, sectionName);
                }
            );
    }

    openPfmIntro() {
        const dialogConfig = {
            height: '650px',
            width: '900px',
            id: 'pfm-intro',
            panelClass: 'pfm-intro'
        };
        const dialogRef = this.dialog.open(PfmIntroComponent, dialogConfig);
        dialogRef.afterClosed().pipe(filter(start => !!start)).subscribe(() => {
            this.onStart();
        });
    }

    onStart(): void {
        this.isStartDisabled = true;
        if (this._cfoService.initialized)
            this.addAccount();
        else
            this._instanceServiceProxy.setup(InstanceType[this._cfoService.instanceType])
            .subscribe(
                () => {
                    this.checkInstanceChangeProcess();
                    this.addAccount();
                },
                () => this.isStartDisabled = false
            );
    }

    private addAccount() {
        const dialogConfig = {
            ...AccountConnectorDialogComponent.defaultConfig,
            ...{
                data: {
                    connector: AccountConnectors.Quovo
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
        this.checkInstanceChangeProcess();
    }

    changeQuovoSection(sectionName) {
        this._router.navigate(['/personal-finance/my-finances', sectionName]);
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }

}
