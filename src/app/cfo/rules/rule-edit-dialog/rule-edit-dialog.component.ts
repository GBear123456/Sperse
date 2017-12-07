import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, OnInit, AfterViewInit, ViewChild } from '@angular/core';

import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { DxTreeListComponent } from 'devextreme-angular';

import { CategorizationServiceProxy } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
  selector: 'rule-dialog',
  templateUrl: 'rule-edit-dialog.component.html',
  styleUrls: ['rule-edit-dialog.component.less'],
  providers: [CategorizationServiceProxy]  
})
export class RuleDialogComponent extends ModalDialogComponent implements OnInit, AfterViewInit {
  @ViewChild(DxTreeListComponent) categoryList: DxTreeListComponent;
  categories: any = [];
/*
   [{
        "id": 1,
        "parentId": 0,
        "category": "John Heart"
    },
    {
        "id": 2,
        "parentId": 1,
        "category": "Samantha Bright"
    },
    {
        "id": 3,
        "parentId": 1,
        "category": "Arthur Miller"
    },
    {
        "id": 4,
        "parentId": 1,
        "category": "Robert Reagan"
    },
    {
        "id": 5,
        "parentId": 2,
        "category": "Greta Sims"
    }];
*/
  constructor(
    injector: Injector,
    private _categorizationService: CategorizationServiceProxy
  ) { 
      super(injector);

      _categorizationService.getCategories().subscribe((data) => {
          console.log(data);
          if (data.types)
               _.mapObject(data.types, (item, key) => {
                  this.categories.push({
                      id: key,
                      parentId: 0,
                      category: item.name
                  });
              });
          if (data.groups)
               _.mapObject(data.groups, (item, key) => {
                  this.categories.push({
                      id: key,
                      parentId: item.typeId,
                      category: item.name
                  });
              });
          if (data.items)
               _.mapObject(data.items, (item, key) => {
                  this.categories.push({
                      id: key,
                      parentId: item.groupId,
                      category: item.name
                  });
              });
          this.categoryList.instance.refresh();
      });
  }

  ngOnInit() {
      this.data.categories = this.categories;
      this.data.name = 'This is the rule name';
      this.data.editTitle = false;
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

  ngAfterViewInit() {
      this.categoryList.instance.refresh();
  }
}