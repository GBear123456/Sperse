import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, OnInit } from '@angular/core';

import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
  selector: 'rule-dialog',
  templateUrl: 'rule-edit-dialog.component.html',
  styleUrls: ['rule-edit-dialog.component.less']
})
export class RuleDialogComponent extends ModalDialogComponent implements OnInit {
  ngOnInit() {
      this.data.name = 'This is the rule name';
      this.data.title = 'Define rule';
      this.data.buttons = [{
          title: this.l('Don\'t add'),
          class: 'default',
          action: () => {
              this.close(true);
          }
      }, {
          title: this.l('Add rule'),
          class: 'primary',
          action: () => {
              this.close(true);
          }
      }];
      this.data.options = [{
          text: this.l('Apply this rule to other 34 occurences'),
          value: true
      }];      
  }
}