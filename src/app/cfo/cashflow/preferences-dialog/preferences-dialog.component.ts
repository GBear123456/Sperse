/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialogRef } from '@angular/material';
import { from } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { CashflowServiceProxy, CashFlowGridSettingsDto, CashflowGridGeneralSettingsDtoShowColumnsWithZeroActivity } from '@shared/service-proxies/service-proxies';
import { GeneralScope } from '../enums/general-scope.enum';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CFOService } from '@shared/cfo/cfo.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { IDialogOption } from '@shared/common/dialogs/modal/dialog-option.interface';

@Component({
    selector: 'preferences-modal',
    templateUrl: 'preferences-dialog.component.html',
    styleUrls: ['preferences-dialog.component.less'],
    providers: [ CashflowServiceProxy, UserPreferencesService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreferencesDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    GeneralScope = GeneralScope;
    model: CashFlowGridSettingsDto;
    active = false;
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
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('CashFlowGrid_UserPrefs_Cancel'),
            class: 'default',
            action: () => {
                this.modalDialog.close(true, {
                    'saveLocally': false
                });
            }
        },
        {
            title: this.rememberLastSettings ?
                this.ls.l('CashFlowGrid_UserPrefs_Save') :
                this.ls.l('CashFlowGrid_UserPrefs_Apply'),
            class: 'primary',
            action: () => {
                if (this.rememberLastSettings) {
                    this.modalDialog.startLoading();
                    this._cashflowService.saveCashFlowGridSettings(this._cfoService.instanceType as any, this._cfoService.instanceId, this.model)
                        .pipe(finalize(() => this.modalDialog.finishLoading()))
                        .subscribe(() => {
                            this.closeSuccessful();
                        });
                } else {
                    /** Save the model in cache */
                    this.applyChanges();
                }
            }
        }
    ];
    options: IDialogOption[] = [
        {
            text: this.ls.l('CashFlowGrid_UserPrefs_RememberLastSettings'),
            value: this.rememberLastSettings,
            onValueChanged: () => {
                this.rememberLastSettings = !this.rememberLastSettings;
                this._changeDetectorRef.detectChanges();
            }
        }
    ];
    constructor(
        private _cashflowService: CashflowServiceProxy,
        private _cfoService: CFOService,
        private _dialogRef: MatDialogRef<PreferencesDialogComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        public userPreferencesService: UserPreferencesService,
        public ls: AppLocalizationService
    ) {
        for (let i = 10; i < 21; i++)
            this.fontSizes.push(i + 'px');
    }

    ngOnInit() {
        let cashflowGrid$;
        if (this.userPreferencesService.checkExistsLocally()) {
            let data = this.userPreferencesService.getLocalModel();
            let model = new CashFlowGridSettingsDto();
            model.init(data);
            cashflowGrid$ = from([model]);
        } else {
            this.modalDialog.startLoading();
            cashflowGrid$ = this._cashflowService.getCashFlowGridSettings(this._cfoService.instanceType as any, this._cfoService.instanceId);
        }

        cashflowGrid$
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(result => {
                this.model = result;
                this.active = true;
                this._changeDetectorRef.detectChanges();
            });

        this._dialogRef.afterClosed().subscribe(closeData => {
            if (closeData && closeData.saveLocally) {
                this.userPreferencesService.saveLocally(this.model);
            }
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
        this.modalDialog.close(true,  {'update': true, 'saveLocally': false});
    }

    applyChanges() {
        this.modalDialog.close(true,  {
            'update': true,
            'saveLocally': true,
            'apply': true,
            'model': this.model
        });
    }
}
