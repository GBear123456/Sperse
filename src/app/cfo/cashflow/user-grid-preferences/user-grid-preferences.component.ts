import { Component, ViewChild, Injector, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { CashflowServiceProxy, CashFlowGridSettingsDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import * as ModelEnums from '../models/setting-enums';

@Component({
    selector: 'userGridPreferences',
    templateUrl: 'user-grid-preferences.component.html',
    styleUrls: ['user-grid-preferences.component.less'],
    providers: [ CashflowServiceProxy ]
})
export class UserGridPreferencesComponent extends AppComponentBase {
    
    @ViewChild('userGridPreferences') modal: ModalDirective;

    @Output() modalSave: EventEmitter<CashFlowGridSettingsDto> = new EventEmitter<CashFlowGridSettingsDto>();

    GeneralScope = ModelEnums.GeneralScope;
    PeriodScope = ModelEnums.PeriodScope;

    model: CashFlowGridSettingsDto;
    active: boolean = false;
    saving: boolean = false;

    fonts = ['Lato'];
    fontSizes = [];
    themes = ['Default theme'];
    numberFormats = ['-$1,000,000.0'];

    constructor(
        injector: Injector,
        private _cashflowService: CashflowServiceProxy
    ) {
        super(injector, AppConsts.localization.CFOLocalizationSourceName);
        for (let i = 10; i < 21; i++)
            this.fontSizes.push(i + 'px');
    }

    getEnumKeys(parameter: any): any {
        var keys = Object.keys(parameter);
        return keys.slice(keys.length / 2);
    }

    show(initialModel?: CashFlowGridSettingsDto): void {
        if (initialModel) {
            this.model = initialModel;
        }

        this._cashflowService.getCashFlowGridSettings().subscribe(result => {
            this.model = result;
            this.active = true;
            this.modal.show();
        });
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

    checkFlag(value, flag): boolean{
        return (value & flag) != 0;
    }

    checkBoxValueChanged(event, obj, prop, flag) {
        if (event.value) {
            obj[prop] |= flag;
        } else {
            obj[prop] &= ~flag;
        }
    }

    closeSuccessfull() {
        this.notify.info(this.l('SavedSuccessfully'));
        this.close();
        this.modalSave.emit(this.model);
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }
}
