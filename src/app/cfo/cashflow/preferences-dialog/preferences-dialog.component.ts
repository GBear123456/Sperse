/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

/** Application imports */
import { CashflowServiceProxy, CashFlowGridSettingsDto } from '@shared/service-proxies/service-proxies';
import { GeneralScope } from '../enums/general-scope.enum';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CFOService } from '@shared/cfo/cfo.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { IDialogOption } from '@shared/common/dialogs/modal/dialog-option.interface';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';

@Component({
    selector: 'preferences-modal',
    templateUrl: 'preferences-dialog.component.html',
    styleUrls: ['preferences-dialog.component.less'],
    providers: [ CashflowServiceProxy, UserPreferencesService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreferencesDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
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
                    this._cashflowService.saveCashFlowGridSettings(this.cfoService.instanceType as any, this.cfoService.instanceId, this.model)
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
        public cfoService: CFOService,
        private _dialogRef: MatDialogRef<PreferencesDialogComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        public userPreferencesService: UserPreferencesService,
        public cfoPreferencesService: CfoPreferencesService,
        public ls: AppLocalizationService,
        public userManagementService: UserManagementService
    ) {
        for (let i = 10; i < 21; i++)
            this.fontSizes.push(i + 'px');
    }

    ngOnInit() {
        this.userPreferencesService.userPreferences$.subscribe(result => {
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
        this.modalDialog.close(true,  {
            'update': true,
            'saveLocally': false,
            'model': this.model
        });
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
