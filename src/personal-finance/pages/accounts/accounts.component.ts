/** Core imports  */
import { Component, ElementRef, Injector, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
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
import { IdleCountdownDialog } from './idle-countdown-dialog/idle-countdown-dialog.component';

declare const Quovo: any;

@Component({
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChildren('content') set contentElements(elements: QueryList<any>) {
        this.contentElement = elements.first && elements.first.nativeElement;
    }
    private contentElement: ElementRef;
    private tokenLoading$: Observable<GetProviderUITokenOutput>;

    isStartDisabled = false;
    isInstanceInfoLoaded = false;

    defaultSection = 'summary';
    sectionName$: Observable<string>;
    currentSectionName: string;

    menuItems = [
        { name: 'Accounts', sectionName: 'accounts' },
        { name: 'Overview', sectionName: 'summary' },
        { name: 'Budgeting', sectionName: 'spending' },
        { name: 'Transactions', sectionName: 'transactions' },
        { name: 'Holdings', sectionName: 'holdings' },
        { name: 'Allocation', sectionName: 'allocation' },
        { name: 'Goals', sectionName: 'goals' }
    ];

    lastQuouvoActivity: Date;
    quovoActivityCheck;
    private readonly MAX_IDLE_TIME_MILISECONDS = 13 * 60 * 1000; // 13 min

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
        this.sectionName$ = this._activatedRoute.params.pipe(
            takeUntil(this.destroy$),
            pluck('sectionName'),
            /** If section name is in menuItems array - use it, else - default section */
            map((sectionName: string) => sectionName && this.menuItems.some(item => item.sectionName === sectionName) ? sectionName : this.defaultSection),
            tap(sectionName => this.currentSectionName = sectionName)
        );
        if (this.appSession.userId)
            this.checkInstanceChangeProcess();
    }

    private checkInstanceChangeProcess() {
        this._cfoService.instanceChangeProcess(() => {
            this.isInstanceInfoLoaded = true;
            this.loadQouvoPfm();
        });
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
            moduleName: sectionName,
            onActivity: () => {
                this.lastQuouvoActivity = new Date();
            }
        };
        if (this.appSession.tenant.customLayoutType === TenantLoginInfoDtoCustomLayoutType.LendSpace) {
            settings['userCss'] = AppConsts.appBaseHref + 'assets/common/styles/custom/lend-space/lend-space-quovo.css';
        }
        Quovo.embed(settings);
        this.lastQuouvoActivity = new Date();
        this.resetQuovoActivityCheck();
        document.querySelector('body').classList.add('finance-page');
    }

    private refreshQuovoSection(sectionName: string) {
        abp.ui.setBusy(this.contentElement);
        this.tokenLoading$
            .pipe(finalize(() => abp.ui.clearBusy(this.contentElement)))
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
        else {
            abp.ui.setBusy(this.contentElement);
            this._instanceServiceProxy.setup(InstanceType[this._cfoService.instanceType])
                .subscribe(
                    () => {
                        this.checkInstanceChangeProcess();
                        this.addAccount();
                    },
                    () => this.isStartDisabled = false
                );
        }
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

    resetQuovoActivityCheck() {
        this.stopQuovoActivityCheck();
        this.checkQouvoActivity();
    }

    checkQouvoActivity() {
        let idleTimeMiliseconds = new Date().getTime() - this.lastQuouvoActivity.getTime();
        if (idleTimeMiliseconds > this.MAX_IDLE_TIME_MILISECONDS) {
            this.dialog.open(IdleCountdownDialog, { disableClose: true, panelClass: 'idle-coundown-dialog' })
                .afterClosed()
                .subscribe((result) => {
                    if (result && result.continue) {
                        this.refreshQuovoSection(this.currentSectionName);
                    }
                });
        } else {
            this.quovoActivityCheck = setTimeout(() => this.checkQouvoActivity(), 30 * 1000);
        }
    }

    stopQuovoActivityCheck() {
        clearTimeout(this.quovoActivityCheck);
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        this.stopQuovoActivityCheck();
        document.querySelector('body').classList.remove('finance-page');
    }

}
