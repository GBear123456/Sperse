/** Core imports */
import { Component, Injector, OnInit } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { combineLatest, of } from 'rxjs';
import { catchError, filter, first, tap, switchMap, finalize, takeUntil, mapTo } from 'rxjs/operators';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { DashboardServiceProxy, ClassificationServiceProxy, InstanceType, AutoClassifyDto, ResetClassificationDto } from 'shared/service-proxies/service-proxies';
import { ChooseResetRulesComponent } from './choose-reset-rules/choose-reset-rules.component';
import { RootStore, CurrenciesStoreSelectors } from '@root/store';
import { BankAccountsService } from '../../bank-accounts/helpers/bank-accounts.service';
import { DashboardService } from '../dashboard.service';
import { LifecycleSubjectsService } from '@root/shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CategorizationStatus } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-categorization-status',
    templateUrl: './categorization-status.component.html',
    styleUrls: ['./categorization-status.component.less'],
    providers: [DashboardServiceProxy, ClassificationServiceProxy, LifecycleSubjectsService]
})
export class CategorizationStatusComponent extends CFOComponentBase implements OnInit {
    categorySynchData: CategorizationStatus;
    totalCount: number;
    private autoClassifyData = new AutoClassifyDto();
    resetRules = new ResetClassificationDto();
    currencyId$ = this.store$.pipe(
        select(CurrenciesStoreSelectors.getSelectedCurrencyId),
        filter(Boolean)
    );

    constructor(
        injector: Injector,
        private _dashboardService: DashboardService,
        private _bankAccountService: BankAccountsService,
        private _dashboardServiceProxy: DashboardServiceProxy,
        private _classificationService: ClassificationServiceProxy,
        private _lifeCycleService: LifecycleSubjectsService,
        private store$: Store<RootStore.State>,
        public dialog: MatDialog
    ) {
        super(injector);
    }

    ngOnInit() {
        this.load();
    }

    activate() {
        this._lifeCycleService.activate.next();
    }

    load(): void {
        combineLatest(
            this._dashboardService.refresh$,
            this.currencyId$,
            this._bankAccountService.selectedBankAccountsIds$
        ).pipe(
            switchMap((data) => this.componentIsActivated ? of(data) : this._lifeCycleService.activate$.pipe(first(), mapTo(data))),
            tap(() => this.startLoading()),
            switchMap(([, currencyId, bankAccountIds]: [null,  string, number[]]) => this._dashboardServiceProxy.getCategorizationStatus(
                InstanceType[this.instanceType], this.instanceId, currencyId, bankAccountIds
            ).pipe(
                catchError(() => of(new CategorizationStatus())),
                finalize(() => this.finishLoading())
            )),
            takeUntil(this.destroy$)
        ).subscribe((result: CategorizationStatus) => {
            this.categorySynchData = result;
            this.totalCount = result.classifiedTransactionCount + result.unclassifiedTransactionCount;
        });
    }

    autoClassify(): void {
        this.notify.info('Auto-classification has started');
        this._classificationService.autoClassify(InstanceType[this.instanceType], this.instanceId, this.autoClassifyData)
            .subscribe((result) => {
                this.load();
                this.notify.info('Auto-classification has ended');
                return result;
            });
    }

    reset(): void {
        this.notify.info('Reset process has started');
        this._classificationService.reset(InstanceType[this.instanceType], this.instanceId, this.resetRules)
            .subscribe((result) => {
                this.load();
                this.notify.info('Reset process has ended');
                return result;
            });
    }

    openDialog(): void {
        let dialogRef = this.dialog.open(ChooseResetRulesComponent, {
            width: '450px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.resetRules = result;
                this.reset();
            }
        });
    }

    filterTransactions(classified: boolean) {
        let filter = {
            classified: {
                yes: undefined,
                no: undefined
            }
        };

        if (this._bankAccountService.state.selectedBankAccountIds && this._bankAccountService.state.selectedBankAccountIds.length) {
            filter['Account'] = {
                element: this._bankAccountService.state.selectedBankAccountIds
            };
        }

        if (classified)
            filter.classified.yes = true;
        else
            filter.classified.no = true;

        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/transactions'], { queryParams: { filters: encodeURIComponent(JSON.stringify(filter)) } });
    }
}
