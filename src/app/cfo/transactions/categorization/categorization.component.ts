import { AppConsts } from '@shared/AppConsts';
import { Component, Input, Output, EventEmitter, Injector, OnInit, ViewChild, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

import { DxTreeListComponent } from 'devextreme-angular';
import { FiltersService } from '@shared/filters/filters.service';
import {
    ClassificationServiceProxy, InstanceType, UpdateCategoryInput, CreateCategoryInput,
    GetCategoryTreeOutput, UpdateAccountingTypeInput, CreateAccountingTypeInput
} from '@shared/service-proxies/service-proxies';
import { CategoryDeleteDialogComponent } from './category-delete-dialog/category-delete-dialog.component';
import { MatDialog } from '@angular/material';
import DataSource from 'devextreme/data/data_source';

import * as _ from 'underscore';

@Component({
    selector: 'categorization',
    templateUrl: 'categorization.component.html',
    styleUrls: ['categorization.component.less'],
    providers: [ClassificationServiceProxy],
    host: {
        '(window:click)': 'toogleSearchInput($event)'
    }
})
export class CategorizationComponent extends CFOComponentBase implements OnInit {
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
    @Input() showHeader: boolean;
    @Input() showClearSelection: boolean;
    @Input() showFilterIcon: boolean;
    @Input() showAddEntity: boolean;
    @Input() includeNonCashflowNodes = false;
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
    @Input('transactionsFilter')
    set transactionsFilter(value: any[]) {
        this._transactionsFilterQuery = value;
        this.refreshTransactionsCountDataSource();
    }
    private _transactionsFilterQuery: any[];

    categories: any[] = [];
    types = [
        { id: 'E', name: 'Outflows' },
        { id: 'I', name: 'Inflows' }
    ];
    categorization: GetCategoryTreeOutput;
    columnClassName = '';
    showSearch = false;

    filteredRowData: any;
    noDataText: string;

    transactionsCountDataSource: DataSource;

    private _prevClickDate = new Date();
    private _selectedKeys = [];
    private _expandedRowKeys = [];
    private readonly MIN_PADDING = 7;
    private readonly MAX_PADDING = 17;
    private settings = {
        showCID: true, /* Category ID */
        showTC: false, /* Transaction Count */
        showAT: true, /* Accounting types */
        padding: this.MIN_PADDING,
        sorting: {
            field: 0,
            order: 'asc'
        }
    };
    private currentTypeId: any;

    toolbarConfig: any;

    constructor(injector: Injector,
        public dialog: MatDialog,
        private _filtersService: FiltersService,
        private _classificationServiceProxy: ClassificationServiceProxy) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit() {
        this.initSettings();
        this.refreshCategories(true);
        this.initToolbarConfig();

        this.transactionsCountDataSource = new DataSource({
            store: {
                type: 'odata',
                url: this.getODataURL('TransactionCount'),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.headers['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie();
                }
            },
            onChanged: this.setTransactionsCount.bind(this)
        });
    }

    initToolbarConfig() {

        let addEntityItems = [];
        this.types.forEach(x => {
            let item = {
                name: 'type' + x.id,
                text: this.l(x.name),
                action: (event) => {
                    this.addAccountingTypeRow(x.id);
                }
            };
            addEntityItems.push(item);
        });

        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'find',
                        action: (event) => {
                            event.event.stopPropagation();
                            event.event.preventDefault();

                            this.showSearch = !this.showSearch;
                        }
                    },
                    {
                        name: 'sort',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Sort'),
                            items: [{
                                action: this.handleSorting.bind(this, 0),
                                text: this.l('Sort by category')
                            }, {
                                action: this.handleSorting.bind(this, 1),
                                text: this.l('Sort by category ID')
                            }, {
                                action: Function(),
                                text: this.l('Sort by custom order')
                            }]
                        }
                    },
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
                                text: this.l('Expand 2nd level')
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
                    }
                ]
            }, {
                location: 'after', items: [
                    {
                        name: 'addEntity',
                        widget: 'dxDropDownMenu',
                        options: {
                            text: this.l('AddEntity'),
                            visible: this.showAddEntity && this.settings.showAT,
                            items: addEntityItems
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
                                        event.event.stopPropagation();
                                        event.event.preventDefault();
                                    }
                                },
                                {
                                    type: 'option',
                                    name: 'accTypes',
                                    checked: this.settings.showAT,
                                    text: this.l('Accounting types'),
                                    action: (event) => {
                                        if (event.event.target.tagName == 'INPUT') {
                                            this.settings.showAT = !this.settings.showAT;
                                            if (this.showAddEntity) {
                                                this.initToolbarConfig();
                                            }
                                            this.refreshCategories();
                                            this.storeSettings();
                                        }
                                    }
                                },
                                {
                                    type: 'delimiter'
                                },
                                {
                                    type: 'option',
                                    name: 'categoryId',
                                    checked: this.settings.showCID,
                                    text: this.l('Category ID'),
                                    action: (event) => {
                                        if (event.event.target.tagName == 'INPUT') {
                                            this.settings.showTC = false;
                                            event.itemElement.nextElementSibling.querySelector('input').checked = false;
                                            this.settings.showCID = !this.settings.showCID;
                                            this.storeSettings();
                                        }
                                    }
                                },
                                {
                                    type: 'option',
                                    name: 'trCount',
                                    checked: this.settings.showTC,
                                    text: this.l('Transaction Counts'),
                                    action: (event) => {
                                        let target = event.event.target;
                                        if (target.tagName == 'INPUT') {
                                            this.settings.showCID = false;
                                            event.itemElement.previousElementSibling.querySelector('input').checked = false;
                                            this.settings.showTC = !this.settings.showTC;
                                            this.storeSettings();
                                        }
                                    }
                                },
                                {
                                    type: 'delimiter'
                                },
                                {
                                    text: this.l('+ Increase padding'),
                                    disabled: this.settings.padding >= this.MAX_PADDING,
                                    action: this.handlePadding.bind(this, true)
                                },
                                {
                                    text: this.l('- Decrease padding'),
                                    disabled: this.settings.padding <= this.MIN_PADDING,
                                    action: this.handlePadding.bind(this, false)
                                }
                            ]
                        }
                    }
                ]
            }
        ];
    }

    sortByColumnIndex(index: number, order: string = '') {
        let columns = this.categoryList.instance.option('columns');

        columns[index].sortIndex = 0;
        columns[Number(!index)].sortIndex = 1;

        let oldClass = columns[index].sortOrder;
        columns[index].sortOrder = order ||
            (oldClass == 'asc' ? 'desc' : 'asc');

        this.categoryList.instance.option('columns', columns);
        this.categoryList.instance.refresh();
        return columns[index].sortOrder;
    }

    handleSorting(index, event) {
        let elementChildren = event.itemElement.parentElement.children;
        for (let i = 0; i < elementChildren.length; i++) {
            elementChildren[i].classList.remove('asc', 'desc');
        }

        this.settings.sorting.field = index;
        event.itemElement.classList.add(
            this.settings.sorting.order = this.sortByColumnIndex(index)
        );

        this.storeSettings();
    }

    handlePadding(increment, event) {
        event.event.stopPropagation();
        event.event.preventDefault();
        event.itemElement[increment ? 'nextElementSibling' : 'previousElementSibling']
            .classList.remove('dx-state-disabled');
        this.settings.padding += 2 * [-1, 1][Number(increment)];
        if (this.settings.padding >= this.MAX_PADDING) {
            this.settings.padding = this.MAX_PADDING;
            event.itemElement.classList.add('dx-state-disabled');
        } else if (this.settings.padding <= this.MIN_PADDING) {
            this.settings.padding = this.MIN_PADDING;
            event.itemElement.classList.add('dx-state-disabled');
        } else
            event.itemElement.classList.remove('dx-state-disabled');

        this.storeSettings();
        this.applyPadding();
    }

    applyPadding() {
        this.columnClassName = 'column-padding-' + this.settings.padding;
    }

    initSettings() {
        let settings: any = localStorage.getItem(
            this.constructor.name);
        if (settings)
            try {
                settings = JSON.parse(settings);
                for (let prt in settings) {
                    this.settings[prt] = settings[prt];
                }
            } catch (e) { }
        this.applyPadding();
    }

    storeSettings() {
        localStorage.setItem(this.constructor.name,
            JSON.stringify(this.settings));
    }

    processExpandTree(expandFirstLevel, expandSecondLevel) {
        if (this.settings.showAT) {
            _.mapObject(this.categorization.accountingTypes, (item, key) => {
                this.categoryList.instance[(expandFirstLevel ? 'expand' : 'collapse') + 'Row'](key + item.typeId);
            });
        }

        var expandCategories = (expandFirstLevel && !this.settings.showAT) || expandSecondLevel;
        _.mapObject(this.categorization.categories, (item, key) => {
            if (!item.parentId) {
                let method = this.categoryList.instance[
                    (expandCategories ? 'expand' : 'collapse') + 'Row'];
                method(parseInt(key));
            }
        });
    }

    onContentReady($event) {
        this.initDragAndDropEvents($event);
        if (this.filteredRowData) {
            let rowIndex = this.categoryList.instance.getRowIndexByKey(this.filteredRowData.key);
            let row = this.categoryList.instance.getRowElement(rowIndex);
            if (row && row[0]) row[0].classList.add('filtered-category');
        }
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

        let element = <any>$($event.element);
        element.find('.dx-data-row')
            .off('dragstart').off('dragend')
            .on('dragstart', (e) => {
                sourceCategory = {};
                sourceCategory.element = e.currentTarget;
                let elementKey = this.categoryList.instance.getKeyByRowIndex(e.currentTarget.rowIndex);
                e.originalEvent.dataTransfer.setData('Text', elementKey);
                e.originalEvent.dataTransfer.setDragImage(img, -10, -10);
                e.originalEvent.dropEffect = 'move';

                sourceCategory.cashType = sourceCategory.element.classList.contains('inflows') ? 'inflows' : 'outflows';
                let droppableQuery = 'dx-tree-list .dx-data-row.' + sourceCategory.cashType;
                $(droppableQuery).addClass('droppable');
            }).on('dragend', (e) => {
                clearDragAndDrop();
            });

        element.find('.category-drop-area')
            .off('dragenter').off('dragover').off('dragleave').off('drop')
            .on('dragenter', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                let targetTableRow = e.currentTarget.closest('tr');
                if (!this.checkCanDrop(targetTableRow, sourceCategory))
                    return;
                
                targetTableRow.classList.add('drag-hover');
                e.target.classList.add('element-drag-hover');
            }).on('dragover', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                let targetTableRow = e.currentTarget.closest('tr');
                if (!this.checkCanDrop(targetTableRow, sourceCategory))
                    e.originalEvent.dataTransfer.dropEffect = 'none';
            }).on('dragleave', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                e.target.classList.remove('element-drag-hover');                
                if (e.relatedTarget && (e.relatedTarget.classList.contains('category-drop-add-rule') || e.relatedTarget.classList.contains('category-drop-area')))
                    return;

                e.currentTarget.closest('tr').classList.remove('drag-hover');
            }).on('drop', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();
                
                if (sourceCategory) {
                    let source = e.originalEvent.dataTransfer.getData('Text');
                    let target = this.categoryList.instance.getKeyByRowIndex(e.currentTarget.closest('tr').rowIndex);
                    
                    this.handleCategoryDrop(source, target);
                } else {
                    let categoryId = this.categoryList.instance.getKeyByRowIndex(e.currentTarget.closest('tr').rowIndex);
                    let category = this.categorization.categories[categoryId];
                    let parentCategory = this.categorization.categories[category.parentId];

                    let showRuleDialog: boolean = e.target.classList.contains('category-drop-add-rule');
                    this.onTransactionDrop.emit({
                        categoryId: categoryId,
                        categoryName: category.name,
                        parentId: category.parentId,
                        parentName: parentCategory ? parentCategory.name : null,
                        categoryCashType: this.categorization.accountingTypes[category.accountingTypeId].typeId,
                        showRuleDialog: showRuleDialog
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
        } else {
            if (targetElement.classList.contains('accountingType'))
                return false;
        }

        return true;
    }

    handleCategoryDrop(sourceId, targetId) {
        let sourceCategory = this.categorization.categories[sourceId];
        let targetCategory = this.categorization.categories[targetId];

        let targetAccountingTypeId = parseInt(targetId);
        let targetAccountingType = this.categorization.accountingTypes[targetAccountingTypeId];
        let isMerge = false;

        let moveToId: number;
        let targetName: string;

        if (targetCategory) {
            if (sourceCategory.parentId && targetCategory.parentId || //subcategory -> subcategory
                sourceCategory.parentId && sourceCategory.parentId == targetId || //subcategory -> own parent
                !sourceCategory.parentId && !targetCategory.parentId || //category -> category
                !sourceCategory.parentId && targetCategory.parentId) { //category -> subcategory
                isMerge = true;
            }

            if (!sourceCategory.parentId && targetCategory.parentId && _.some(this.categorization.categories, (x) => x.parentId == sourceId)) {
                abp.message.warn(this.l('MoveMergeCategoryWithChildsToChild'));
                return;
            }

            moveToId = targetId;
            targetName = targetCategory.name;
        } else {
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
                            this.refreshCategories();
                            this.onCategoriesChanged.emit();
                        }, (error) => {
                            this.refreshCategories();
                        });
                }
            });
        } else {
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
                        this.refreshCategories();
                        this.onCategoriesChanged.emit();
                    });
                }
            });
        }
    }

    refreshCategories(expandInitial: boolean = false) {
        this.startLoading();
        this._classificationServiceProxy.getCategoryTree(
            InstanceType[this.instanceType], this.instanceId, this.includeNonCashflowNodes).subscribe((data) => {
                let categories = [];
                this.categorization = data;
                if (this.settings.showAT && data.accountingTypes) {
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
                        let accounting = data.accountingTypes[item.accountingTypeId];
                        if (accounting && (!item.parentId || data.categories[item.parentId])) {
                            categories.push({
                                key: parseInt(key),
                                parent: item.parentId || (this.settings.showAT ?
                                    item.accountingTypeId + accounting.typeId : 'root'),
                                coAID: item.coAID,
                                name: item.name,
                                typeId: accounting.typeId
                            });
                        }
                    });

                this.categories = categories;

                if (expandInitial) {
                    this.processExpandTree(true, false);
                }

                if (this.categoryId) {
                    this.categoryList.instance.focus();
                    let category = data.categories[this.categoryId];
                    this.categoryList.instance.expandRow(category.accountingTypeId + data.accountingTypes[category.accountingTypeId].typeId);
                    if (category.parentId)
                        this.categoryList.instance.expandRow(category.parentId);
                    setTimeout(() => {
                        this.categoryList.instance.selectRows([this.categoryId], true);
                    }, 0);
                }

                this.refreshTransactionsCountDataSource();
                setTimeout(() => this.finishLoading());
                if (!this.categories.length) this.noDataText = this.ls('Platform', 'NoData');
            }
            );
    }

    setTransactionsCount() {
        let items = this.transactionsCountDataSource.items();

        this.categories.forEach(x => {
            x.transactionsCount = items[0][x.key];
        });

        let accountingTypes: any[] = [];
        let parentCategories: any[] = [];

        this.categories.forEach(x => {
            if (isNaN(x.key))
                accountingTypes[x.key] = x;
            else if (parseInt(x.parent) != x.parent)
                parentCategories[x.key] = x;
        });

        this.categories.forEach(x => {
            if (parseInt(x.parent) == x.parent && x.transactionsCount) {
                let parentCategory = parentCategories[x.parent];
                if (parentCategory && x.transactionsCount)
                    parentCategory.transactionsCount = parentCategory.transactionsCount ? parentCategory.transactionsCount + x.transactionsCount : x.transactionsCount;
            }
        });

        if (this.settings.showAT)
            parentCategories.forEach(x => {
                let accountingType = accountingTypes[x.parent];
                if (x.transactionsCount)
                    accountingType.transactionsCount = accountingType.transactionsCount ? accountingType.transactionsCount + x.transactionsCount : x.transactionsCount;
            });
    }

    refreshTransactionsCountDataSource() {
        if (this.transactionsCountDataSource) {
            this.transactionsCountDataSource.store()['_url'] = this.getODataURL('TransactionCount', this._transactionsFilterQuery);
            this.transactionsCountDataSource.load();
        }
    }

    addActionButton(name, container: HTMLElement, callback) {
        let buttonElement = document.createElement('a');
        buttonElement.innerText = this.l(this.capitalize(name));
        buttonElement.className = 'dx-link dx-link-' + name;
        buttonElement.addEventListener('click', callback);
        container.appendChild(buttonElement);
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data' && $event.column.command === 'edit') {
            if ($event.data.key)
                this.addActionButton('delete', $event.cellElement, (event) => {
                    this.categoryList.instance.deleteRow(
                        this.categoryList.instance.getRowIndexByKey($event.data.key));
                });
            if (this.showFilterIcon)
                this.addActionButton('filter', $event.cellElement, (event) => {
                    let wrapper = $event.cellElement.parentElement;
                    if (!this.clearSelection(wrapper.classList.contains('filtered-category'))) {
                        wrapper.classList.add('filtered-category');
                        this.filteredRowData = $event.data;
                        this.onFilterSelected.emit($event.data);
                    }
                });
        }
    }

    updateAccountingType($event) {
        let id = parseInt($event.key),
            accounting = this.categorization.accountingTypes[id];
        this._classificationServiceProxy.updateAccountingType(
            InstanceType[this.instanceType], this.instanceId,
            UpdateAccountingTypeInput.fromJS({
                id: id,
                name: $event.data.hasOwnProperty('name') ? $event.data.name || undefined : accounting.name,
                cashflowTypeId: accounting.typeId
            })
        ).subscribe((id) => {
            this.refreshCategories();
        }, (error) => {
            this.refreshCategories();
        });
    }

    onCategoryUpdated($event) {
        if (isNaN($event.key)) {
            this.updateAccountingType($event);
        } else {
            let category = this.categorization.categories[$event.key];
            $event.element.querySelector('.dx-treelist-focus-overlay').style.display = '';
            this._classificationServiceProxy.updateCategory(
                InstanceType[this.instanceType], this.instanceId,
                UpdateCategoryInput.fromJS({
                    id: $event.key,
                    coAID: $event.data.hasOwnProperty('coAID') ? $event.data.coAID || undefined : category.coAID,
                    name: $event.data.hasOwnProperty('name') ? $event.data.name || undefined : category.name,
                    accountingTypeId: category.accountingTypeId,
                    parentId: category.parentId
                })
            ).subscribe((id) => {
                this.refreshCategories();
            }, (error) => {
                this.refreshCategories();
            });
        }
    }

    onCategoryInserted($event) {
        let parentId = $event.data.parent,
            hasParentCategory = (parseInt(parentId) == parentId);
        $event.element.querySelector('.dx-treelist-focus-overlay').style.display = 'none';
        if (this.settings.showAT && parentId === 'root') {
            this.insertAccountingType(this.currentTypeId, $event.data.name);
            return;
        }

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
            this.refreshCategories();
        }, (error) => {
            this.refreshCategories();
        });
    }

    onCategoryRemoving($event) {
        $event.cancel = true;
        let itemId = $event.key,
            isAccountingType = isNaN(itemId),
            dialogData = {
                deleteAllReferences: true,
                categorizations: this.categorization[isAccountingType ? 'accountingTypes' : 'categories'],
                categories: _.filter(this.categories, (obj) => {
                    return isAccountingType ? (obj['key'] != itemId && obj['parent'] == 'root') : (obj['key'] != itemId && obj['parent'] != itemId);
                }),
                categoryId: undefined
            };
        this.dialog.open(CategoryDeleteDialogComponent, {
            data: dialogData
        }).afterClosed().subscribe((result) => {
            if (result)
                this._classificationServiceProxy[isAccountingType ? 'deleteAccountingType' : 'deleteCategory'].call(
                    this._classificationServiceProxy,
                    InstanceType[this.instanceType],
                    this.instanceId,
                    dialogData.categoryId, dialogData.deleteAllReferences, parseInt(itemId))
                    .subscribe((id) => {
                        this.refreshCategories();
                    }, (error) => {
                        this.refreshCategories();
                    });
        });
    }

    onSelectedCategoryChanged($event) {
        let categoryData = $event.selectedRowsData[0];
        if (categoryData && !isNaN(categoryData.key))
            $event.selectedCashFlowTypeId = this.categorization.accountingTypes[
                this.categorization.categories[categoryData.key].accountingTypeId].typeId;

        this.onSelectionChanged.emit($event);
    }

    sortItem(val1, val2) {
        return val1.localeCompare(val2);
    }

    calculateSortValue(data) {
        let isNumber = (<any>this).dataType == 'number',
            fieldValue = isNumber ? Number(data.coAID) : data.name;
        if (data.parent == 'root' && data.typeId == 'I')
            fieldValue = ((<any>this).sortOrder == 'asc' ?
                (isNumber ? -9999999999 : 'aaa') :
                (isNumber ? 9999999999 : 'zzz')) + fieldValue;

        return fieldValue;
    }

    onKeyDown($event) {
        if ($event.event.keyCode == 13) {
            $event.event.preventDefault();
            $event.event.stopPropagation();
            let focusOverlay = $event.element.querySelector('.dx-treelist-focus-overlay');
            if (focusOverlay)
                focusOverlay.style.display = 'none';
            $event.component.focus($event.component.getCellElement(0, 0));
            $event.component.saveEditData();
            $event.handled = true;
        }
    }

    onRowClick($event) {
        if (this._selectedKeys.indexOf($event.key) >= 0)
            this.categoryList.instance.deselectRows([$event.key]);
        this.categoryList.instance.cancelEditData();
        this._selectedKeys = this.categoryList.instance.getSelectedRowKeys();
        if ($event.level >= 0) {
            let nowDate = new Date();
            if (nowDate.getTime() - this._prevClickDate.getTime() < 500) {
                $event.event.originalEvent.preventDefault();
                $event.event.originalEvent.stopPropagation();
                let focusOverlay = $event.element.querySelector('.dx-treelist-focus-overlay');
                if (focusOverlay)
                    focusOverlay.style.display = 'none';
                $event.component.editRow($event.rowIndex);
            }
            this._prevClickDate = nowDate;
        }
    }

    clearSelection(clearFilter) {
        this.categoryList.instance.deselectAll();
        this.filteredRowData = null;
        $('.filtered-category').removeClass('filtered-category');
        if (clearFilter)
            this.onFilterSelected.emit(null);
        return clearFilter;
    }

    onRowPrepared($event) {
        $($event.element).find('.dx-treelist-focus-overlay')[$event.isEditing ? 'show' : 'hide']();

        if ($event.rowType != 'data' || $event.key.rowIndex)
            return;

        let accounting = this.categorization.accountingTypes[
            $event.key >= 0 ? this.categorization.categories[$event.key]
                .accountingTypeId : parseInt($event.key)];
        if (accounting) {
            $event.rowElement.classList.add(accounting.typeId == 'I' ? 'inflows' : 'outflows');
            if (isNaN($event.key) && accounting.isSystem) {
                $event.rowElement.classList.add('system-type');
            }
        }

        if (isNaN($event.key))
            $event.rowElement.classList.add('accountingType');
        else if (isNaN($event.data.parent))
            $event.rowElement.classList.add('parentCategory');
        else
            $event.rowElement.classList.add('subCategory');

        if (!isNaN($event.key)) {
            $event.rowElement.setAttribute('draggable', true);
        }
    }

    toogleSearchInput(event) {
        if (event.target.tagName != 'INPUT')
            this.showSearch = false;
    }

    onNodesInitialized() {
        this.sortByColumnIndex(
            this.settings.sorting.field,
            this.settings.sorting.order
        );
    }

    addAccountingTypeRow(typeId) {
        if (!this.settings.showAT) { return; }

        this.currentTypeId = typeId;
        this.categoryList.instance.addRow();
    }

    insertAccountingType(typeId, name) {
        this._classificationServiceProxy.createAccountingType(
            InstanceType[this.instanceType], this.instanceId,
            CreateAccountingTypeInput.fromJS({
                cashflowTypeId: typeId,
                name: name
            })
        ).subscribe((id) => {
            this.refreshCategories();
        }, (error) => {
            this.refreshCategories();
        });
    }
}
