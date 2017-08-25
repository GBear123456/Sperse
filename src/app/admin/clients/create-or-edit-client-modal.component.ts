import { Component, ViewChild, Injector, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { CustomersServiceProxy, CreateCustomerInput } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { DxDateBoxComponent, DxTextBoxComponent, DxValidatorComponent, DxValidationSummaryComponent, DxButtonComponent } from 'devextreme-angular';

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

    readonly INPUT_MASK = {
        Ssn: "000-00-0000",
        PhoneNumber: "(000) 000-0000"
    }

    constructor(
        injector: Injector,
        private _customersService: CustomersServiceProxy
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
    }

    show(clientId?: number): void {
        if (clientId) {
            this._customersService.getCustomerInfo(clientId).subscribe(result => {
                this.client.firstName = result.primaryContactPersonalInfo.firstName;
                this.client.lastName = result.primaryContactPersonalInfo.lastName;
            });
        }

        this.getProfilePicture();
        this.active = true;
        this.modal.show();
    }

    getProfilePicture(): void {
        this.profilePicture = "/assets/common/images/default-profile-picture.png";
    }
    
    save(event): void {
        if (!this.validate(event)) return;

        this.saving = true;
        this._customersService.createCustomer(this.client)
            .finally(() => { this.saving = false; })
            .subscribe(result => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
        });
    }

    validate(event): boolean {
        if (event.validationGroup.validate().isValid) {
            event.component.option('disabled', true);
            return true;
        }
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    focusDateBirth(event) {
        setTimeout(function () {
            event.component._popup._$popupContent.find('.dx-calendar').dxCalendar({
                zoomLevel: 'decade',
                value: new Date(1980, 0)
            });
        }, 0);

        event.component.open();
    }

    focusInput(event) {
        if (!(event.component._value && event.component._value.trim())) {
            var input = event.jQueryEvent.originalEvent.target;
            event.component.option({
                mask: this.INPUT_MASK[input.name],
                maskRules: { 'D': /\d?/ },
                isValid: true
            });
            setTimeout(function () {
                if (input.createTextRange) {
                    var part = input.createTextRange();
                    part.move("character", 0);
                    part.select();
                } else if (input.setSelectionRange)
                    input.setSelectionRange(0, 0);

                input.focus();
            }, 100);
        }
    }

    blurInput(event) {
        if (!(event.component._value && event.component._value.trim()))
            event.component.option({ mask: "", value: "", isValid: true });
    }
}
