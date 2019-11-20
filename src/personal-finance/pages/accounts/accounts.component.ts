/** Core imports  */
import { Component, ElementRef, Injector, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable, forkJoin } from 'rxjs';
import { finalize, first, filter, pluck, takeUntil, tap, skip, map, switchMap } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CFOService } from '@shared/cfo/cfo.service';
import { QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import {
    SyncServiceProxy,
    InstanceServiceProxy,
    GetProviderUITokenOutput,
    LayoutType,
    MyFinancesServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AccountConnectors, SyncTypeIds } from '@shared/AppEnums';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { PfmIntroComponent } from '@root/personal-finance/shared/pfm-intro/pfm-intro.component';
import { IdleCountdownDialog } from './idle-countdown-dialog/idle-countdown-dialog.component';
import { AppFeatures } from '@shared/AppFeatures';

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
    features = AppFeatures;

    constructor(
        injector: Injector,
        public cfoService: CFOService,
        private quovoService: QuovoService,
        private syncService: SyncServiceProxy,
        private myFinanceService: MyFinancesServiceProxy,
        private instanceServiceProxy: InstanceServiceProxy,
        private dialog: MatDialog,
        public featureCheckerService: FeatureCheckerService
    ) {
        super(injector);
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
        this.cfoService.instanceChangeProcess().subscribe(() => {
            this.isInstanceInfoLoaded = true;
            this.loadQouvoPfm();
        });
    }

    private loadQouvoPfm() {
        if (this.cfoService.initialized) {
            const element = this.getElementRef().nativeElement.querySelector('.p-content');
            abp.ui.setBusy(element);
            this.tokenLoading$ = this.myFinanceService.createUserInstanceProviderUIToken(SyncTypeIds.Quovo);
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
                    this.myFinanceService.syncAllQuovoAccounts(false, false).subscribe();
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
        if (this.appSession.tenant.customLayoutType === LayoutType.LendSpace) {
            settings['userCss'] = AppConsts.appBaseHref + 'assets/common/styles/custom/lend-space/lend-space-quovo.css';
        } else {
            settings['userCss'] = AppConsts.appBaseHref + 'assets/accounts/accounts-quovo.css';
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
        if (this.cfoService.initialized)
            this.addAccount();
        else {
            abp.ui.setBusy(this.contentElement);
            this.myFinanceService.setupUserInstance(undefined)
                .pipe(
                    switchMap(() => this.cfoService.instanceChangeProcess()),
                    finalize(() => abp.ui.clearBusy(this.contentElement))
                ).subscribe(
                    () => {
                        this.isInstanceInfoLoaded = true;
                        this.addAccount();
                    },
                    () => this.isStartDisabled = false
                );
        }
    }

    private addAccount() {
        this.dialog.open(AccountConnectorDialogComponent, {
            ...AccountConnectorDialogComponent.defaultConfig,
            ...{
                data: {
                    connector: AccountConnectors.Quovo
                }
            }
        }).afterClosed().subscribe(e => {
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
