import { AppConsts } from '@shared/AppConsts';
import { Component, Input, Output, EventEmitter, Injector, OnInit, ViewChild, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DxTreeListComponent } from 'devextreme-angular';
import { FiltersService } from '@shared/filters/filters.service';
import { ClassificationServiceProxy, InstanceType, UpdateCategoryInput,
    UpdateCategoryGroupInput, CreateCategoryGroupInput, CreateCategoryInput  } from '@shared/service-proxies/service-proxies';
import { CategoryDeleteDialogComponent } from './category-delete-dialog/category-delete-dialog.component';
import { MatDialog } from '@angular/material';

import * as _ from 'underscore';

@Component({
  selector: 'categorization',
  templateUrl: 'categorization.component.html',
  styleUrls: ['categorization.component.less'],
  providers: [ClassificationServiceProxy]
})
export class CategorizationComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxTreeListComponent) categoryList: DxTreeListComponent;
    @Output() close: EventEmitter<any> = new EventEmitter();
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();
    @Output() onTransactionDrop: EventEmitter<any> = new EventEmitter();

    @Input() instanceId: number;
    @Input() instanceType: string;    

    @Input() width: string;
    @Input() height: string;
    @Input() showTitle: boolean;
    @Input() categoryId: number;
    @Input('dragMode')
    set dragMode(value: boolean) {
        if (this.categoryList.instance)
            this.categoryList.instance.option('elementAttr', {
                dropAllowed: value
            });
    }
    @Input('isValid')
    set isValid(value: boolean) {
        setTimeout(() => {
            this.categoryList.instance.option(
                'elementAttr', {invalid: !value});
        }, 0);
    }

    autoExpand = true;
    categories: any;
    categorization: any;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _filtersService: FiltersService,
        private _classificationServiceProxy: ClassificationServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.refreshCategories();
    }

    initDragAndDropEvents($event) {
        let dragEnterTarget;
        $event.element.find('tr[aria-level="2"]')
            .off('dragenter').off('dragover').off('dragleave').off('drop')
            .on('dragenter', (e) => {
                e.originalEvent.preventDefault(); 
                e.originalEvent.stopPropagation();

                if (dragEnterTarget && dragEnterTarget != e.currentTarget)
                    dragEnterTarget.classList.remove('drag-hover');    

                dragEnterTarget = e.currentTarget;
                e.currentTarget.classList.add('drag-hover');
            }).on('dragover', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();
            }).on('dragleave', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                if (dragEnterTarget != e.currentTarget)
                    e.currentTarget.classList.remove('drag-hover');
            }).on('drop', (e) => {
                e.originalEvent.preventDefault(); 
                e.originalEvent.stopPropagation();

                this.onTransactionDrop.emit({
                    categoryId: this.categoryList.instance
                      .getKeyByRowIndex($(e.currentTarget).index())
                });
            });
    }

    getCategoryItemId(key) {
        return parseInt(key);
    }

    refreshCategories(autoExpand: boolean = true) {
        this.autoExpand = autoExpand;
        this._classificationServiceProxy.getCategories(
            InstanceType[this.instanceType], this.instanceId).subscribe((data) => {
                let categories = [];
                this.categorization = data;
                if (data.types)
                    _.mapObject(data.types, (item, key) => {
                        categories.push({
                            key: key,
                            parent: 0,
                            name: item.name
                        });
                    });
                if (data.groups)
                     _.mapObject(data.groups, (item, key) => {
                        categories.push({
                            key: key + item.typeId,
                            parent: item.typeId,
                            name: item.name
                        });
                    });
                if (data.items)
                     _.mapObject(data.items, (item, key) => {
                        if (data.groups[item.groupId])
                            categories.push({
                                key: key,
                                parent: item.groupId +
                                    data.groups[item.groupId].typeId,
                                name: item.name
                            });
                    });

                this.categories = categories;
                if (this.categoryId) {
                    this.categoryList.instance.focus();
                    let category = data.items[this.categoryId];
                    this.categoryList.instance.expandRow(data.groups[category.groupId].typeId);
                    this.categoryList.instance.expandRow(category.groupId + data.groups[category.groupId].typeId);
                    setTimeout(() => {
                        this.categoryList.instance.selectRows([this.categoryId], true);
                    }, 0);
                }
            }
        );
    }

    onCategoryUpdated($event) {
        let groupUpdate = this.categorization.groups[parseInt($event.key)];
        this._classificationServiceProxy['updateCategory' + (groupUpdate ? 'Group' : '')](
            InstanceType[this.instanceType],
            this.instanceId,
            (groupUpdate ? UpdateCategoryGroupInput: UpdateCategoryInput).fromJS({
                id: parseInt($event.key),
                groupId: groupUpdate ? undefined: this.categorization.items[$event.key].groupId,
                name: $event.data.name
            })
        ).subscribe((error) => {
            if (error)
                this.notify.error(this.l('SomeErrorOccurred'));
        });

    }

    onCategoryInserted($event) {
        let groupCreate = this.categorization.types[$event.data.parent];
        this._classificationServiceProxy['createCategory' + (groupCreate ? 'Group' : '')](
            InstanceType[this.instanceType],
            this.instanceId,
            (groupCreate ? CreateCategoryGroupInput: CreateCategoryInput).fromJS({
                cashFlowTypeId: $event.data.parent,
                groupId: this.getCategoryItemId($event.data.parent),
                name: $event.data.name
            })
        ).subscribe((id) => {
            if (isNaN(id))
                this.notify.error(this.l('SomeErrorOccurred'));
            this.refreshCategories(false);
        });
    }

    onCategoryRemoving($event) {
        $event.cancel = true;
        let itemId = this.getCategoryItemId($event.key),
            parentId = this.getCategoryItemId($event.data.parent);
        if (this.categorization.types[$event.data.parent]) {
            if (_.findWhere(this.categories, { parent: $event.key}))
                this.notify.error(this.l('Category group should be empty to perform delete action'));
            else
                this._classificationServiceProxy.deleteCategoryGroup(InstanceType[this.instanceType], this.instanceId, itemId)
                  .subscribe(() => {
                      this.refreshCategories(false);
                  });
        } else {
            let dialogData = {
                deleteAllReferences: true,
                categorizations: this.categorization.items,
                categories: _.filter(this.categories, (obj) => {
                    return (obj['parent'] && obj['key'] != itemId)
                        || (obj['key'] == this.categorization.groups[parentId].typeId);
                }),
                categoryId: undefined
            };
            this.dialog.open(CategoryDeleteDialogComponent, {
                data: dialogData
            }).afterClosed().subscribe((result) => {
                if (result)
                    this._classificationServiceProxy.deleteCategory(
                        InstanceType[this.instanceType],
                        this.instanceId,
                        dialogData.categoryId, dialogData.deleteAllReferences, itemId)
                            .subscribe(() => {
                                this.refreshCategories(false);
                            });
            });
        }
    }

    sortItem(val1, val2) {
        return val1.localeCompare(val2);
    }

/*
    onKeyDown($event) {
        if ($event.jQueryEvent.keyCode == 13) {
            $event.jQueryEvent.originalEvent.preventDefault();
            $event.jQueryEvent.originalEvent.stopPropagation();

            $event.component.saveEditData();
            $event.component.closeEditCell();

            $event.handled = true;
        }
    }
*/

    private _prevClickDate = new Date();
    onRowClick($event) {
        let nowDate = new Date();
        if (nowDate - this._prevClickDate < 500) {
            $event.jQueryEvent.originalEvent.preventDefault();
            $event.jQueryEvent.originalEvent.stopPropagation();

            $event.component.editRow($event.rowIndex);
        }
        this._prevClickDate = nowDate;
    }
}
