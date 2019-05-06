/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA } from '@angular/material';
import capitalize from 'underscore.string/capitalize';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import { Observable, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import {
    CashflowServiceProxy, ClassificationServiceProxy, EditRuleDto, GetTransactionCommonDetailsInput,
    CreateRuleDtoApplyOption, EditRuleDtoApplyOption, UpdateTransactionsCategoryInput,
    TransactionsServiceProxy, ConditionDtoCashFlowAmountFormat, ConditionAttributeDtoConditionTypeId,
    CreateRuleDto, ConditionAttributeDto, ConditionDto, TransactionTypesAndCategoriesDto, TransactionAttributeDto, GetKeyAttributeValuesInput } from '@shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'rule-dialog',
    templateUrl: 'rule-edit-dialog.component.html',
    styleUrls: ['rule-edit-dialog.component.less'],
    providers: [ CashflowServiceProxy, ClassificationServiceProxy, TransactionsServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RuleDialogComponent implements OnInit, AfterViewInit {
    @ViewChild(DxTreeViewComponent) transactionTypesList: DxTreeViewComponent;
    @ViewChild('attributesComponent') attributeList: DxDataGridComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    showSelectedTransactions = false;
    minAmount: number;
    maxAmount: number;
    bankId: number;
    accountId: number;
    amountFormat: ConditionDtoCashFlowAmountFormat = ConditionDtoCashFlowAmountFormat.Unspecified;
    banks: any;
    accounts: any;
    categories: any = [];
    descriptor = '';
    attributes: any = [];
    keywords: any = [];
    formats: any = [];
    attributeTypes: any;
    gridAttributeTypes: any;
    conditionTypes: any;
    categorization: any;
    attributesAndKeywords: any = [];
    keyAttributeValues: any = [];
    keyAttributeValuesDataSource: any = [];
    private transactionAttributeTypes: any;
    private attributeEditData: any;
    availableGridAttributeTypes: any = [];
    transactionTypesAndCategoriesData: TransactionTypesAndCategoriesDto;
    transactionTypes: any;
    transactionCategories: any;
    selectedTransactionCategory: string;
    selectedTransactionTypes: string[] = [];
    showOverwriteWarning = false;
    isCategoryValid = true;
    title: string;
    isTitleValid: boolean;
    buttons = [
        {
            title: this.ls.l(this.data.id ? 'Save' : 'Add rule'),
            class: 'primary',
            action: (event) => {
                if (this.validate()) {
                    event.target.disabled = true;
                    const request$ = this.data.id
                        ? this._classificationServiceProxy.editRule(
                            this._cfoService.instanceType as any, this._cfoService.instanceId,
                            EditRuleDto.fromJS(this.getDataObject()))
                        : this._classificationServiceProxy.createRule(
                            this._cfoService.instanceType as any,
                            this._cfoService.instanceId,
                            CreateRuleDto.fromJS(this.getDataObject()));
                    request$.pipe(finalize(() => {
                                this.modalDialog.finishLoading();
                                event.target.disabled = false;
                                this._changeDetectorRef.detectChanges();
                            }))
                            .subscribe(this.updateDataHandler.bind(this));
                }
            }
        }
    ];
    options = [
        {
            text: this.ls.l('Apply this rule to other occurrences'),
            value: true
        }
    ];
    constructor(
        private _classificationServiceProxy: ClassificationServiceProxy,
        private _cashflowServiceProxy: CashflowServiceProxy,
        private _cfoService: CFOService,
        private _transactionsServiceProxy: TransactionsServiceProxy,
        private _notifyService: NotifyService,
        private _elementRef: ElementRef,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.formats = _.values(ConditionDtoCashFlowAmountFormat).map((value) => {
            return {
                format: value
            };
        });
        this.conditionTypes = _.values(ConditionAttributeDtoConditionTypeId).map((value) => {
            return {
                condition: value
            };
        });
        let requests: Observable<any>[] = [
            this._transactionsServiceProxy.getTransactionAttributeTypes(this._cfoService.instanceType as any, this._cfoService.instanceId),
            this._classificationServiceProxy.getKeyAttributeValues(this._cfoService.instanceType as any, this._cfoService.instanceId, new GetKeyAttributeValuesInput({ ruleId: this.data.id, transactionIds: <number[] > this.data.transactionIds })),
            this._cashflowServiceProxy.getCashFlowInitialData(this._cfoService.instanceType as any, this._cfoService.instanceId)
        ];

        if (this.data.id)
            requests.push(this._classificationServiceProxy.getRuleForEdit(this._cfoService.instanceType as any, this._cfoService.instanceId, this.data.id));
        else if (this.data.transactionIds && this.data.transactionIds.length)
            requests.push(this._classificationServiceProxy.getTransactionCommonDetails(this._cfoService.instanceType as any, this._cfoService.instanceId, GetTransactionCommonDetailsInput.fromJS(this.data)));

        forkJoin(requests).subscribe(([transactionAttributeTypesResult, keyAttributeValuesResult, cashFlowInitialDataResult, data]) => {
            // getTransactionAttributeTypes
            let types = [];

            this.transactionAttributeTypes = transactionAttributeTypesResult.transactionAttributeTypes;
            _.mapObject(transactionAttributeTypesResult.transactionAttributeTypes, (val, key) => {
                types.push({
                    id: key,
                    name: val.name
                });
            });

            this.attributeTypes = types;
            this.gridAttributeTypes = types.slice();
            this.gridAttributeTypes.unshift({
                id: 'keyword',
                name: 'Keyword'
            });

            // getKeyAttributeValues
            keyAttributeValuesResult.forEach((attrValue) => {
                this.keyAttributeValues.push({
                    key: attrValue.attributeTypeId,
                    name: _.findWhere(this.attributeTypes, { id: attrValue.attributeTypeId }).name,
                    values: attrValue.attributeValues.map((val, i) => {
                        return {
                            key: i,
                            name: val
                        };
                    })
                });
            });

            // getCashFlowInitialData
            this.banks = cashFlowInitialDataResult.banks;

            //getRuleForEdit || getTransactionCommonDetails
            if (this.data.id) {
                let rule = data;
                if (this.descriptor = rule.transactionDescriptorAttributeTypeId && this.transactionAttributeTypes[rule.transactionDescriptorAttributeTypeId]
                    || rule.transactionDescriptor)
                    this.onDescriptorChanged({ value: this.descriptor });
                this.options[0].value = (rule.applyOption == EditRuleDtoApplyOption['MatchedAndUnclassified']);
                this.title = rule.name;
                if (rule.condition) {
                    this.bankId = rule.condition.bankId;
                    this.accountId = rule.condition.bankAccountId;
                    this.amountFormat = rule.condition.cashFlowAmountFormat;
                    this.minAmount = rule.condition.minAmount;
                    this.maxAmount = rule.condition.maxAmount;
                    this.keywords = this.getKeywordsFromString(rule.condition.descriptionWords);
                    this.attributes = rule.condition.attributes ? _.values(rule.condition.attributes) : [];
                    this.attributesAndKeywords = this.getAtributesAndKeywords();
                    this.selectedTransactionCategory = rule.condition.transactionCategoryId;
                    this.selectedTransactionTypes = rule.condition.transactionTypes;
                }
            } else if (this.data.transactionIds && this.data.transactionIds.length) {
                this.bankId = data.bankId;
                if (this.descriptor = this.getCapitalizedWords(data.standardDescriptor))
                    this.title = this.descriptor;
                this.keywords = this.getKeywordsFromString(data.descriptionPhrases.join(','));
                this.attributes = this.getAttributesFromCommonDetails(data.attributes);
                this.attributesAndKeywords = this.getAtributesAndKeywords(false);
                this.showOverwriteWarning = data.sourceTransactionsAreMatchingExistingRules;
            }
            this._changeDetectorRef.detectChanges();
        });
        if (this.data.transactions && this.data.transactions.length)
            this.buttons.unshift({
                title: this.ls.l('Don\'t add'),
                class: 'default',
                action: (event) => {
                    if (this.data.transactionIds) {
                        if (this.validate(true)) {
                            event.target.disabled = true;

                            let updateTransactionCategoryMethod = (suppressCashflowTypeMismatch: boolean = false) => {
                                this.modalDialog.startLoading();
                                this._classificationServiceProxy.updateTransactionsCategory(
                                    this._cfoService.instanceType as any,
                                    this._cfoService.instanceId,
                                    UpdateTransactionsCategoryInput.fromJS({
                                        transactionIds: this.data.transactionIds,
                                        categoryId: this.data.categoryId,
                                        standardDescriptor: this.transactionAttributeTypes[this.descriptor] ? undefined : this.descriptor,
                                        descriptorAttributeTypeId: this.transactionAttributeTypes[this.descriptor] ? this.descriptor : undefined,
                                        suppressCashflowMismatch: suppressCashflowTypeMismatch
                                    })
                                ).pipe(finalize(() => {
                                    this.modalDialog.finishLoading();
                                    event.target.disabled = false;
                                    this._changeDetectorRef.detectChanges();
                                }))
                                    .subscribe(this.updateDataHandler.bind(this));
                            };

                            if (this.data.categoryCashflowTypeId && _.some(this.data.transactions, x => x.CashFlowTypeId != this.data.categoryCashflowTypeId)) {
                                abp.message.confirm(this.ls.l('RuleDialog_ChangeCashTypeMessage'), this.ls.l('RuleDialog_ChangeCashTypeTitle'),
                                    (result) => {
                                        if (result) {
                                            updateTransactionCategoryMethod(true);
                                        }
                                    });
                            } else {
                                updateTransactionCategoryMethod(false);
                            }
                        }
                    } else
                        this.modalDialog.close(true);
                }
            });
        this._transactionsServiceProxy.getTransactionTypesAndCategories().subscribe((data) => {
            this.transactionTypesAndCategoriesData = data;
            this.transactionTypes = data.types;
            this.transactionCategories = data.categories;
            if (this.selectedTransactionCategory)
                this.onTransactionCategoryChanged(null);
            if (this.selectedTransactionTypes && this.selectedTransactionTypes.length)
                this.onTransactionTypesChanged(null);
            this._changeDetectorRef.detectChanges();
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            let input = this._elementRef.nativeElement
                .querySelector('.dx-texteditor-input');
            input.focus();
            input.select();
        }, 100);
    }

    getCapitalizedWords(value) {
        return value && value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    getKeywordsFromString(value: string) {
        return value &&
            value.split(',').map((keyword, index) => {
                return {
                    caption: 'Keyword #' + index,
                    keyword: keyword
                };
            }) || [];
    }

    getAttributesFromCommonDetails(attributes: TransactionAttributeDto[]) {
        if (!attributes || !attributes.length) return [];

        return attributes.map((v) => {
            return {
                attributeTypeId: v.typeId,
                conditionTypeId: v.value ? ConditionAttributeDtoConditionTypeId.Equal : ConditionAttributeDtoConditionTypeId.Exist,
                conditionValue: v.value
            };
        }).filter((attr) => attr.attributeTypeId == 'DS' || attr.attributeTypeId == 'PR');
    }

    getDataObject() {
        return {
            id: this.data.id,
            name: this.title,
            parentId: this.data.parentId,
            categoryId: this.data.categoryId,
            sourceTransactionList: this.data.transactionIds,
            transactionDescriptor: this.transactionAttributeTypes[this.descriptor] ? undefined : this.descriptor,
            transactionDescriptorAttributeTypeId: this.transactionAttributeTypes[this.descriptor] ? this.descriptor : undefined,
            applyOption: (this.data.id ? EditRuleDtoApplyOption : CreateRuleDtoApplyOption)[
                this.options[0].value ? 'MatchedAndUnclassified' : 'SelectedOnly'
            ],
            condition: ConditionDto.fromJS({
                minAmount: this.minAmount,
                maxAmount: this.maxAmount,
                cashFlowAmountFormat: this.amountFormat,
                bankId: this.bankId,
                bankAccountId: this.accountId,
                descriptionWords: this.getDescriptionKeywords(),
                attributes: this.getAttributes(),
                transactionCategoryId: this.selectedTransactionCategory,
                transactionTypes: this.selectedTransactionTypes
            })
        };
    }

    updateDataHandler(error) {
        if (error)
            this._notifyService.error(error);
        else {
            this._notifyService.info(this.ls.l('SavedSuccessfully'));
            this.data.refershParent && this.data.refershParent();
            this.modalDialog.close(true);
        }
    }

    getDescriptionKeywords() {
        return this.keywords.map((row) => {
            return row['keyword'];
        }).join(',') || '';
    }

    getAtributesAndKeywords(showKeywords: boolean = true) {
        let list = this.attributes;
        if (showKeywords || !list.length)
            list = list.concat(this.keywords.map((item) => {
                return {
                    attributeTypeId: 'keyword',
                    conditionTypeId: ConditionAttributeDtoConditionTypeId.Equal,
                    conditionValue: item.keyword
                };
            }));

        list.forEach((item, index) => {
            item.id = index;
        });
        return list;
    }

    getAttributes() {
        let attributes = {};
        let dataSource = <any>this.attributeList.dataSource;
        let list = dataSource.filter((item) => {
            return (item['attributeTypeId'] != 'keyword');
        }).forEach((v) => attributes[v['attributeTypeId']] = ConditionAttributeDto.fromJS(v));

        return attributes;
    }

    onBankChanged($event) {
        if (!this.banks) return;

        if ($event.value)
            this.accounts = (_.findWhere(this.banks,
                { id: $event.value })['bankAccounts'] || []).map((item) => {
                    return {
                        id: item.id,
                        name: item.accountNumber + ': ' + (item.accountName ? item.accountName : 'No name')
                    };
                });
        else {
            this.accountId = null;
            this.accounts = [];
        }
    }

    validate(ruleCheckOnly: boolean = false) {
        if (!ruleCheckOnly) {
            if (!this.title) {
                this.title = this.descriptor;
                if (!this.title) {
                    this.isTitleValid = false;
                    return this._notifyService.error(this.ls.l('RuleDialog_NameError'));
                }
            }

            if (!this.getDescriptionKeywords() && !Object.keys(this.getAttributes()).length) {
                this.attributeList.instance.option('elementAttr', {invalid: true});
                return this._notifyService.error(this.ls.l('RuleDialog_AttributeOrKeywordRequired'));
            }

            if (this.minAmount && this.maxAmount && this.minAmount > this.maxAmount)
                return this._notifyService.error(this.ls.l('RuleDialog_AmountError'));
        }

        if (isNaN(this.data.categoryId)) {
            this.isCategoryValid = false;
            return this._notifyService.error(this.ls.l('RuleDialog_CategoryError'));
        }

        return true;
    }

    onCategoryChanged($event) {
        this.data.categoryId = $event.selectedRowKeys.pop();
        this.data.categoryCashflowTypeId = $event.selectedCashFlowTypeId;
        this.isCategoryValid = true;
    }

    onTransactionCategoryChanged(e) {
        if (!this.transactionTypesAndCategoriesData) return;
        if (this.selectedTransactionCategory)
            setTimeout(() => {
                this.transactionTypes = this.transactionTypesAndCategoriesData.types.filter((t) => t.categories.some((c) => c == this.selectedTransactionCategory));
                this._changeDetectorRef.detectChanges();
            });
        else
            this.transactionTypes = this.transactionTypesAndCategoriesData.types;
        this._changeDetectorRef.detectChanges();
    }

    onTransactionTypesChanged(e) {
        if (!this.transactionTypesAndCategoriesData) return;
        if (this.selectedTransactionTypes && this.selectedTransactionTypes.length) {
            let categories: any = this.transactionTypesAndCategoriesData.types.filter((t) => this.selectedTransactionTypes.some((c) => c == t.id))
                .map((v) => v.categories);
            categories = _.uniq(_.flatten(categories));
            setTimeout(() => {
                this.transactionCategories = this.transactionTypesAndCategoriesData.categories.filter((c) => categories.some(x => x == c.id));
                this._changeDetectorRef.detectChanges();
            });
        } else {
            this.transactionCategories = this.transactionTypesAndCategoriesData.categories;
        }
        this._changeDetectorRef.detectChanges();
        this.syncTreeViewSelection(e);
    }

    onMultipleDropDownChange(event) {
        this.selectedTransactionTypes = event.component.getSelectedNodesKeys();
        this._changeDetectorRef.detectChanges();
    }

    syncTreeViewSelection(e) {
        let component = (e && e.component) || (this.transactionTypesList && this.transactionTypesList.instance);

        if (!component) return;

        component.unselectAll();

        if (this.selectedTransactionTypes) {
            this.selectedTransactionTypes.forEach((function (value) {
                component.selectItem(value);
            }).bind(this));
        }
    }

    addAttributeRow() {
        this.attributeList.instance.addRow();
    }

    onAttributeRowPrepared($event) {
        if ($event.cells[0].value == 'keyword')
            setTimeout(() => {
                $event.cells[1].cellElement.style.display = 'none';
                $event.cells[2].cellElement.setAttribute('colspan', '2');
            }, 0);

        if ($event.cells[1].value == 'Exist' && $event.cells[0].value != 'keyword')
            setTimeout(() => {
                $event.cells[2].value = '';
                $event.cells[2].cellElement.style.display = 'none';
                $event.cells[1].cellElement.setAttribute('colspan', '2');
            }, 0);
    }

    onRowValidating(e) {
        if (e.isValid) return ;

        if (e.newData.conditionTypeId == 'Exist' && e.newData.attributeTypeId != 'keyword') {
            e.brokenRules = _.reject(e.brokenRules, (rule) => rule.column.dataField == 'conditionValue');
        }

        e.isValid = !e.brokenRules.length;
    }

    updateKeywordList($event) {
        if ($event.key.attributeTypeId != 'keyword' && $event.key.conditionTypeId == 'Exist')
            $event.key.conditionValue = '';
        let dataSource = <any>this.attributeList.dataSource;
        this.keywords = dataSource.filter((item) => {
            return (item['attributeTypeId'] == 'keyword');
        }).map((item, i) => {
            return {
                caption: 'Keyword #' + i,
                keyword: item['conditionValue']
            };
        });
    }

    setCellValue(newData, value) {
        this['defaultSetCellValue'](newData, value);
    }

    onDescriptorChanged($event) {
        let attrType = this.transactionAttributeTypes[$event.value];
        $event.component && $event.component.option('inputAttr', {'attribute-selected': Boolean(attrType)});
        if (!this.title && $event.value)
            this.title = attrType && attrType.name || $event.value;
        this._changeDetectorRef.detectChanges();
    }

    onAttributeInitNewRow($event) {
        $event.data.attributeTypeId = 'keyword';
        $event.data.conditionTypeId = 'Equal';
        this.attributeList.instance
            .option('elementAttr', { invalid: false });
        $event.data.id = this.attributesAndKeywords.length;
        this.attributeEditData = $event.data;
        this.keyAttributeValuesDataSource = [];
        this._changeDetectorRef.detectChanges();
    }

    onEditingStart($event) {
        this.keyAttributeValuesDataSource = this.getKeyAttributeValues($event.data.attributeTypeId);
        this._changeDetectorRef.detectChanges();
    }

    attributeGridDropDownInitialized($event, cell) {
        let attrId = cell.value;
        if (attrId != 'keyword') {
            if (!_.findWhere(this.availableGridAttributeTypes, {id: attrId})) {
                let list = this.availableGridAttributeTypes.slice();
                list.unshift(
                    _.findWhere(this.gridAttributeTypes, {id: attrId})
                );
                this.availableGridAttributeTypes = list;
                this._changeDetectorRef.detectChanges();
            }
        }

    }

    attributeGridDropDownValueChanged($event, cell) {
        this.keyAttributeValuesDataSource =
            this.getKeyAttributeValues($event.value);
        cell.setValue($event.value);
        this._changeDetectorRef.detectChanges();
    }

    attributeGridDropDownDisposing($event, cell) {
        this.attributeEditData = null;
        this._changeDetectorRef.detectChanges();
    }

    onEditorPreparing($event) {
        this.attributeEditData = $event.row.data;
        this._changeDetectorRef.detectChanges();
    }

    onCustomDescriptorCreating($event) {
        setTimeout(() => {
            this.descriptor = $event.text;
            this._changeDetectorRef.detectChanges();
        });
    }

    onCustomAttributeCreating($event, cell) {
        setTimeout(() => {
            cell.setValue($event.text);
        });
    }

    attributeValueValueChanged($event, cell) {
        cell.setValue($event.value, $event.value);
    }

    onAttributeKeyEnter($event, cell) {
        if ($event.keyCode == 13) {
            this.attributeEditData = null;
            this._changeDetectorRef.detectChanges();
        }
    }

    selectedAttributeValue($event, value) {
        $event.stopPropagation();
        $event.preventDefault();
        if (this.transactionAttributeTypes[this.descriptor] || !this.descriptor)
            this.descriptor = '';
        this.descriptor += (this.descriptor ? ' - ' : '') + value.name;
        this._changeDetectorRef.detectChanges();
    }

    selectedGridAttributeValue($event, value) {
        this.attributeEditData.conditionTypeId = 'Equal';
        this.attributeEditData.conditionValue = value.name;
        setTimeout(() => {
            this.attributeList.instance.repaintRows([0]);
            this._changeDetectorRef.detectChanges();
        }, 100);
    }

    getKeyAttribute(typeId) {
        return _.findWhere(this.keyAttributeValues, {key: typeId});
    }

    getKeyAttributeValues(typeId) {
        let keyAttribute = this.getKeyAttribute(typeId);
        return keyAttribute ? keyAttribute.values : [];
    }

    isFirstAttributeElement(key: string): boolean {
        return this.keyAttributeValues[0] && this.keyAttributeValues[0].key == key;
    }

    onAttributesContentReady($event) {
        if (this.attributeEditData)
            return ;

        let list = _.filter(this.gridAttributeTypes, (item) => {
            return Object.keys(this.getAttributes()).indexOf(item.id) == -1;
        });
        if (this.availableGridAttributeTypes.length != list.length)
            this.availableGridAttributeTypes = list;
        this._changeDetectorRef.detectChanges();
    }

    attributeDisplayValue = ((data) => {
        let attribute = _.findWhere(this.gridAttributeTypes,
                {id: data.attributeTypeId});

        return attribute ? attribute.name : capitalize(data.attributeTypeId);
    }).bind(this);

    conditionDisplayValue = ((data) => {
        return {
            Equal: '='
            //Exist: '\u2203'
        }[data.conditionTypeId] ||
            data.conditionTypeId;
    }).bind(this);
}
