import { AppConsts } from '@shared/AppConsts';
import { Component, Input, Output, EventEmitter, Injector, OnInit, ViewChild, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

import { DxTreeListComponent } from 'devextreme-angular';
import { FiltersService } from '@shared/filters/filters.service';
import { ClassificationServiceProxy, InstanceType, UpdateCategoryInput, CreateCategoryInput, GetCategoryTreeOutput } from '@shared/service-proxies/service-proxies';
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
    @Output() onFilterSelected: EventEmitter<any> = new EventEmitter();
    @Output() onTransactionDrop: EventEmitter<any> = new EventEmitter();
    @Output() onCategoriesChanged: EventEmitter<any> = new EventEmitter();

    @Input() instanceId: number;
    @Input() instanceType: string;

    @Input() width: string;
    @Input() height: string;
    @Input() showTitle: boolean;
    @Input() showClearSelection: boolean;
    @Input() showFilterIcon: boolean;
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
    categorization: GetCategoryTreeOutput;

    settings = {
        showCID: true,    /* Category ID */
        showTC: true,     /* Transaction Count */
        showAT: true,     /* Accounting types */
        padding: 7        
    };

    toolbarConfig = [
        {
            location: 'center', items: [
                {
                    name: 'find',
                    action: Function()
                },
                { name: 'sort', action: Function() },
                {
                    name: 'expandTree',
                    widget: 'dxDropDownMenu',
                    options: {
                        hint: this.l('Expand'),
                        items: [{
                            action: this.processExpandTree.bind(this, true, false),
                            text: this.l('Expand 1st level')
                        }, {
                            action: this.processExpandTree.bind(this, true, true),
                            text: this.l('Expand 2st level')
                        }, {
                            action: this.processExpandTree.bind(this, true, true),
                            text: this.l('Expand all')
                        }, {
                            type: 'delimiter'
                        }, {
                            action: this.processExpandTree.bind(this, false, false),
                            text: this.l('Collapse all'),
                        }]
                    }
                },
                { 
                    name: 'follow',
                    widget: 'dxDropDownMenu',
                    options: {
                        hint: this.l('Show category info'),
                        items: [
                            {
                              type: 'header',
                              text: this.l('Show category info'),
                              action: (event) => {
                                  event.jQueryEvent.stopPropagation();
                                  event.jQueryEvent.preventDefault();                                                                                    
                              }
                            },
                            {          
                              type: 'option',    
                              name: 'categoryId',
                              text: this.l('Category ID'),
                              action: (event) => {
                                  console.log(event);
                              }
                            },
                            {          
                              type: 'option',    
                              name: 'trCount',
                              text: this.l('Transaction Counts'),
                              action: () => {
                                  console.log(event);                                                  
                              }
                            },
                            {          
                              type: 'option',  
                              name: 'accTypes',                
                              text: this.l('Accounting types'),
                              action: () => {     
                                  console.log(event);
                              }
                            },
                            {
                              type: 'delimiter'
                            },
                            {          
                              text: this.l('+ Increase padding'),
                              action: (event) => {
                                  event.jQueryEvent.stopPropagation();
                                  event.jQueryEvent.preventDefault();                                                                                    
                              }
                            },
                            {          
                              text: this.l('- Decrease padding'),
                              action: (event) => {
                                  event.jQueryEvent.stopPropagation();
                                  event.jQueryEvent.preventDefault();                                                                                    
                              }
                            }
                        ]
                    }
                } 
            ]
        }
    ]

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _filtersService: FiltersService,
        private _classificationServiceProxy: ClassificationServiceProxy
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;        
    }

    ngOnInit() {
        this.refreshCategories();
    }

    processExpandTree(expandTypes, expandCategories) {
        _.mapObject(this.categorization.accountingTypes, (item, key) => {
            this.categoryList.instance[(expandTypes ? 'expand': 'collapse') + 'Row'](key + item.typeId);
        });
        _.mapObject(this.categorization.categories, (item, key) => {
            if (!item.parentId) {
                let method = this.categoryList.instance[
                    (expandCategories ? 'expand': 'collapse') + 'Row'];
                method(parseInt(key));
                method(key);
            }
        });
    }

    initDragAndDropEvents($event) {
        let img = new Image();
        img.src = 'assets/common/icons/drag-icon.svg';

        let sourceCategory = null;

        let clearDragAndDrop = () => {
            sourceCategory = null;
            $('.drag-hover').removeClass('drag-hover');
            $('dx-tree-list .dx-data-row').removeClass('droppable');
        };

        $event.element.find('.dx-data-row')
            .off('dragstart').off('dragend')
            .on('dragstart', (e) => {
                sourceCategory = {};
                sourceCategory.element = e.currentTarget;
                let elementKey = this.categoryList.instance.getKeyByRowIndex(e.currentTarget.rowIndex)
                e.originalEvent.dataTransfer.setData('Text', elementKey);
                e.originalEvent.dataTransfer.setDragImage(img, -10, -10);
                e.originalEvent.dropEffect = 'move';

                sourceCategory.cashType = sourceCategory.element.classList.contains('inflows') ? 'inflows' : 'outflows';
                let droppableQuery = 'dx-tree-list .dx-data-row.' + sourceCategory.cashType;
                $(droppableQuery).addClass('droppable');
            }).on('dragend', (e) => {
                clearDragAndDrop();
            });;

        $event.element.find('.category-drop-area')
            .off('dragenter').off('dragover').off('dragleave').off('drop')
            .on('dragenter', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                let targetTableRow = e.currentTarget.closest('tr');
                if (!this.checkCanDrop(targetTableRow, sourceCategory))
                    return;

                targetTableRow.classList.add('drag-hover');
            }).on('dragover', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                let targetTableRow = e.currentTarget.closest('tr');
                if (!this.checkCanDrop(targetTableRow, sourceCategory))
                    e.originalEvent.dataTransfer.dropEffect = "none";
            }).on('dragleave', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                e.currentTarget.closest('tr').classList.remove('drag-hover');
            }).on('drop', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                if (sourceCategory) {
                    let source = e.originalEvent.dataTransfer.getData('Text');
                    let target = this.categoryList.instance.getKeyByRowIndex(e.currentTarget.closest('tr').rowIndex);

                    this.handleCategoryDrop(source, target);
                }
                else {
                    let categoryId = this.categoryList.instance.getKeyByRowIndex(e.currentTarget.closest('tr').rowIndex);
                    let category = this.categorization.categories[categoryId];
                    let parentCategory = this.categorization.categories[category.parentId];

                    this.onTransactionDrop.emit({
                        categoryId: categoryId,
                        categoryName: category.name,
                        parentId: category.parentId,
                        parentName: parentCategory ? parentCategory.name : null
                    });
                }

                clearDragAndDrop();
            });
    }

    checkCanDrop(targetElement, sourceCategory): boolean {
        if (sourceCategory) {
            let targetCashType = targetElement.classList.contains('inflows') ? 'inflows' : 'outflows';
            if (sourceCategory.element == targetElement ||
                sourceCategory.cashType != targetCashType)
                return false;
        }
        else {
            if (targetElement.getAttribute('aria-level') == '0')
                return false;
        }

        return true;
    }

    handleCategoryDrop(sourceId, targetId) {
        let sourceCategory = this.categorization.categories[sourceId];
        let targetCategory = this.categorization.categories[targetId];

        let targetAccountingTypeId = parseInt(targetId);
        let targetAccountingType = this.categorization.accountingTypes[targetAccountingTypeId];
        let isMerge: boolean = false;

        let moveToId: number;
        let targetName: string;

        if (targetCategory) {
            if (sourceCategory.parentId && targetCategory.parentId || //subcategory -> subcategory
                sourceCategory.parentId && sourceCategory.parentId == targetId || //subcategory -> own parent
                !sourceCategory.parentId && !targetCategory.parentId || //category -> category
                !sourceCategory.parentId && targetCategory.parentId) //category -> subcategory
            {
                isMerge = true;
            }

            if (!sourceCategory.parentId && targetCategory.parentId && _.some(this.categorization.categories, (x) => x.parentId == sourceId)) {
                abp.message.warn(this.l('MoveMergeCategoryWithChildsToChild'));
                return;
            }

            moveToId = targetId;
            targetName = targetCategory.name;
        }
        else {
            targetName = targetAccountingType.name;
        }
        
        if (isMerge) {
            abp.message.confirm(this.l('CategoryMergeConfirmation', targetName), this.l('CategoryMergeConfirmationTitle'), (result) => {
                if (result) {
                    this._classificationServiceProxy.deleteCategory(
                        InstanceType[this.instanceType],
                        this.instanceId,
                        moveToId, false, sourceId)
                        .subscribe((id) => {
                            this.refreshCategories(false);
                            this.onCategoriesChanged.emit();
                        }, (error) => {
                            this.refreshCategories(false);
                        });
                }
            });
        }
        else {
            abp.message.confirm(this.l('CategoryMoveConfirmation', sourceCategory.name, targetName), this.l('CategoryMoveConfirmationTitle'), (result) => {
                if (result) {
                    this._classificationServiceProxy.updateCategory(
                        InstanceType[this.instanceType],
                        this.instanceId,
                        new UpdateCategoryInput({
                            id: sourceId,
                            parentId: targetCategory ? targetId : targetAccountingType ? null : sourceCategory.parentId,
                            accountingTypeId: targetAccountingType ? targetAccountingTypeId : sourceCategory.accountingTypeId,
                            name: sourceCategory.name,
                            coAID: sourceCategory.coAID,
                        })
                    ).subscribe((result) => {
                        this.refreshCategories(false);
                        this.onCategoriesChanged.emit();
                    });

                    this.onCategoriesChanged.emit();
                }
            });
        }
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
                            parent: 'root',
                            coAID: null,
                            name: item.name,
                            typeId: item.typeId
                        });
                    });
                }
                if (data.categories)
                    _.mapObject(data.categories, (item, key) => {
                        if (data.accountingTypes[item.accountingTypeId] &&
                            (!item.parentId || data.categories[item.parentId]))
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
                    this.categoryList.instance.expandRow(category.accountingTypeId + data.accountingTypes[category.accountingTypeId].typeId);
                    setTimeout(() => {
                        this.categoryList.instance.selectRows([this.categoryId], true);
                    }, 0);
                }
            }
        );
    }

    addActionButton(name, container, callback) {
        $('<a>')
            .text(this.l(this.capitalize(name)))
            .addClass("dx-link dx-link-" + name)
            .on("click", callback)
            .appendTo(container);
    }

    onCellPrepared($event) {
        if ($event.rowType === "data" && $event.column.command === "edit") {            
            if ($event.data.key)
                this.addActionButton('delete', $event.cellElement, (event) => {
                    this.categoryList.instance.deleteRow(
                        this.categoryList.instance.getRowIndexByKey($event.data.key));
                    this.categoryList.instance.deleteRow(
                        this.categoryList.instance.getRowIndexByKey(parseInt($event.data.key)));
                });
            if (this.showFilterIcon) 
                this.addActionButton('filter', $event.cellElement, (event) => {
                    let wrapper = $event.cellElement.parent();
                    if (!this.clearSelection(wrapper.hasClass('filtered-category'))) {
                        wrapper.addClass('filtered-category');
                        this.onFilterSelected.emit($event.data);
                    }
            });
        }
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
                    $event.data.name || undefined : category.name,
                accountingTypeId: category.accountingTypeId,
                parentId: category.parentId
            })
        ).subscribe((id) => {
            this.refreshCategories(false);
        }, (error) => {
            this.refreshCategories(false);
        });
    }

    onCategoryInserted($event) {
        let parentId = $event.data.parent,
            hasParentCategory = (parseInt(parentId) == parentId);
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
                    return (obj['key'] != itemId && obj['parent'] != itemId);
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
            return prefix + data.name;
        }
        return data.name;
    }

    onKeyDown($event) {
        if ($event.jQueryEvent.keyCode == 13) {
            $event.jQueryEvent.preventDefault();
            $event.jQueryEvent.stopPropagation();
            $event.element.find('.dx-treelist-focus-overlay').hide();
            $event.component.focus($event.component.getCellElement(0, 0));
            $event.component.saveEditData();
            $event.handled = true;
        }
    }

    private _prevClickDate = new Date();
    private _selectedKeys = [];
    onRowClick($event) {
        if (this._selectedKeys.indexOf($event.key.toString()) >= 0)
            this.categoryList.instance.deselectRows([$event.key]);
        this._selectedKeys = this.categoryList.instance.getSelectedRowKeys();
        if ($event.level > 0) {
            let nowDate = new Date();
            if (nowDate.getTime() - this._prevClickDate.getTime() < 500) {
                $event.jQueryEvent.originalEvent.preventDefault();
                $event.jQueryEvent.originalEvent.stopPropagation();
                $event.element.find('.dx-treelist-focus-overlay').show();
                $event.component.editRow($event.rowIndex);
            }
            this._prevClickDate = nowDate;
        }
    }

    clearSelection(clearFilter) {
        this.categoryList.instance.deselectAll();
        $('.filtered-category').removeClass('filtered-category');
        if (clearFilter)
            this.onFilterSelected.emit(null);
        return clearFilter;
    }

    onRowPrepared($event) {
        if ($event.rowType != 'data' || $event.key.rowIndex)
            return;

        let accounting = this.categorization.accountingTypes[
            $event.key >= 0 ? this.categorization.categories[$event.key]
                .accountingTypeId: parseInt($event.key)];
        if (accounting)
            $event.rowElement.addClass(accounting.typeId == 'I' ? 'inflows': 'outflows');
        if ($event.level > 0) {
            $event.rowElement.attr('draggable', true);
        }
    }
}
