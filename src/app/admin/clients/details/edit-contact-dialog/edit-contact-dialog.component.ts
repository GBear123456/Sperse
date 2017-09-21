import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';

import { 
  ContactEmailServiceProxy,
  ContactPhoneServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'edit-contact-dialog',
  templateUrl: 'edit-contact-dialog.html',
  styleUrls: ['edit-contact-dialog.less']
})
export class EditContactDialog extends AppComponentBase {
  isValid: boolean = false;
  action: string;
  types: any[] = [];
  validator: any;

  private readonly INPUT_MASK = {
    phone: "(000) 000-0000",
    phoneExtension: "0000000000"
  }

  constructor(
    injector: Injector,
    @Inject(MD_DIALOG_DATA) public data: any,
    public dialogRef: MdDialogRef<EditContactDialog>,
    private _contactEmailService: ContactEmailServiceProxy,
    private _contactPhoneService: ContactPhoneServiceProxy
  ) { 
    super(injector, AppConsts.localization.CRMLocalizationSourceName);

    this[data.field + 'TypesLoad']();
    this.action = this.l(data.value ? 'Edit': 'Create');
  }

  emailAddressTypesLoad() {
    this._contactEmailService.getEmailUsageTypes().subscribe(result => {      
      this.types = result.items;
    });
  }

  phoneNumberTypesLoad() {
    this._contactPhoneService.getPhoneUsageTypes().subscribe(result => {      
      this.types = result.items;
    });
  }

  focusInput(event) {
    if (!(event.component._value && event.component._value.trim())) {
      var input = event.jQueryEvent.originalEvent.target;
      event.component.option({
        mask: this.INPUT_MASK[input.name],
        isValid: true
      });
      setTimeout(function(){
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
      event.component.option({mask: "", value: ""});
  }

  onSave(event) {
    if (this.validator.validate().isValid)
      this.dialogRef.close(true);
  }

  initValidationGroup(event){
    this.validator = event.component;
  }
}