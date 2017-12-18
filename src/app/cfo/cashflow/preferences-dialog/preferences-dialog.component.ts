import { Component, ViewChild, Injector, Output, EventEmitter, OnInit } from '@angular/core';
import { CashflowServiceProxy, CashFlowGridSettingsDto } from '@shared/service-proxies/service-proxies';
import * as ModelEnums from '../models/setting-enums';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';

@Component({
    selector: 'preferences-modal',
    templateUrl: 'preferences-dialog.component.html',
    styleUrls: ['preferences-dialog.component.less'],
    providers: [ CashflowServiceProxy, UserPreferencesService ]
})
export class PreferencesDialogComponent extends ModalDialogComponent implements OnInit {
    @Output() modalSave: EventEmitter<CashFlowGridSettingsDto> = new EventEmitter<CashFlowGridSettingsDto>();

    GeneralScope = ModelEnums.GeneralScope;
    PeriodScope = ModelEnums.PeriodScope;

    model: CashFlowGridSettingsDto;
    active = false;
    saving = false;

    fonts = ['Lato'];
    fontSizes = [];
    themes = ['Default theme'];
    numberFormats = ['-$1,000,000.0'];
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
        this.data = Object.assign(this.data, {
            title: this.l('CashFlowGrid_UserPrefs_Header'),
            editTitle: false,
            buttons: [
                {
                    title: this.l('CashFlowGrid_UserPrefs_Cancel'),
                    class: 'default',
                    action: () => {
                        this.close(true);
                    }
                }, {
                    title: this.l('CashFlowGrid_UserPrefs_Save'),
                    class: 'primary',
                    action: () => {
                        this.saving = true;
                        this._cashflowService.saveCashFlowGridSettings(this.model)
                            .finally(() => { this.saving = false; })
                            .subscribe(result => {
                                    this.closeSuccessfull();
                                }
                            );
                    }
                }
            ],
            options: [
                {
                    text: this.l('CashFlowGrid_UserPrefs_RememberLastSettings'),
                    value: true
                }
            ]
        });

        this._cashflowService.getCashFlowGridSettings().subscribe(result => {
            this.model = result;
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
                    this.closeSuccessfull();
                }
            );
    }

    checkFlag(value, flag): boolean {
        return this.userPreferencesService.checkFlag(value, flag);
    }

    checkBoxValueChanged(event, obj, prop, flag) {
        this.userPreferencesService.checkBoxValueChanged(event, obj, prop, flag);
    }

    closeSuccessfull() {
        this.notify.info(this.l('SavedSuccessfully'));
        this.close(true);
        this.modalSave.emit(this.model);
    }
}
