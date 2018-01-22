import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, OnInit, AfterViewInit, ViewChild } from '@angular/core';

import { ConfirmDialogComponent } from '@shared/common/dialogs/confirm/confirm-dialog.component';
import { DxTreeListComponent } from 'devextreme-angular';

import * as _ from 'underscore';

@Component({
  selector: 'category-delete-dialog',
  templateUrl: 'category-delete-dialog.component.html',
  styleUrls: ['category-delete-dialog.component.less']
})
export class CategoryDeleteDialogComponent extends ConfirmDialogComponent implements OnInit {
    @ViewChild(DxTreeListComponent) categoryList: DxTreeListComponent;

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data.deleteAllReferences = false;
    }
        
    confirm($event) {
        if (!this.data.deleteAllReferences) {
            let selected = this.categoryList.instance.getSelectedRowsData(),
                key = selected.length && selected[0].key;
            this.data.categoryId = this.data.categorizations[key] && key || undefined;                
            if (!this.data.categoryId)
                return this.notify.error(this.l('Category should be selected'));
        }
        this.dialogRef.close(true);
    }
}