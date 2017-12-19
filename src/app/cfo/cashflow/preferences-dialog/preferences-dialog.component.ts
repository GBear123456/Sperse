import { Component, ViewChild, Injector, Output, EventEmitter, OnInit } from '@angular/core';
import { CashflowServiceProxy, CashFlowGridSettingsDto } from '@shared/service-proxies/service-proxies';
import * as ModelEnums from '../models/setting-enums';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { CacheService } from 'ng2-cache-service';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'preferences-modal',
    templateUrl: 'preferences-dialog.component.html',
    styleUrls: ['preferences-dialog.component.less'],
    providers: [ CashflowServiceProxy, UserPreferencesService, CacheService ]
})
export class PreferencesDialogComponent extends ModalDialogComponent implements OnInit {
    @Output() modalSave: EventEmitter<CashFlowGridSettingsDto> = new EventEmitter<CashFlowGridSettingsDto>();

    GeneralScope = ModelEnums.GeneralScope;
    PeriodScope = ModelEnums.PeriodScope;

    model: CashFlowGridSettingsDto;
    active = false;
    saving = false;
    rememberLastSettings = true;
    cacheKey = `UserPreferences_${abp.session.userId}`;

    fonts = ['Lato'];
    fontSizes = [];
    themes = ['Default theme'];
    numberFormats = ['-$1,000,000.0'];
    constructor(
        injector: Injector,
        private _cashflowService: CashflowServiceProxy,
        public userPreferencesService: UserPreferencesService,
        private _cacheService: CacheService
    ) {
        super(injector);
        for (let i = 10; i < 21; i++)
            this.fontSizes.push(i + 'px');
    }

    ngOnInit() {
        this.data = Object.assign(this.data, {
            title: this.l('CashFlowGrid_UserPrefs_Header'),
            editTitle: false,
            buttons: [
                {
                    title: this.l('CashFlowGrid_UserPrefs_Cancel'),
                    class: 'default',
                    action: () => {
                        this.close(true, false);
                    }
                }, {
                    title: this.rememberLastSettings ?
                           this.l('CashFlowGrid_UserPrefs_Save') :
                           this.l('CashFlowGrid_UserPrefs_Apply'),
                    class: 'primary',
                    action: () => {
                        if (this.rememberLastSettings) {
                            this.saving = true;
                            this._cashflowService.saveCashFlowGridSettings(this.model)
                                .finally(() => { this.saving = false; })
                                .subscribe(result => {
                                    this.closeSuccessful();
                                });
                        } else {
                            /** Save the model in cache */
                            //this.applyChanges();
                        }
                    }
                }
            ],
            options: [
                {
                    text: this.l('CashFlowGrid_UserPrefs_RememberLastSettings'),
                    value: this.rememberLastSettings
                }
            ]
        });
        let cashflowGridObservable;
        if (this._cacheService.exists(this.cacheKey)) {
            cashflowGridObservable = Observable.from([this._cacheService.get(this.cacheKey)]);
        } else {
            cashflowGridObservable = this._cashflowService.getCashFlowGridSettings();
        }

        cashflowGridObservable.subscribe(result => {
            this.model = new CashFlowGridSettingsDto(result);
            this.active = true;
        });
    }

    getEnumKeys(parameter: any): any {
        let keys = Object.keys(parameter);
        return keys.slice(keys.length / 2);
    }

    save(): void {
        this.saving = true;
        this._cashflowService.saveCashFlowGridSettings(this.model)
            .finally(() => { this.saving = false; })
            .subscribe(result => {
                    this.closeSuccessful();
                }
            );
    }

    checkFlag(value, flag): boolean {
        return this.userPreferencesService.checkFlag(value, flag);
    }

    checkBoxValueChanged(event, obj, prop, flag) {
        this.userPreferencesService.checkBoxValueChanged(event, obj, prop, flag);
    }

    closeSuccessful() {
        this.notify.info(this.l('SavedSuccessfully'));
        this.close(true, false, {'update': true});
        this.modalSave.emit(this.model);
    }

    /**
     * Close the popup
     * @param {boolean} slide
     * @param {boolean} saveLocally Save into local cache
     */
    close(slide: boolean = false, saveLocally: boolean = true, closeData = null) {
        if (saveLocally) {
            this.saveLocally(this.model);
        } else {
            this.removeLocalModel();
        }
        super.close(true, closeData);
    }

    saveLocally(model: CashFlowGridSettingsDto) {
        this._cacheService.set(this.cacheKey, new CashFlowGridSettingsDto(model));
    }

    removeLocalModel() {
        this._cacheService.remove(this.cacheKey);
    }
}
