import { Component, ViewChild, Injector, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { CustomersServiceProxy, CreateCustomerInput } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { DxDateBoxComponent, DxTextBoxComponent, DxValidatorComponent, DxValidationSummaryComponent, DxButtonComponent } from 'devextreme-angular';
import * as moment from 'moment';

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

    active: boolean = false;
    saving: boolean = false;

    client: CreateCustomerInput = new CreateCustomerInput();
    profilePicture: string;

    private masks = AppConsts.masks;
    private namePattern = AppConsts.regexPatterns.name;
    private maxDob = new Date();
    private minDob = new Date(1900, 0);

    constructor(
        injector: Injector,
        private _customersService: CustomersServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.maxDob = new Date(this.maxDob.setFullYear(this.maxDob.getFullYear() - 21));
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

        let date = new Date(this.client.dob.toString()),
            month = date.getMonth() + 1,
            day = date.getDate();

        this.client.dob = moment(
            Date.parse(
                date.getFullYear() + '-' +
                this.twoDigitsFormat(month) + '-' +
                this.twoDigitsFormat(day) +
                'T00:00:00.000Z'
            )
        );

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
                                        this.closeSuccessfull();
                                    });
                            }
                        }
                    );
                } else {
                    this.closeSuccessfull();
                }
            }
        );
    }

    closeSuccessfull() {
        this.notify.info(this.l('SavedSuccessfully'));
        this.close();
        this.modalSave.emit(null);
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    validate(event): boolean {
        if (event.validationGroup.validate().isValid) {
            event.component.option('disabled', true);
            return true;
        }
    }

    focusDateBirth(event) {
        let value = this.client.dob ? this.client.dob : new Date(1980, 0);
        setTimeout(function () {
            event.component._popup._$popupContent.find('.dx-calendar').dxCalendar({
                zoomLevel: 'decade',
                value: value
            });
        }, 0);

        event.component.open();
    }

    twoDigitsFormat(value) {
        return ('0' + value).slice(-2);
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
}
