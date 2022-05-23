/** Core imports */
import { Component, Inject, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import * as moment from 'moment-timezone';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { GenerateApiKeyInput, ContactServiceProxy, UpdateApiKeyInput } from '@shared/service-proxies/service-proxies';
import { PermissionCheckerService } from 'abp-ng2-module';
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    templateUrl: 'add-key-dialog.component.html',
    styleUrls: ['add-key-dialog.component.less']
})
export class EditKeyDialog extends AppComponentBase {
    @ViewChild(DxSelectBoxComponent) userComponent: DxSelectBoxComponent;

    isValid = false;
    validator: any;
    maxCalendarDate = new Date(2038, 0, 19);
    model: GenerateApiKeyInput | UpdateApiKeyInput;
    latestSearchPhrase: string;
    contacts: any = [];
    lookupTimeout: any;

    private readonly ONE_HOUR_MILISECONDS = 3600000;

    hasAccessAll = this.permissionChecker.isGranted(AppPermissions.APIManageKeysAccessAll);

    constructor(injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private contactProxy: ContactServiceProxy,
        private permissionChecker: PermissionCheckerService,
        public dialogRef: MatDialogRef<EditKeyDialog>
    ) {
        super(injector);
        if (this.hasAccessAll)
            this.contactLookupRequest();

        if (data && data.id) {
            this.model = new UpdateApiKeyInput({
                id: data.id,
                name: data.name,
                paths: data.paths,
                userId: undefined,
                expirationDate: data.expirationDate && 
                    DateHelper.addTimezoneOffset(data.expirationDate.toDate(), true)
            });
        } else {
            this.model = new GenerateApiKeyInput({
                name: '',
                paths: '',
                userId: undefined,
                expirationDate: (new Date()).setTime(
                    Date.now() + this.ONE_HOUR_MILISECONDS),
            });
        }
    }

    contactLookupRequest(phrase = '', callback?) {
        this.contactProxy.getAllByPhrase(phrase, 10, true, [], false, false).subscribe(res => {
            if (!phrase || phrase == this.latestSearchPhrase) {
                this.contacts = res;
                if (!callback && this.data && this.data.userId && 
                    this.contacts.every(item => item.userId != this.data.userId)
                )  {
                    this.contacts.push(<any>{userId: this.data.userId, name: this.data.userName});
                    this.model.userId = this.data.userId;
                }
                callback && callback(res);
            }
        });
    }

    contactLookupItems(event) {
        let search = this.latestSearchPhrase = event.event.target.value;
        if (this.contacts.length)
            this.contacts = [];

        event.component.option('opened', true);
        event.component.option('noDataText', this.l('LookingForItems'));

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            event.component.option('opened', true);
            event.component.option('noDataText', this.l('LookingForItems'));

            this.contactLookupRequest(search, res => {
                if (!res['length'])
                    event.component.option('noDataText', this.l('NoItemsFound'));
            });
        }, 500);
    }

    lookupFocusIn($event) {
        $event.component.option('opened', Boolean(this.contacts.length));
        if (!this.contacts.length)
            this.contactLookupRequest('', () => {
                this.userComponent.instance.option('value', '');
            });
    }

    onSave(event) {
        if (this.validator.validate().isValid) {
            this.model.expirationDate = moment(
                DateHelper.removeTimezoneOffset(this.model.expirationDate, true));
            this.dialogRef.close(this.model);
        }
    }

    initValidationGroup(event) {
        this.validator = event.component;
    }
}
