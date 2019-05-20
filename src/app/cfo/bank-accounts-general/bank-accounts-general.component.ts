/** Core imports */
import { Component, OnInit, Injector, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { BankAccountsGeneralService } from '@shared/cfo/bank-accounts/helpers/bank-accounts-general.service';
import { SyncAccountServiceProxy, InstanceType91 } from '@shared/service-proxies/service-proxies';
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { CfoStore, CurrenciesStoreActions } from '@app/cfo/store';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

@Component({
    selector: 'bank-accounts',
    templateUrl: './bank-accounts-general.component.html',
    styleUrls: ['./bank-accounts-general.component.less'],
    providers: [ BankAccountsGeneralService, SyncAccountServiceProxy ]
})
export class BankAccountsGeneralComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy  {
    @ViewChild(SynchProgressComponent) syncComponent: SynchProgressComponent;

    headlineConfig: any;
    private rootComponent: any;
    createAccountAvailable = false;
    toolbarConfig;

    constructor(
        injector: Injector,
        private _synchProgress: SynchProgressService,
        private _syncAccountServiceProxy: SyncAccountServiceProxy,
        private _bankAccountsGeneralService: BankAccountsGeneralService,
        private _dialog: MatDialog,
        private store$: Store<CfoStore.State>,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
        this._synchProgress.needRefreshSync$.subscribe(() => {
            this._synchProgress.startSynchronization();
        });
        this._syncAccountServiceProxy.createIsAllowed(this._cfoService.instanceType as InstanceType91, this.instanceId)
            .subscribe((result) => {
                this.createAccountAvailable = result;
                this.initHeadlineConfig();
            });
    }

    ngOnInit() {
        this.initHeadlineConfig();
        this.initToolbarConfig();
    }

    private initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Setup_Title'), this.l('Accounts')],
            iconSrc: './assets/common/icons/magic-stick-icon.svg',
            onRefresh: this.onRefreshClick.bind(this),
            buttons: [
                {
                    enabled: (this.isInstanceAdmin || this.isMemberAccessManage) && this.createAccountAvailable,
                    class: 'btn-layout',
                    lable: this.l('Add_account'),
                    action: this.openAddAccountDialog.bind(this)
                },
                {
                    enabled: true,
                    action: this.syncAll.bind(this),
                    lable: this.l('SyncAll'),
                    class: 'btn-layout next-button'
                }
            ]
        };
    }

    private initToolbarConfig() {
        this.cfoPreferencesService.getCurrenciesAndSelectedIndex()
            .subscribe(([currencies, selectedCurrencyIndex]) => {
                this.toolbarConfig = [
                    {
                        location: 'before',
                        locateInMenu: 'auto',
                        items: [
                            {
                                name: 'select-box',
                                text: this.cfoPreferencesService.selectedCurrencySymbol + ' ' + this.cfoPreferencesService.selectedCurrencyId,
                                widget: 'dxDropDownMenu',
                                accessKey: 'currencySwitcher',
                                options: {
                                    hint: this.l('Currency'),
                                    accessKey: 'currencySwitcher',
                                    items: currencies,
                                    selectedIndex: selectedCurrencyIndex,
                                    height: 39,
                                    onSelectionChanged: (e) => {
                                        if (e) {
                                            this.store$.dispatch(new CurrenciesStoreActions.ChangeCurrencyAction(e.itemData.id));
                                        }
                                    }
                                }
                            }
                        ]
                    }
                ];
            });
    }

    private openAddAccountDialog() {
        if (!this.createAccountAvailable)
            return;

        this._dialog.open(AccountConnectorDialogComponent, AccountConnectorDialogComponent.defaultConfig);
    }

    onRefreshClick() {
        this._bankAccountsGeneralService.refreshBankAccounts();
    }

    syncAll() {
        setTimeout(() => {
            this._synchProgress.startSynchronization(true, false, 'all');
        }, 300);
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        if (this.rootComponent) {
            this.rootComponent.overflowHidden();
        }
    }
}
