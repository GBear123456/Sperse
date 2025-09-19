/** Core imports */
import { Component, Inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

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
    ContactLinkTypesStoreSelectors
} from '@app/store';
import { EmailUsageTypesStoreActions, EmailUsageTypesStoreSelectors, PhoneUsageTypesStoreActions, PhoneUsageTypesStoreSelectors } from '@root/store';
import { AppConsts } from '@shared/AppConsts';
import {
    ContactEmailServiceProxy,
    ContactPhoneServiceProxy,
    ContactLinkServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';
import { ContactsService } from '../contacts.service';

@Component({
    templateUrl: 'edit-contact-dialog.html',
    styleUrls: ['edit-contact-dialog.less'],
    host: {
        '(document:mouseup)': 'mouseUp($event)',
        '(document:mousemove)': 'mouseMove($event)'
    }
})
export class EditContactDialog implements AfterViewInit {
    @ViewChild('countryPhoneNumber') countryPhoneNumber;
    isValid = false;
    action: string = this.data.value ? 'Edit' : 'Create';
    types: any[] = [];
    validator: any;
    movePos: any;
    isEditAllowed = this.permissionService.checkCGPermission(this.data.groups) || 
        this.data.isCompany && this.permissionService.isGranted(AppPermissions.CRMCompaniesManageAll);
    masks = AppConsts.masks;
    urlRegEx = AppConsts.regexPatterns.url;
    emailRegEx = AppConsts.regexPatterns.email;
    localization = AppConsts.localization;

    constructor(
        private elementRef: ElementRef,
        private contactEmailService: ContactEmailServiceProxy,
        private contactPhoneService: ContactPhoneServiceProxy,
        private contactLinkService: ContactLinkServiceProxy,
        private store$: Store<AppStore.State>,
        private permissionService: AppPermissionService,
        public dialogRef: MatDialogRef<EditContactDialog>,
        public contactsService: ContactsService,
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
            this.types = _.sortBy(types, "name");
            if (!this.data.usageTypeId)
                this.data.usageTypeId = this.types[0].id;
        });
    }

    emailAddressTypesLoad() {
        this.store$.dispatch(new EmailUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(EmailUsageTypesStoreSelectors.getEmailUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.types = this.getFilteredUsageTypes(types);
            if (!this.data.usageTypeId)
                this.data.usageTypeId = this.types[0].id;
        });
    }

    phoneNumberTypesLoad() {
        this.store$.dispatch(new PhoneUsageTypesStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(PhoneUsageTypesStoreSelectors.getPhoneUsageTypes),
            filter(types => !!types)
        ).subscribe(types => {
            this.types = this.getFilteredUsageTypes(types);
            if (!this.data.usageTypeId)
                this.data.usageTypeId = this.types[0].id;
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

    onSave() {
        // Validate email field
        if (this.data.field === 'emailAddress') {
            const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
            if (emailInput && !emailInput.checkValidity()) {
                emailInput.reportValidity();
                return;
            }
        }
        
        // Validate phone field
        if (this.data.field === 'phoneNumber' && !this.countryPhoneNumber.isValid()) {
            return;
        }
        
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

    getEmailType() {
        if (this.data.field !== 'emailAddress') return null;
        
        // Map usage type to display name
        const type = this.types.find(t => t.id === this.data.usageTypeId);
        if (!type) return 'Personal';
        
        const typeName = type.name.toLowerCase();
        if (typeName.includes('personal') || typeName.includes('home')) return 'Personal';
        if (typeName.includes('work') || typeName.includes('business')) return 'Work';
        return 'Other';
    }

    setEmailType(type: string) {
        if (this.data.field !== 'emailAddress') return;
        
        // Map display name to usage type
        let targetType;
        switch (type) {
            case 'Personal':
                targetType = this.types.find(t => t.name.toLowerCase().includes('personal') || t.name.toLowerCase().includes('home'));
                break;
            case 'Work':
                targetType = this.types.find(t => t.name.toLowerCase().includes('work') || t.name.toLowerCase().includes('business'));
                break;
            case 'Other':
                targetType = this.types.find(t => t.name.toLowerCase().includes('other') || t.name.toLowerCase().includes('additional'));
                break;
        }
        
        if (targetType) {
            this.data.usageTypeId = targetType.id;
        }
    }

    getPhoneType() {
        if (this.data.field !== 'phoneNumber') return null;
        
        // Map usage type to display name
        const type = this.types.find(t => t.id === this.data.usageTypeId);
        if (!type) return 'Mobile';
        
        const typeName = type.name.toLowerCase();
        if (typeName.includes('mobile') || typeName.includes('cell')) return 'Mobile';
        if (typeName.includes('home') || typeName.includes('personal')) return 'Home';
        if (typeName.includes('work') || typeName.includes('business')) return 'Work';
        if (typeName.includes('fax')) return 'Fax';
        return 'Other';
    }

    setPhoneType(type: string) {
        if (this.data.field !== 'phoneNumber') return;
        
        // Map display name to usage type
        let targetType;
        switch (type) {
            case 'Mobile':
                targetType = this.types.find(t => t.name.toLowerCase().includes('mobile') || t.name.toLowerCase().includes('cell'));
                break;
            case 'Home':
                targetType = this.types.find(t => t.name.toLowerCase().includes('home') || t.name.toLowerCase().includes('personal'));
                break;
            case 'Work':
                targetType = this.types.find(t => t.name.toLowerCase().includes('work') || t.name.toLowerCase().includes('business'));
                break;
            case 'Fax':
                targetType = this.types.find(t => t.name.toLowerCase().includes('fax'));
                break;
            case 'Other':
                targetType = this.types.find(t => t.name.toLowerCase().includes('other') || t.name.toLowerCase().includes('additional'));
                break;
        }
        
        if (targetType) {
            this.data.usageTypeId = targetType.id;
        }
    }

    ngAfterViewInit() {
        // Handle placeholder behavior for all input fields
        setTimeout(() => {
            // Handle email address input
            const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
            if (emailInput) {
                emailInput.addEventListener('focus', () => {
                    emailInput.placeholder = '';
                });
                
                emailInput.addEventListener('blur', () => {
                    if (!emailInput.value) {
                        emailInput.placeholder = 'Enter email address';
                    }
                });
            }

            // Handle comment/note textarea
            const textarea = document.querySelector('textarea[name="comment"]') as HTMLTextAreaElement;
            if (textarea) {
                textarea.addEventListener('focus', () => {
                    textarea.placeholder = '';
                });
                
                textarea.addEventListener('blur', () => {
                    if (!textarea.value) {
                        textarea.placeholder = this.data.field === 'emailAddress' ? 'Add a note about this email' : 'Add a comment';
                    }
                });
            }
        }, 100);
    }
}
