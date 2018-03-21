import { Component, ViewChild, Injector, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { CustomersServiceProxy, CreateCustomerInput } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { DxTextBoxComponent, DxValidatorComponent, DxValidationSummaryComponent, DxButtonComponent } from 'devextreme-angular';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'createOrEditClientModal',
    templateUrl: 'create-or-edit-client-modal.component.html',
    styleUrls: ['create-or-edit-client-modal.component.less'],
    providers: [ CustomersServiceProxy ]
})
export class CreateOrEditClientModalComponent extends AppComponentBase {

    @ViewChild('nameInput') nameInput: ElementRef;
    @ViewChild('createOrEditModal') modal: ModalDirective;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    client: CreateCustomerInput = new CreateCustomerInput();
    profilePicture: string;

    private namePattern = AppConsts.regexPatterns.name;
    private validationError: string;
    readonly INPUT_MASK = {
        PhoneNumber: AppConsts.masks.phone
    };

    constructor(
        injector: Injector,
        private _customersService: CustomersServiceProxy,
        private _router: Router,
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    show(clientId?: number): void {
        this.client = new CreateCustomerInput();
        if (clientId) {
            //this._customersService.getCustomerInfo(clientId).subscribe(result => {
            //    this.client.firstName = result.primaryContactInfo.person.firstName;
            //    this.client.lastName = result.primaryContactInfo.person.lastName;
            //});
        }

        this.getProfilePicture();
        this.active = true;
        this.modal.show();
    }

    getProfilePicture(): void {
        this.profilePicture = '/assets/common/images/default-profile-picture.png';
    }

    save(event): void {
        if (!this.validate(event)) return;

        this.saving = true;
        this._customersService.createCustomer(this.client)
            .finally(() => { this.saving = false; })
            .subscribe(result => {
                if (result.similarCustomerExists) {
                    abp.message.confirm(
                        'Similar customer already exists',
                        'Are you sure?',
                        (isConfirmed) => {
                            if (isConfirmed) {
                                this.client.suppressSimilarContactWarning = true;
                                this._customersService.createCustomer(this.client)
                                    .finally(() => {
                                        this.client.suppressSimilarContactWarning = false;
                                    })
                                    .subscribe(result => {
                                        this.redirectToContactInformation(result.id);
                                    });
                            }
                        }
                    );
                } else {
                    this.redirectToContactInformation(result.id);
                }
            }
        );
    }

    redirectToContactInformation(id: number) {
        this._router.navigate(['app/crm/client/' + id + '/contact-information']);
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    validate(event): boolean {
        if (!this.client.emailAddress && !this.client.phoneNumber) {
            this.validationError = this.l('EmailOrPhoneIsRequired');
            return false;
        } else {
            if (this.client.emailAddress && !this.validateEmailAddress()) {
                this.validationError = this.l('EmailIsNotValid');
                return false;
            }

            if (this.client.phoneNumber && !this.validatePhoneNumber()) {
                this.validationError = this.l('PhoneFormatError');
                return false;
            }

            this.validationError = null;
        }

        if (event.validationGroup.validate().isValid) {
            event.component.option('disabled', true);
            return true;
        }
    }

    validateEmailAddress(): boolean {
        let regex = AppConsts.regexPatterns.email;
        return regex.test(this.client.emailAddress);
    }

    validatePhoneNumber(): boolean {
        let regex = AppConsts.regexPatterns.phone;
        return regex.test(this.client.phoneNumber);
    }

    twoDigitsFormat(value) {
        return ('0' + value).slice(-2);
    }

    focusInput(event) {
        if (!(event.component._value && event.component._value.trim())) {
            let input = event.event.originalEvent.target;
            event.component.option({
                mask: this.INPUT_MASK[input.name],
                isValid: true
            });
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

    blurInput(event) {
        if (!(event.component._value && event.component._value.trim()))
            event.component.option({ mask: '', value: '', isValid: true });
    }
}
