/** Core imports */
import { Component, Input, Output, EventEmitter, Injector, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxTreeListComponent } from 'devextreme-angular/ui/tree-list';
import DataSource from 'devextreme/data/data_source';
import * as _ from 'underscore';
import { CacheService } from 'ng2-cache-service';
import { filter, finalize, switchMap } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import {
    CategoryTreeServiceProxy,
    InstanceType,
    UpdateCategoryInput,
    CreateCategoryInput,
    GetCategoryTreeOutput,
    UpdateAccountingTypeInput,
    CreateAccountingTypeInput,
    CategoryDto,
    AccountingTypeDto
} from '@shared/service-proxies/service-proxies';
import { CategoryDeleteDialogComponent } from './category-delete-dialog/category-delete-dialog.component';
import { Category } from '@app/cfo/transactions/categorization/category.model';

@Component({
    selector: 'categorization',
    templateUrl: 'categorization.component.html',
    styleUrls: ['categorization.component.less'],
    providers: [CategoryTreeServiceProxy],
    host: {
        '(window:click)': 'toogleSearchInput($event)'
    }
})
export class CategorizationComponent extends CFOComponentBase implements OnInit, AfterViewInit {
    @ViewChild(DxTreeListComponent) categoryList: DxTreeListComponent;
    @Output() close: EventEmitter<any> = new EventEmitter();
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();
    @Output() onFilterSelected: EventEmitter<Category[]> = new EventEmitter();
    @Output() onTransactionDrop: EventEmitter<any> = new EventEmitter();
    @Output() onCategoriesChanged: EventEmitter<any> = new EventEmitter();

