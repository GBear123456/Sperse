/** Core imports */
import { Component, Inject, Injector, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { filter } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppStore, ContactLinkTypesStoreActions, ContactLinkTypesStoreSelectors, EmailUsageTypesStoreActions, EmailUsageTypesStoreSelectors, PhoneUsageTypesStoreActions, PhoneUsageTypesStoreSelectors } from '@app/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import {
    ContactEmailServiceProxy,
    ContactPhoneServiceProxy,
    ContactLinkServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'edit-contact-dialog',
    templateUrl: 'edit-contact-dialog.html',
    styleUrls: ['edit-contact-dialog.less'],
    host: {
        '(document:mouseup)': 'mouseUp($event)',
        '(document:mousemove)': 'mouseMove($event)'
    }
})
export class EditContactDialog extends AppComponentBase {
    @ViewChild('countryPhoneNumber') countryPhoneNumber;

    isValid = false;
    action: string;
    types: any[] = [];
    validator: any;
    movePos: any;

    isEditAllowed = false;

    masks = AppConsts.masks;
    urlRegEx = AppConsts.regexPatterns.url;

    constructor(injector: Injector,
                @Inject(MAT_DIALOG_DATA) public data: any,
                private elementRef: ElementRef,
                public dialogRef: MatDialogRef<EditContactDialog>,
                private _contactEmailService: ContactEmailServiceProxy,
                private _contactPhoneService: ContactPhoneServiceProxy,
                private _contactLinkService: ContactLinkServiceProxy,
                private store$: Store<AppStore.State>) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');

        this[data.field + 'TypesLoad']();
        this.action = data.value ? 'Edit' : 'Create';
    }

    urlTypesLoad() {
        this.store$.dispatch(new ContactLinkTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(ContactLinkTypesStoreSelectors.getContactLinkTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.types = types;
        });
    }

    emailAddressTypesLoad() {
        this.store$.dispatch(new EmailUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(EmailUsageTypesStoreSelectors.getEmailUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.types = types;
        });
    }

    phoneNumberTypesLoad() {
        this.store$.dispatch(new PhoneUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(PhoneUsageTypesStoreSelectors.getPhoneUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.types = types;
        });
    }

    focusInput(event) {
        if (!(event.component._value && event.component._value.trim())) {
            let input = event.event.originalEvent.target;
            setTimeout(function () {
                if (input.createTextRange) {
                    let part = input.createTextRange();
                    part.move('character', 0);
                    part.select();
                } else if (input.setSelectionRange)
                    input.setSelectionRange(0, 0);

                input.focus();
            }, 100);
        }
    }

    onTypeChanged(event) {
        let type = _.findWhere(this.types, {id: event.value});
        if (type.isSocialNetwork)
          this.data.isSocialNetwork = true;
    }

    onSave(event) {
        if (this.validator.validate().isValid && (this.data.field != 'phoneNumber' || this.countryPhoneNumber.isValid()))
            this.dialogRef.close(true);
    }

    initValidationGroup(event) {
        this.validator = event.component;
    }

    mouseDown(event) {
        this.movePos = {
            x: event.clientX,
            y: event.clientY
        };
    }

    mouseUp(event) {
        this.movePos = null;
    }

    mouseMove(event) {
        if (this.movePos) {
            let x = event.clientX - this.movePos.x,
                y = event.clientY - this.movePos.y,
                elm = this.elementRef.nativeElement
                    .parentElement.parentElement;

            this.dialogRef.updatePosition({
                top: parseInt(elm.style.marginTop) + y + 'px',
                left: parseInt(elm.style.marginLeft) + x + 'px'
            });

            this.mouseDown(event);
        }
    }

    ngOnDestroy() {

    }
}
