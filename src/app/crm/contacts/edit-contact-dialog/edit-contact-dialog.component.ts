/** Core imports */
import { Component, Inject, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';
import * as _ from 'underscore';
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import {
    AppStore,
    ContactLinkTypesStoreActions,
    ContactLinkTypesStoreSelectors,
    EmailUsageTypesStoreActions,
    EmailUsageTypesStoreSelectors,
    PhoneUsageTypesStoreActions,
    PhoneUsageTypesStoreSelectors
} from '@app/store';
import { AppConsts } from '@shared/AppConsts';
import {
    ContactEmailServiceProxy,
    ContactPhoneServiceProxy,
    ContactLinkServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: 'edit-contact-dialog.html',
    styleUrls: ['edit-contact-dialog.less'],
    host: {
        '(document:mouseup)': 'mouseUp($event)',
        '(document:mousemove)': 'mouseMove($event)'
    }
})
export class EditContactDialog {
    @ViewChild('countryPhoneNumber') countryPhoneNumber;
    isValid = false;
    action: string = this.data.value ? 'Edit' : 'Create';
    types: any[] = [];
    validator: any;
    movePos: any;
    isEditAllowed = this.contactsService.checkCGPermission(this.data.groupId);
    masks = AppConsts.masks;
    urlRegEx = AppConsts.regexPatterns.url;
    emailRegEx = AppConsts.regexPatterns.email;
    localization = AppConsts.localization;

    constructor(
        private elementRef: ElementRef,
        private contactEmailService: ContactEmailServiceProxy,
        private contactPhoneService: ContactPhoneServiceProxy,
        private contactLinkService: ContactLinkServiceProxy,
        private contactsService: ContactsService,
        private store$: Store<AppStore.State>,
        public dialogRef: MatDialogRef<EditContactDialog>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
        this[data.field + 'TypesLoad']();
    }

    getFilteredUsageTypes(types) {
        return types.filter((type) => {
            return type.isCompany == this.data.isCompany;
        });
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
            this.types = this.getFilteredUsageTypes(types);
        });
    }

    phoneNumberTypesLoad() {
        this.store$.dispatch(new PhoneUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(PhoneUsageTypesStoreSelectors.getPhoneUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.types = this.getFilteredUsageTypes(types);
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
        if (!this.dialogRef['_containerInstance']['_config'].hasBackdrop)
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

    trim(value: string): string {
        return value.replace(/ /g, '');
    }

    getUsageTypeHint(item) {
        return item && (['emailAddress', 'phoneNumber'].indexOf(this.data.field) >= 0) ?
            this.ls.l('ContactInformation_' + capitalize(this.data.field.slice(0, 5)) + 'TypeTooltip_' + item.id) : '';
    }
}
