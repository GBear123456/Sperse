import { AppConsts } from '@shared/AppConsts';
import { Component, Input, Output, EventEmitter, Injector, OnInit, ViewChild, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DxTreeListComponent } from 'devextreme-angular';
import { FiltersService } from '@shared/filters/filters.service';
import { ClassificationServiceProxy, InstanceType, UpdateCategoryInput, CreateCategoryInput } from '@shared/service-proxies/service-proxies';
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
    @Input() showClearSelection: boolean;
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
                'elementAttr', { invalid: !value });
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
        $event.element.find('tr[aria-level="1"], tr[aria-level="2"]')
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

    refreshCategories(autoExpand: boolean = true) {
        this.autoExpand = autoExpand;
        this._classificationServiceProxy.getCategoryTree(
            InstanceType[this.instanceType], this.instanceId).subscribe((data) => {
                let categories = [];
                this.categorization = data;
                if (data.accountingTypes) {
                    _.mapObject(data.accountingTypes, (item, key) => {
                        categories.push({
                            key: key + item.typeId,
                            parent: 0,
                            coAID: null,
                            name: item.name,
                            typeId: item.typeId
                        });
                    });
                }
                if (data.categories)
                    _.mapObject(data.categories, (item, key) => {
                        if (data.accountingTypes[item.accountingTypeId])
                            categories.push({
                                key: key,
                                parent: item.parentId || (item.accountingTypeId +
                                    data.accountingTypes[item.accountingTypeId].typeId),
                                coAID: item.coAID,
                                name: item.name
                            });
                    });

                this.categories = categories;
                if (this.categoryId) {
                    this.categoryList.instance.focus();
                    let category = data.categories[this.categoryId];
                    this.categoryList.instance.expandRow(data.accountingTypes[category.accountingTypeId].typeId);
                    this.categoryList.instance.expandRow(category.accountingTypeId + data.accountingTypes[category.accountingTypeId].typeId);
                    setTimeout(() => {
                        this.categoryList.instance.selectRows([this.categoryId], true);
                    }, 0);
                }
            }
            );
    }

    onCategoryUpdated($event) {
        let category = this.categorization.categories[$event.key];
        this._classificationServiceProxy.updateCategory(
            InstanceType[this.instanceType], this.instanceId,
            UpdateCategoryInput.fromJS({
                id: $event.key,
                coAID: $event.data.hasOwnProperty('coAID') ?
                    $event.data.coAID || undefined : category.coAID,
                name: $event.data.hasOwnProperty('name') ?
                    $event.data.name || undefined : category.name
            })
        ).subscribe((id) => {
            this.refreshCategories(false);
        }, (error) => {
            this.refreshCategories(false);
        });
    }

    onCategoryInserted($event) {
        let parentId = $event.data.parent,
            hasParentCategory = Boolean(parseInt(
                parentId.split('').reverse().join('')));
        this._classificationServiceProxy.createCategory(
            InstanceType[this.instanceType], this.instanceId,
            CreateCategoryInput.fromJS({
                accountingTypeId: hasParentCategory ? this.categorization
                    .categories[parentId].accountingTypeId : parseInt(parentId),
                parentId: hasParentCategory ? parentId : null,
                coAID: $event.data.coAID,
                name: $event.data.name
            })
        ).subscribe((id) => {
            this.refreshCategories(false);
        }, (error) => {
            this.refreshCategories(false);
        });
    }

    onCategoryRemoving($event) {
        $event.cancel = true;
        let itemId = parseInt($event.key),
            dialogData = {
                deleteAllReferences: true,
                categorizations: this.categorization.categories,
                categories: _.filter(this.categories, (obj) => {
                    return !obj['parent'] || (obj['key'] != itemId && obj['parent'] != itemId);
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
                    .subscribe((id) => {
                        this.refreshCategories(false);
                    }, (error) => {
                        this.refreshCategories(false);
                    });
        });
    }

    sortItem(val1, val2) {
        return val1.localeCompare(val2);
    }

    calculateSortValue(data) {
        if (data.typeId) {
            let prefix = '';
            if (data.typeId == 'I')
                prefix = (<any>this).sortOrder == 'asc' ? "aaa" : "zzz";
            console.log(prefix + data.name);
            return prefix + data.name;
        }
        return data.name;
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
        if ($event.level < 2)
            return;

        let nowDate = new Date();
        if (nowDate.getTime() - this._prevClickDate.getTime() < 500) {
            $event.jQueryEvent.originalEvent.preventDefault();
            $event.jQueryEvent.originalEvent.stopPropagation();

            $event.component.editRow($event.rowIndex);
        }
        this._prevClickDate = nowDate;
    }

    clearSelection(e) {
        this.categoryList.instance.deselectAll();
    }
}
