import { Component, Injector, OnInit } from '@angular/core';
import { CashflowServiceProxy, CashFlowGridSettingsDto, CashflowGridGeneralSettingsDtoShowColumnsWithZeroActivity, InstanceType } from '@shared/service-proxies/service-proxies';
import * as ModelEnums from '../models/setting-enums';
import { CFOModalDialogComponent } from '@app/cfo/shared/common/dialogs/modal/cfo-modal-dialog.component';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { CacheService } from 'ng2-cache-service';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'preferences-modal',
    templateUrl: 'preferences-dialog.component.html',
    styleUrls: ['preferences-dialog.component.less'],
    providers: [CashflowServiceProxy, UserPreferencesService, CacheService]
})
export class PreferencesDialogComponent extends CFOModalDialogComponent implements OnInit {
    GeneralScope = ModelEnums.GeneralScope;
    PeriodScope = CashflowGridGeneralSettingsDtoShowColumnsWithZeroActivity;

    model: CashFlowGridSettingsDto;
    active = false;
    saving = false;
    rememberLastSettings = true;
    fonts = [
        'Lato',
        'Open Sans',
        'Kameron',
        'Work Sans'
    ];
    fontSizes = [];
    splitIntoItems = [
        'Weeks',
        'Days'
    ];
    themes = [
        'Default Theme',
        'Light Dark Theme'
    ];
    numberFormats = [
        '1,000,000.0',
        '1.000.000,0'
    ];
    currencies = [
        { value: 'EUR', caption: '€ EUR European Euro' },
        { value: 'GBP', caption: '£ GBP British Pound' },
        { value: 'INR', caption: '₹ INR Indian Rupee' },
        { value: 'JPY', caption: '¥ JPY Japanese Yen' },
        { value: 'ILS', caption: '₪ ILS Israeli Shekel' },
        { value: 'UAH', caption: '‎₴ UAH Ukrainian Hryvnia' },
        { value: 'RUB', caption: '₽ RUB Russian Ruble' },
        { value: 'CHF', caption: 'C CHF Swiss Franc' },
        { value: 'SGD', caption: '$ SGD Singapore Dollar' },
        { value: 'AUD', caption: '$ AUD Australian Dollar' },
        { value: 'CAD', caption: '$ CAD Canadian Dollar' },
        { value: 'HKD', caption: '$ HKD Hong Kong Dollar' },
        { value: 'MXN', caption: '$ MXN Mexico Peso' },
        { value: 'NZD', caption: '$ NZD New Zealand Dollar' },
        { value: 'USD', caption: '$ USD US Dollar' }
    ];
    constructor(
        injector: Injector,
        private _cashflowService: CashflowServiceProxy,
        public userPreferencesService: UserPreferencesService
    ) {
        super(injector);
        for (let i = 10; i < 21; i++)
            this.fontSizes.push(i + 'px');
    }

    ngOnInit() {
        super.ngOnInit();

        this.initHeader();

        let cashflowGridObservable;
        if (this.userPreferencesService.checkExistsLocally()) {
            let data = this.userPreferencesService.getLocalModel();
            let model = new CashFlowGridSettingsDto();
            model.init(data);
            cashflowGridObservable = Observable.from([model]);
        } else {
            cashflowGridObservable = this._cashflowService.getCashFlowGridSettings(InstanceType[this.instanceType], this.instanceId);
        }

        cashflowGridObservable.subscribe(result => {
            this.model = result;
            this.active = true;
        });

        this.dialogRef.afterClosed().subscribe(closeData => {
            if (closeData && closeData.saveLocally) {
                this.userPreferencesService.saveLocally(this.model);
            }
        });
    }

    initHeader() {
        this.data = Object.assign(this.data, {
            title: this.l('CashFlowGrid_UserPrefs_Header'),
            editTitle: false,
            buttons: [
                {
                    title: this.l('CashFlowGrid_UserPrefs_Cancel'),
                    class: 'default',
                    action: () => {
                        this.close(true, {'saveLocally': false});
                    }
                }, {
                    title: this.rememberLastSettings ?
                        this.l('CashFlowGrid_UserPrefs_Save') :
                        this.l('CashFlowGrid_UserPrefs_Apply'),
                    class: 'primary',
                    action: () => {
                        if (this.rememberLastSettings) {
                            this.saving = true;
                            this._cashflowService.saveCashFlowGridSettings(InstanceType[this.instanceType], this.instanceId, this.model)
                                .finally(() => { this.saving = false; })
                                .subscribe(result => {
                                    this.closeSuccessful();
                                });
                        } else {
                            /** Save the model in cache */
                            this.applyChanges();
                        }
                    }
                }
            ],
            options: [
                {
                    text: this.l('CashFlowGrid_UserPrefs_RememberLastSettings'),
                    value: this.rememberLastSettings,
                    onValueChanged: () => {
                        this.rememberLastSettings = !this.rememberLastSettings;
                        this.initHeader();
                    }
                }
            ]
        });
    }

    getEnumKeys(parameter: any, slice: boolean = true): any {
        let keys = Object.keys(parameter);
        return slice ? keys.slice(keys.length / 2) : keys;
    }

    checkFlag(value, flag): boolean {
        return this.userPreferencesService.checkFlag(value, flag);
    }

    checkBoxValueChanged(event, obj, prop, flag) {
        this.userPreferencesService.checkBoxValueChanged(event, obj, prop, flag);
    }

    closeSuccessful() {
        this.close(true,  {'update': true, 'saveLocally': false});
    }

    applyChanges() {
        this.close(true,  {
            'update': true,
            'saveLocally': true,
            'apply': true,
            'model': this.model
        });
    }
}
