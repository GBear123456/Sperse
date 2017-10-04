import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, ElementRef } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';

import * as _ from 'underscore';

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
    '(document:mouseup)': "mouseUp($event)",
    '(document:mousemove)': "mouseMove($event)"
  }
})
export class EditContactDialog extends AppComponentBase {
  isValid: boolean = false;
  action: string;
  types: any[] = [];
  validator: any;
  movePos: any;

  private readonly INPUT_MASK = {
    phone: "(000) 000-0000",
    phoneExtension: "0000000000"
  }

  constructor(
    injector: Injector,
    @Inject(MD_DIALOG_DATA) public data: any,
    private elementRef: ElementRef,
    public dialogRef: MdDialogRef<EditContactDialog>,
    private _contactEmailService: ContactEmailServiceProxy,
    private _contactPhoneService: ContactPhoneServiceProxy,
    private _contactLinkService: ContactLinkServiceProxy
  ) { 
    super(injector, AppConsts.localization.CRMLocalizationSourceName);

    this[data.field + 'TypesLoad']();
    this.action = data.value ? 'Edit': 'Create';
  }

  urlTypesLoad() {
    this._contactLinkService.getContactLinkTypes().subscribe(result => {
      this.types = result.items;
      this.types.unshift({id: 'O', name: this.l('Other Link')});
    });
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

  onTypeChanged(event) { 
    let type = _.findWhere(this.types, {id: event.value});
    if (type.isSocialNetwork)
      this.data.isSocialNetwork = true;
  }

  onSave(event) {
    if (this.validator.validate().isValid)
      this.dialogRef.close(true);
  }

  initValidationGroup(event){
    this.validator = event.component;
  }

  mouseDown(event) {
    this.movePos =  {
      x: event.clientX,
      y: event.clientY
    }
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
}