    @Input() width: string;
    @Input() height: string;
    @Input() showTitle: boolean;
    @Input() showHeader: boolean;
    @Input() showClearSelection: boolean;
    @Input() showFilterIcon: boolean;
    @Input() showAddEntity: boolean;
    @Input() includeNonCashflowNodes = true;
    @Input() categoryId: number;
    @Input() filteredRowsData: Category[] = [];
    @Input('dragMode')
    set dragMode(value: boolean) {
        if (this.categoryList.instance)
            this.categoryList.instance.option('elementAttr', {
                dropAllowed: value
            });
        if (value)
            this.categoryList.instance.cancelEditData();
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

    categories: Category[] = [];
    types = [
        { id: 'E', name: 'Outflows' },
        { id: 'I', name: 'Inflows' }
    ];
    categorization: GetCategoryTreeOutput;
    columnClassName = '';
    showSearch = false;
    noDataText: string;

    transactionsCountDataSource: DataSource;

    private _prevClickDate = new Date();
    private _selectedKeys = [];
    private readonly MIN_PADDING = 7;
    private readonly MAX_PADDING = 17;
    settings = {
        showCID: true, /* Category ID */
        showTC: false, /* Transaction Count */
        showAT: true, /* Accounting types */
        showEmpty: true, /* hide empty categories */
        padding: this.MIN_PADDING,
        sorting: {
            field: 0,
            order: 'asc'
        }
    };
    private currentTypeId: any;
    private readonly _expandedCacheKey = [
        'Categorization_Tree_Expanded',
        abp.session.tenantId,
        abp.session.userId,
        this._cfoService.instanceId ||
        this._cfoService.instanceType
    ].join('_');

    toolbarConfig: any;
    excelData = [];

    constructor(
        injector: Injector,
        private filtersService: FiltersService,
        private cacheService: CacheService,
        private categoryTreeServiceProxy: CategoryTreeServiceProxy,
        private changeDetectionRef: ChangeDetectorRef,
        public dialog: MatDialog
    ) {
        super(injector);
    }

    ngOnInit() {
        this.initSettings();
        this.refreshCategories(true);
        this.showAddEntity = this.showAddEntity && this.isInstanceAdmin;
        this.initToolbarConfig();
        this.transactionsCountDataSource = new DataSource({
            store: {
                type: 'odata',
                url: this.getODataUrl('TransactionCount'),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            },
            onChanged: this.setTransactionsCount.bind(this)
        });
    }

    ngAfterViewInit(): void {
        if (this.isInstanceAdmin) {
            this.categoryList.editing.allowAdding = true;
            this.categoryList.editing.allowUpdating = true;
            this.categoryList.instance.refresh();
        }
    }

    initToolbarConfig() {

        let addEntityItems = [];
        this.types.forEach(x => {
            let item = {
                name: 'type' + x.id,
                text: this.l(x.name),
                action: () => {
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
                            this.changeDetectionRef.detectChanges();
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
            },
            {
                location: 'after', items: [
                    {
                        name: 'addEntity',
                        widget: 'dxDropDownMenu',
                        visible: this.showAddEntity && this.settings.showAT,
                        options: {
//                            text: this.l('AddAccountingType'),
                            hint: this.l('AddAccountingType'),
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
                                    type: 'option',
                                    name: 'showEmpty',
                                    checked: this.settings.showEmpty,
                                    text: this.l('Empty categories'),
                                    action: (event) => {
                                        if (event.event.target.tagName == 'INPUT') {
                                            this.settings.showEmpty = !this.settings.showEmpty;
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
                                            this.changeDetectionRef.detectChanges();
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
        this.changeDetectionRef.detectChanges();
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
        this.categoryList.instance.beginUpdate();
        if (!expandFirstLevel && !expandSecondLevel) {
            this.categoryList.expandedRowKeys = [];
            this.cacheService.set(this._expandedCacheKey, this.categoryList.expandedRowKeys);
        } else {
            if (this.settings.showAT) {
                _.mapObject(this.categorization.accountingTypes, (item, key) => {
                    this.categoryList.instance[(expandFirstLevel ? 'expand' : 'collapse') + 'Row'](key + item.typeId);
                });
            }

            let expandCategories = (expandFirstLevel && !this.settings.showAT) || expandSecondLevel;
            _.mapObject(this.categorization.categories, (item, key) => {
                if (!item.parentId) {
                    let method = this.categoryList.instance[
                        (expandCategories ? 'expand' : 'collapse') + 'Row'];
                    method(parseInt(key));
                }
            });
        }
        this.categoryList.instance.endUpdate();
    }

    onRowExpandChange() {
        this.cacheService.set(this._expandedCacheKey, this.categoryList.expandedRowKeys);
    }

    onContentReady($event) {
        this.initDragAndDropEvents($event);
        if (this.filteredRowsData && this.filteredRowsData.length) {
            const filteredRowsKeys = this.filteredRowsData.map((row: Category) => row.key);
            filteredRowsKeys.forEach(filteredRowKey => {
                let rowIndex = this.categoryList.instance.getRowIndexByKey(filteredRowKey);
                if (rowIndex !== -1) {
                    let row = this.categoryList.instance.getRowElement(rowIndex) || [];
                    if (row[0]) row[0].classList.add('filtered-category');
                }
            });
        }
    }

    initDragAndDropEvents($event) {
        if (!this.isInstanceAdmin && !this._cfoService.classifyTransactionsAllowed(false))
            return true;

        let img = new Image();
        img.src = './assets/common/icons/drag-icon.svg';

        let sourceCategory = null;

        let clearDragAndDrop = () => {
            sourceCategory = null;
            $('.drag-hover').removeClass('drag-hover');
            $('dx-tree-list .dx-data-row').removeClass('droppable');
        };

        let element = <any>$($event.element);
        this.isInstanceAdmin && element.find('.dx-data-row')
            .off('dragstart').off('dragend')
            .on('dragstart', (e) => {
                if (this.categoryList.instance.element().querySelector('.dx-edit-row')) {
                    e.originalEvent.preventDefault();
                    return;
                }

                sourceCategory = {};
                sourceCategory.element = e.currentTarget;
                sourceCategory.key = this.categoryList.instance.getKeyByRowIndex(e.currentTarget.rowIndex);
                let categoryName = this.categorization.categories[sourceCategory.key].name;
                e.originalEvent.dataTransfer.setData('Text', categoryName);
                e.originalEvent.dataTransfer.setDragImage(img, -10, -10);
                e.originalEvent.dropEffect = 'move';

                sourceCategory.cashType = this.getCashflowTypeFromClassList(sourceCategory.element.classList);
                let droppableQuery: string;
                if (sourceCategory.cashType == 'unknown')
                    droppableQuery = 'dx-tree-list .dx-data-row';
                else
                    droppableQuery = 'dx-tree-list .dx-data-row.unknown, dx-tree-list .dx-data-row.' + sourceCategory.cashType;

                $(droppableQuery).addClass('droppable');
            })
            .on('dragend', () => {
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
            })
            .on('dragover', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                let targetTableRow = e.currentTarget.closest('tr');
                if (!this.checkCanDrop(targetTableRow, sourceCategory))
                    e.originalEvent.dataTransfer.dropEffect = 'none';
            })
            .on('dragleave', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                e.target.classList.remove('element-drag-hover');
                if (e.relatedTarget && (e.target.parentElement === e.relatedTarget || e.target.firstElementChild === e.relatedTarget))
                    return;

                e.currentTarget.closest('tr').classList.remove('drag-hover');
            })
            .on('drop', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                if (sourceCategory) {
                    let source = sourceCategory.key;
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
        if (sourceCategory && this.isInstanceAdmin) {
            let targetCashType = this.getCashflowTypeFromClassList(targetElement.classList);
            if (sourceCategory.element == targetElement ||
                (targetCashType != 'unknown' && sourceCategory.cashType != 'unknown' && sourceCategory.cashType != targetCashType))
                return false;
        } else {
            if (targetElement.classList.contains('accountingType'))
                return false;
        }

        return true;
    }

    getCashflowTypeFromClassList(classList): string {
        return classList.contains('inflows') ? 'inflows' :
            classList.contains('outflows') ? 'outflows' :
                'unknown';
    }

    handleCategoryDrop(sourceId, targetId) {
        let sourceCategory = this.categorization.categories[sourceId];
        let targetCategory = this.categorization.categories[targetId];

        let targetAccountingTypeId = parseInt(targetId);
        let targetAccountingType = this.categorization.accountingTypes[targetAccountingTypeId];
        let isMerge = false;

        let moveToId: number;
        let targetName: string;
        let hasSourceSubcategories = _.values(this.categorization.categories).some((item) => {
            return item.parentId == sourceId;
        });

        if (targetCategory) {
            if (sourceCategory.parentId && targetCategory.parentId || //subcategory -> subcategory
                sourceCategory.parentId && sourceCategory.parentId == targetId || //subcategory -> own parent
                !sourceCategory.parentId && !targetCategory.parentId && hasSourceSubcategories || // not empty category -> category
                !sourceCategory.parentId && targetCategory.parentId //category -> subcategory
            ) {
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
                    this.categoryTreeServiceProxy.deleteCategory(
                        InstanceType[this._cfoService.instanceType],
                        this._cfoService.instanceId,
                        moveToId, false, sourceId
                    ).subscribe(
                        () => {
                            this.refreshCategories();
                            this.onCategoriesChanged.emit();
                        },
                        () => this.refreshCategories()
                    );
                }
            });
        } else {
            abp.message.confirm(this.l('CategoryMoveConfirmation', sourceCategory.name, targetName), this.l('CategoryMoveConfirmationTitle'), (result) => {
                if (result) {
                    this.categoryTreeServiceProxy.updateCategory(
                        InstanceType[this._cfoService.instanceType],
                        this._cfoService.instanceId,
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

    refreshCategories(expandInitial: boolean = false, refreshTransactionsCount = true) {
        this.startLoading();
        this.categoryTreeServiceProxy.get(
            InstanceType[this._cfoService.instanceType],
            this._cfoService.instanceId,
            this.includeNonCashflowNodes
        ).subscribe((data: GetCategoryTreeOutput) => {
            let categories: Category[] = [];
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
                _.mapObject(data.categories, (item: CategoryDto, key) => {
                    let accounting: AccountingTypeDto = data.accountingTypes[item.accountingTypeId];
                    if (accounting && (!item.parentId || data.categories[item.parentId])) {
                        categories.push({
                            key: parseInt(key),
                            parent: item.parentId || (this.settings.showAT ?
                                item.accountingTypeId.toString() + accounting.typeId : 'root'),
                            coAID: item.coAID,
                            name: item.name,
                            typeId: accounting.typeId
                        });
                    }
                });

            this.categories = categories;

            if (expandInitial) {
                let expanded = this.cacheService.get(this._expandedCacheKey);
                if (expanded)
                    this.categoryList.expandedRowKeys = expanded;
                else
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

            if (refreshTransactionsCount) {
                this.refreshTransactionsCountDataSource();
            }
            setTimeout(() => this.finishLoading());
            if (!this.categories.length) this.noDataText = this.ls('Platform', 'NoData');

            this.setTransactionsCount();
            this.changeDetectionRef.detectChanges();
        });
    }

    setTransactionsCount() {
        let items = this.transactionsCountDataSource.items();
        if (!items.length)
            return ;

        let accountingTypes: any[] = [];
        let parentCategories: any[] = [];

        this.categories.forEach((item: Category) => {
            item.transactionsCount = items[0][item.key];

            if (isNaN(item.key))
                accountingTypes[item.key] = item;
            else if (+item.parent != item.parent)
                parentCategories[item.key] = item;
        });

        this.categories.forEach((category: Category) => {
            if (+category.parent == category.parent && category.transactionsCount) {
                let parentCategory = parentCategories[category.parent];
                if (parentCategory && category.transactionsCount)
                    parentCategory.transactionsCount = parentCategory.transactionsCount ? parentCategory.transactionsCount + category.transactionsCount : category.transactionsCount;
            }
        });

        if (this.settings.showAT)
            parentCategories.forEach(x => {
                let accountingType = accountingTypes[x.parent];
                if (x.transactionsCount)
                    accountingType.transactionsCount = accountingType.transactionsCount ? accountingType.transactionsCount + x.transactionsCount : x.transactionsCount;
            });

        if (!this.settings.showEmpty)
            this.categories = this.categories.filter(item => Boolean(item.transactionsCount));

        this.setExcelData(items[0]);
    }

    setExcelData(items) {
        let data = this.categorization;
        if (data.categories) {
            let transactionCount = items || [];
            this.excelData = this.getChildCategories(data, transactionCount, null);
        }
    }

    getChildCategories(data: GetCategoryTreeOutput, transactionCount, parentId) {
        let categories = [];
        _.mapObject(data.categories, (item, key) => {
            if (item.parentId === parentId) {
                let accType = data.accountingTypes[item.accountingTypeId];
                let parentCategory = data.categories[item.parentId];
                let cashflowType = data.types[accType.typeId];
                let hasParent = !!parentCategory;
                categories.push({
                    CashflowType: cashflowType ? cashflowType.name : null,
                    AccountingType: accType.name,
                    Category: item.name,
                    CategoryId: key,
                    ParentCategory: hasParent ? parentCategory.name : '',
                    ParentCategoryId: item.parentId || null,
                    TransactionCount: transactionCount[parseInt(key)] || null,
                    COAID: item.coAID
                });
                let childCategories = this.getChildCategories(data, transactionCount, parseInt(key));
                if (childCategories.length)
                    categories = categories.concat(childCategories);
            }
        });
        return categories;
    }

    refreshTransactionsCountDataSource() {
        if (this.transactionsCountDataSource) {
            this.transactionsCountDataSource.store()['_url'] = this.getODataUrl('TransactionCount', this._transactionsFilterQuery);
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
                this.addActionButton('delete', $event.cellElement, () => {
                    this.categoryList.instance.deleteRow(
                        this.categoryList.instance.getRowIndexByKey($event.data.key));
                });
            if (this.showFilterIcon)
                this.addActionButton('filter', $event.cellElement, () => {
                    const category: Category = $event.data;
                    let wrapper = $event.cellElement.parentElement;
                    if (!this.clearSelection(wrapper, category.key)) {
                        wrapper.classList.add('filtered-category');
                        /** We can select only one category for now */
                        this.filteredRowsData = [category];
                        this.onFilterSelected.emit(this.filteredRowsData);
                    }
                });
        }
    }

    updateAccountingType($event) {
        let id = parseInt($event.key),
            accounting = this.categorization.accountingTypes[id];
        this.categoryTreeServiceProxy.updateAccountingType(
            InstanceType[this._cfoService.instanceType], this._cfoService.instanceId,
            UpdateAccountingTypeInput.fromJS({
                id: id,
                name: $event.data.hasOwnProperty('name') ? $event.data.name || undefined : accounting.name,
                cashflowTypeId: accounting.typeId
            })
        ).pipe(
            finalize(() => this.refreshCategories())
        ).subscribe();
    }

    onCategoryUpdated($event) {
        if (isNaN($event.key)) {
            this.updateAccountingType($event);
        } else {
            let category = this.categorization.categories[$event.key];
            $event.element.querySelector('.dx-treelist-focus-overlay').style.display = '';
            this.categoryTreeServiceProxy.updateCategory(
                InstanceType[this._cfoService.instanceType], this._cfoService.instanceId,
                UpdateCategoryInput.fromJS({
                    id: $event.key ,
                    coAID: $event.data.hasOwnProperty('coAID') ? $event.data.coAID || undefined : category.coAID,
                    name: $event.data.hasOwnProperty('name') ? $event.data.name || undefined : category.name,
                    accountingTypeId: category.accountingTypeId,
                    parentId: category.parentId
                })
            ).pipe(
                finalize(() => this.refreshCategories())
            ).subscribe();
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

        this.categoryTreeServiceProxy.createCategory(
            InstanceType[this._cfoService.instanceType], this._cfoService.instanceId,
            CreateCategoryInput.fromJS({
                accountingTypeId: hasParentCategory ? this.categorization
                    .categories[parentId].accountingTypeId : parseInt(parentId),
                parentId: hasParentCategory ? parentId : null,
                coAID: $event.data.coAID,
                name: $event.data.name
            })
        ).pipe(
            finalize(() => this.refreshCategories())
        ).subscribe();
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
        }).afterClosed().pipe(
            filter(Boolean),
            switchMap(() => {
                return this.categoryTreeServiceProxy[isAccountingType ? 'deleteAccountingType' : 'deleteCategory'].call(
                    this.categoryTreeServiceProxy,
                    InstanceType[this._cfoService.instanceType],
                    this._cfoService.instanceId,
                    dialogData.categoryId, dialogData.deleteAllReferences, parseInt(itemId)
                );
            }),
            finalize(() => this.refreshCategories())
        ).subscribe();
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

        if (data.parent == 'root') {
            if (data.typeId == 'I')
                fieldValue = ((<any>this).sortOrder == 'asc' ?
                    (isNumber ? -9999999999 : 'aaa') :
                    (isNumber ? 9999999999 : 'zzz')) + fieldValue;
            else if (data.typeId == 'E')
                fieldValue = ((<any>this).sortOrder == 'asc' ?
                    (isNumber ? -9999999998 : 'aab') :
                    (isNumber ? 9999999998 : 'zzy')) + fieldValue;
        }

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
        if (this.isInstanceAdmin && $event.level >= 0) {
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

    clearSelection(wrapper?: HTMLElement, clearedItemKey?: number): boolean {
        let clearFilter = true;
        this.categoryList.instance.deselectAll();
        if (this.filteredRowsData && this.filteredRowsData.length) {
            let filterItemIndex;
            if (clearedItemKey) {
                filterItemIndex = this.filteredRowsData.findIndex((category: Category) => category.key === clearedItemKey);
            }
            if (filterItemIndex && filterItemIndex !== -1) {
                this.filteredRowsData.splice(filterItemIndex, 1);
            } else {
                this.filteredRowsData = [];
            }
        }
        if (wrapper) {
            clearFilter = wrapper.classList.contains('filtered-category');
            if (clearFilter) {
                wrapper.classList.remove('filtered-category');
            }
        } else {
            $('.filtered-category').removeClass('filtered-category');
        }
        if (clearFilter) {
            this.onFilterSelected.emit(this.filteredRowsData);
        }
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
            let cashflowType = accounting.typeId == 'I' ? 'inflows' :
                accounting.typeId == 'E' ? 'outflows' :
                    'unknown';
            $event.rowElement.classList.add(cashflowType);
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
        this.categoryTreeServiceProxy.createAccountingType(
            InstanceType[this._cfoService.instanceType], this._cfoService.instanceId,
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
