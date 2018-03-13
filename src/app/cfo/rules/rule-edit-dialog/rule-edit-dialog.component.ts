import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, OnInit, AfterViewInit, ViewChild } from '@angular/core';

import { CFOModalDialogComponent } from '@app/cfo/shared/common/dialogs/modal/cfo-modal-dialog.component';
import { DxTreeListComponent, DxDataGridComponent, DxTreeViewComponent, DxSelectBoxComponent } from 'devextreme-angular';

import {
    CashflowServiceProxy, ClassificationServiceProxy, EditRuleDto, GetTransactionCommonDetailsInput,
    CreateCategoryInput, UpdateCategoryInput,
    CreateRuleDtoApplyOption, EditRuleDtoApplyOption, UpdateTransactionsCategoryInput,
    TransactionsServiceProxy, ConditionDtoCashFlowAmountFormat, ConditionAttributeDtoConditionTypeId,
    CreateRuleDto, ConditionAttributeDto, ConditionDto, InstanceType, TransactionTypesAndCategoriesDto, TransactionAttributeDto } from '@shared/service-proxies/service-proxies';

import { Observable } from 'rxjs/Observable';

import * as _ from 'underscore';

@Component({
  selector: 'rule-dialog',
  templateUrl: 'rule-edit-dialog.component.html',
  styleUrls: ['rule-edit-dialog.component.less'],
  providers: [CashflowServiceProxy, ClassificationServiceProxy, TransactionsServiceProxy]
})
export class RuleDialogComponent extends CFOModalDialogComponent implements OnInit, AfterViewInit {
    @ViewChild(DxTreeViewComponent) transactionTypesList: DxTreeViewComponent;
    @ViewChild('attributesComponent') attributeList: DxDataGridComponent;
    showSelectedTransactions = false;
    minAmount: number;
    maxAmount: number;
    bankId: number;
    accountId: number;
    amountFormat: ConditionDtoCashFlowAmountFormat
        = ConditionDtoCashFlowAmountFormat.Unspecified;
    banks: any;
    accounts: any;
    categories: any = [];
    descriptor: string = '';
    attributes: any = [];
    keywords: any = [];
    formats: any = [];
    attributeTypes: any;
    gridAttributeTypes: any;
    conditionTypes: any;
    categorization: any;
    attributesAndKeywords: any = [];
    keyAttributeValues: any = [];
    private transactionAttributeTypes: any;

    transactionTypesAndCategoriesData: TransactionTypesAndCategoriesDto;
    transactionTypes: any;
    transactionCategories: any;
    selectedTransactionCategory: string;
    selectedTransactionTypes: string[] = [];
    showOverwriteWarning = false;
    isCategoryValid = true;

    constructor(
        injector: Injector,
        private _classificationServiceProxy: ClassificationServiceProxy,
        private _cashflowServiceProxy: CashflowServiceProxy,
        private _transactionsServiceProxy: TransactionsServiceProxy
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
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
            _transactionsServiceProxy.getTransactionAttributeTypes(InstanceType[this.instanceType], this.instanceId),
            _classificationServiceProxy.getKeyAttributeValues(InstanceType[this.instanceType], this.instanceId, this.data.transactionIds),
            _cashflowServiceProxy.getCashFlowInitialData(InstanceType[this.instanceType], this.instanceId)
        ];

        if (this.data.id)
            requests.push(_classificationServiceProxy.getRuleForEdit(InstanceType[this.instanceType], this.instanceId, this.data.id));
        else if (this.data.transactionIds && this.data.transactionIds.length)
            requests.push(_classificationServiceProxy.getTransactionCommonDetails(InstanceType[this.instanceType], this.instanceId, GetTransactionCommonDetailsInput.fromJS(this.data)));

