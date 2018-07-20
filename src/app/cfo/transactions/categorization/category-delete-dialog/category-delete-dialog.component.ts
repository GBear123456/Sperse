import { Component, Injector, OnInit, ViewChild } from '@angular/core';

import { DxTreeListComponent } from 'devextreme-angular';

import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';

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

    confirm() {
        if (!this.data.deleteAllReferences) {
            let selected = this.categoryList.instance.getSelectedRowsData(),
                key = selected.length && parseInt(selected[0].key);
            this.data.categoryId = this.data.categorizations[key] && key || undefined;
            if (!this.data.categoryId)
                return this.notify.error(this.l('Category should be selected'));
        }
        this.dialogRef.close(true);
    }
}