        Observable.forkJoin(requests).subscribe(([transactionAttributeTypesResult, keyAttributeValuesResult, cashFlowInitialDataResult, data]) => {
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
                this.data.options[0].value = (rule.applyOption == EditRuleDtoApplyOption['MatchedAndUnclassified']);
                this.data.title = rule.name;
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
            }
            else if (this.data.transactionIds && this.data.transactionIds.length) {
                this.bankId = data.bankId;
                if (this.descriptor = this.getCapitalizedWords(data.standardDescriptor))
                    this.data.title = this.descriptor;
                this.keywords = this.getKeywordsFromString(data.descriptionPhrases.join(','));
                this.attributes = this.getAttributesFromCommonDetails(data.attributes);
                this.attributesAndKeywords = this.getAtributesAndKeywords(false);
                this.showOverwriteWarning = data.sourceTransactionsAreMatchingExistingRules;
            }
        });
    }

    getCapitalizedWords(value) {
        return value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
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
            name: this.data.title,
            parentId: this.data.parentId,
            categoryId: this.data.categoryId,
            sourceTransactionList: this.data.transactionIds,
            transactionDescriptor: this.transactionAttributeTypes[this.descriptor] ? undefined : this.descriptor,
            transactionDescriptorAttributeTypeId: this.transactionAttributeTypes[this.descriptor] ? this.descriptor : undefined,
            applyOption: (this.data.id ? EditRuleDtoApplyOption : CreateRuleDtoApplyOption)[
                this.data.options[0].value ? 'MatchedAndUnclassified' : 'SelectedOnly'
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
            this.notify.error(error);
        else {
            this.notify.info(this.l('SavedSuccessfully'));
            this.data.refershParent && this.data.refershParent();
            this.close(true);
        }
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.editTitle = true;
        this.data.placeholder = this.l('Enter the rule name');
        this.data.buttons = [{
            title: this.l(this.data.id ? 'Save' : 'Add rule'),
            class: 'primary',
            action: () => {
                if (this.validate()) {
                    if (this.data.id)
                        this._classificationServiceProxy.editRule(
                            InstanceType[this.instanceType], this.instanceId,
                            EditRuleDto.fromJS(this.getDataObject()))
                        .subscribe(this.updateDataHandler.bind(this));
                    else
                        this._classificationServiceProxy.createRule(
                            InstanceType[this.instanceType],
                            this.instanceId,
                            CreateRuleDto.fromJS(this.getDataObject()))
                        .subscribe(this.updateDataHandler.bind(this));
                }
            }
        }];
        if (this.data.transactions && this.data.transactions.length)
            this.data.buttons.unshift({
                title: this.l('Don\'t add'),
                class: 'default',
                action: () => {
                    if (this.data.transactionIds) {
                        if (this.validate(true)) {
                            let updateTransactionCategoryMethod = (suppressCashflowTypeMismatch: boolean = false) => {
                                this._classificationServiceProxy.updateTransactionsCategory(
                                    InstanceType[this.instanceType],
                                    this.instanceId,
                                    UpdateTransactionsCategoryInput.fromJS({
                                        transactionIds: this.data.transactionIds,
                                        categoryId: this.data.categoryId,
                                        standardDescriptor: this.transactionAttributeTypes[this.descriptor] ? undefined : this.descriptor,
                                        descriptorAttributeTypeId: this.transactionAttributeTypes[this.descriptor] ? this.descriptor : undefined,
                                        suppressCashflowMismatch: suppressCashflowTypeMismatch
                                    })
                                ).subscribe(this.updateDataHandler.bind(this));
                            };

                            if (this.data.categoryCashflowTypeId && _.some(this.data.transactions, x => x.CashFlowTypeId != this.data.categoryCashflowTypeId)) {
                                abp.message.confirm(this.l('RuleDialog_ChangeCashTypeMessage'), this.l('RuleDialog_ChangeCashTypeTitle'),
                                    (result) => {
                                        if (result) {
                                            updateTransactionCategoryMethod(true);
                                        }
                                    });
                            }
                            else {
                                updateTransactionCategoryMethod(false);
                            }
                        }
                    }
                    else
                        this.close(true);
                }
            });

        this.data.options = [{
            text: this.l('Apply this rule to other occurences'),
            value: true
        }];

        this._transactionsServiceProxy.getTransactionTypesAndCategories().subscribe((data) => {
            this.transactionTypesAndCategoriesData = data;
            this.transactionTypes = data.types;
            this.transactionCategories = data.categories;
            if (this.selectedTransactionCategory)
                this.onTransactionCategoryChanged(null);
            if (this.selectedTransactionTypes && this.selectedTransactionTypes.length)
                this.onTransactionTypesChanged(null);
        });
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
            item.conditionValue = 
                this.getCapitalizedWords(item.conditionValue);
        });
        return list;
    }

    getAttributes() {
        let attributes = {};
        let list = this.attributeList.dataSource.filter((item) => {
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
            if (!this.data.title) {
                this.data.title = this.descriptor;
                if (!this.data.title) {
                    this.data.isTitleValid = false;
                    return this.notify.error(this.l('RuleDialog_NameError'));
                }
            }

            if (!this.getDescriptionKeywords() && !Object.keys(this.getAttributes()).length) {
                this.attributeList.instance.option('elementAttr', {invalid: true});
                return this.notify.error(this.l('RuleDialog_AttributeOrKeywordRequired'));
            }

            if (this.minAmount && this.maxAmount && this.minAmount > this.maxAmount)
                return this.notify.error(this.l('RuleDialog_AmountError'));
        }

        if (isNaN(this.data.categoryId)) {
            this.isCategoryValid = false;
            return this.notify.error(this.l('RuleDialog_CategoryError'));
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
            setTimeout(() => this.transactionTypes = this.transactionTypesAndCategoriesData.types.filter((t) => t.categories.some((c) => c == this.selectedTransactionCategory)), 0);
        else
            this.transactionTypes = this.transactionTypesAndCategoriesData.types;
    }

    onTransactionTypesChanged(e) {
        if (!this.transactionTypesAndCategoriesData) return;
        if (this.selectedTransactionTypes && this.selectedTransactionTypes.length) {
            let categories: any = this.transactionTypesAndCategoriesData.types.filter((t) => this.selectedTransactionTypes.some((c) => c == t.id))
                .map((v) => v.categories);
            categories = _.uniq(_.flatten(categories));
            setTimeout(() => this.transactionCategories = this.transactionTypesAndCategoriesData.categories.filter((c) => categories.some(x => x == c.id)), 0);
        } else {
            this.transactionCategories = this.transactionTypesAndCategoriesData.categories;
        }

        this.syncTreeViewSelection(e);
    }

    onMultipleDropDownChange(event) {
        this.selectedTransactionTypes = event.component.getSelectedNodesKeys();
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
                $event.cells[1].cellElement.hide();
                $event.cells[2].cellElement.attr('colspan', '2');
            }, 0);

        if ($event.cells[1].value == 'Exist' && $event.cells[0].value != 'keyword')
            setTimeout(() => {
                $event.cells[2].value = '';
                $event.cells[2].cellElement.hide();
                $event.cells[1].cellElement.attr('colspan', '2');
            }, 0);
    }

    onRowValidating(e) {
        if (e.isValid) return;

        if (e.newData.conditionTypeId == 'Exist' && e.newData.attributeTypeId != 'keyword') {
            e.brokenRules = _.reject(e.brokenRules, (rule) => rule.column.dataField == 'conditionValue');
        }

        e.isValid = !e.brokenRules.length;
    }

    updateKeywordList($event) {
        if ($event.key.attributeTypeId != 'keyword' && $event.key.conditionTypeId == 'Exist')
            $event.key.conditionValue = '';

        this.keywords = this.attributeList.dataSource.filter((item) => {
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

        if (!this.data.title && $event.value)
            this.data.title = attrType && attrType.name || $event.value;
    }

    onAttributeInitNewRow($event) {
        $event.data.attributeTypeId = 'keyword';
        $event.data.conditionTypeId = 'Equal';
        this.attributeList.instance
            .option('elementAttr', { invalid: false });
        $event.data.id = this.attributesAndKeywords.length;
    }

    customizeAttributeValue($event) {
        return $event.value;
    }

    onEditorPreparing($event) {
        if ($event.dataField == 'conditionValue')
            $event.editorOptions.placeholder = 'Enter Value';
    }

    onCustomDescriptorCreating($event) {
        setTimeout(() => {
            this.descriptor = $event.text;
        }, 0);
    }

    onCustomAttributeCreating($event, cell) {
        cell.value = $event.value;
        cell.setValue($event.value);
    }

    onAttributeKeyEnter($event, cell) {
        this.onCustomAttributeCreating(
            {value: $event.jQueryEvent.target.value}, cell);
    }

    selectedAttributeValue($event, value) {
        $event.stopPropagation();
        $event.preventDefault();
        if (this.transactionAttributeTypes[this.descriptor])    
            this.descriptor = '';  
        this.descriptor += (this.descriptor ? ' - ': '') + value.name;
    }

    getKeyAttribute(typeId) {
        return _.findWhere(this.keyAttributeValues, {key: typeId});
    }

    getKeyAttributeValues(typeId) {
        let keyAttribute = this.getKeyAttribute(typeId);
        return keyAttribute ? keyAttribute.values: [];
    }
}
