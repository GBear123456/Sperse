import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, OnInit, AfterViewInit, ViewChild } from '@angular/core';

import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { DxTreeListComponent, DxDataGridComponent } from 'devextreme-angular';

import {
    CashflowServiceProxy, ClassificationServiceProxy, EditRuleDto, 
    CreateRuleDtoApplyOption, EditRuleDtoApplyOption, UpdateTransactionsCategoryInput,
    TransactionsServiceProxy, ConditionDtoCashFlowAmountFormat, ConditionAttributeDtoConditionTypeId,
    CreateRuleDto, ConditionAttributeDto, ConditionDto } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
  selector: 'rule-dialog',
  templateUrl: 'rule-edit-dialog.component.html',
  styleUrls: ['rule-edit-dialog.component.less'],
  providers: [CashflowServiceProxy, ClassificationServiceProxy, TransactionsServiceProxy]  
})
export class RuleDialogComponent extends ModalDialogComponent implements OnInit, AfterViewInit {
    @ViewChild(DxTreeListComponent) categoryList: DxTreeListComponent;
    @ViewChild('keywordsComponent') keywordList: DxDataGridComponent;
    @ViewChild('attributesComponent') attributeList: DxDataGridComponent;

    conditionId: number;
    minAmount: number;
    maxAmount: number;
    bankId: number;
    accountId: number;
    amountFormat: ConditionDtoCashFlowAmountFormat 
        = ConditionDtoCashFlowAmountFormat.Unspecified;
    banks: any;
    accounts: any;
    categories: any = [];
    descriptor: string;
    descriptors: any = [];
    attributes: any = [];
    keywords: any = [];
    formats: any = [];
    attributeTypes: any;
    conditionTypes: any;

    private transactionAttributeTypes: any;

    constructor(
        injector: Injector,
        private _classificationServiceProxy: ClassificationServiceProxy,
        private _cashflowServiceProxy: CashflowServiceProxy,
        private _transactionsServiceProxy: TransactionsServiceProxy
    ) { 
        super(injector);

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
       
        _transactionsServiceProxy.getTransactionAttributeTypes().subscribe((data) => {
            let types = [];
            this.transactionAttributeTypes = data.transactionAttributeTypes;
            _.mapObject(data.transactionAttributeTypes, (val, key) => {
                types.push({
                    id: key,
                    name: val.name          
                });
            });
            this.attributeTypes = types;
        });

        _cashflowServiceProxy.getCashFlowInitialData().subscribe((data) => {
            this.banks = data.banks;
            if (this.bankId)
                this.onBankChanged({value: this.accountId});
        });

        if (this.data.id)
            _classificationServiceProxy.getRuleForEdit(this.data.id).subscribe((rule) => {
                this.descriptor = rule.transactionDecriptorAttributeTypeId || rule.transactionDecriptor;
                this.data.options[0].value = (rule.applyOption == EditRuleDtoApplyOption['MatchedAndUnclassified']);
                if (rule.condition) {      
                    this.conditionId = rule.condition.id;
                    this.bankId = rule.condition.bankId;
                    this.accountId = rule.condition.bankAccountId;  
                    this.amountFormat = rule.condition.cashFlowAmountFormat;
                    this.minAmount = rule.condition.minAmount;
                    this.maxAmount = rule.condition.maxAmount;
                    this.keywords = rule.condition.descriptionWords &&
                        rule.condition.descriptionWords.split(',').map((keyword, index) => {
                            return {
                                caption: 'Keyword #' + index,
                                keyword: keyword
                            };
                        }) || [];
                    this.attributes = rule.condition.attributes;
                } 
            });

        _classificationServiceProxy.getCategories().subscribe((data) => {
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

            if (this.data.categoryId) {
                let category = data.items[this.data.categoryId];
                this.categoryList.instance.expandRow(data.groups[category.groupId].typeId);
                this.categoryList.instance.expandRow(category.groupId.toString());
                this.categoryList.instance.option('selectedRowKeys', [this.data.categoryId]);
            }
        });
    }

    ngOnInit() {
        this.data.editTitle = true;
        this.data.title = this.data.name || 
            this.l('Enter the rule name');
        this.data.buttons = [{
            title: this.l(this.data.id ? 'Edit rule': 'Add rule'),
            class: 'primary',
            action: () => {
                if (this.validate()) {
                    let option = this.data.options[0].value ? 'MatchedAndUnclassified': 'SelectedOnly';
                    this._classificationServiceProxy[(this.data.id ? 'edit': 'create') + 'Rule'](
                        (this.data.id ? EditRuleDto: CreateRuleDto).fromJS({
                            id: this.data.id,
                            name: this.data.title,
                            parentId: this.data.parentId,
                            categoryId: this.getSelectedCategoryId(),
                            sourceTransactionsList: this.data.transactions,
                            transactionDecriptor: this.transactionAttributeTypes[this.descriptor] ? undefined: this.descriptor,
                            transactionDecriptorAttributeTypeId: this.transactionAttributeTypes[this.descriptor] ? this.descriptor: undefined,
                            applyOption: (this.data.id ? EditRuleDtoApplyOption: CreateRuleDtoApplyOption)[option],
                            condition: ConditionDto.fromJS({
                                id: this.conditionId,
                                minAmount: this.minAmount,
                                maxAmount: this.maxAmount,
                                bankId: this.bankId,
                                bankAccountId: this.accountId,
                                descriptionWords: this.getDescriptionKeywords(),
                                attributes: this.getAttributes()
                            })
                    })).subscribe((error) => {
                        if (!error) {
                            this.notify.info(this.l('SavedSuccessfully'));
                            this.data.refershParent();
                            this.close(true);
                        } else
                            this.notify.error(error);
                    });
                }
            }
        }];
        if (!this.data.id) 
            this.data.buttons.unshift({
                title: this.l('Don\'t add'),
                class: 'default',
                action: () => {
                    if (this.data.transactions)
                        this.validate(true) && this._classificationServiceProxy.updateTransactionsCategory(
                            UpdateTransactionsCategoryInput.fromJS({ 
                                transactionIds: this.data.transactions,
                                categoryId: this.getSelectedCategoryId(),
                                standardDescriptor: this.transactionAttributeTypes[this.descriptor] || this.descriptor 
                            })
                        ).subscribe((error) => {
                            if (!error) {
                                this.notify.info(this.l('SavedSuccessfully'));
                                this.data.refershParent();
                                this.close(true);
                            } 
                        });
                    else
                        this.close(true);
                }
            });

        this.data.options = [{
            text: this.l('Apply this rule to other occurences'),
            value: true
        }];
    }

    ngAfterViewInit() {
    }

    getSelectedCategoryId() {
        let selected = this.categoryList.instance.getSelectedRowsData();
        return selected.length && selected[0].id || undefined;
    }

    getDescriptionKeywords() {
        let list = this.keywordList.instance.getVisibleRows();
        return list.map((row) => {
            return row.data['keyword'];
        }).join(',') || '';
    }

    getAttributes() {
        let list = this.attributeList.instance.getVisibleRows();
        return list.map((row) => {
            let item = row.data;
            return ConditionAttributeDto.fromJS(item);
        });
    }

    addAttributeRow() {
        this.attributeList.instance.addRow();
    }

    onAttributeUpdated($event) {
        let descriptors = [];
        $event.component.getVisibleRows().forEach((row) => {
            if (row.data.attributeTypeId)
                descriptors.push({
                    id: row.data.attributeTypeId,
                    name: this.transactionAttributeTypes[row.data.attributeTypeId].name
                });
        });
        this.descriptors = descriptors;
    }

    addKeywordRow() {                                                    
        this.keywordList.instance.addRow();
    }

    onBankChanged($event) {
        if ($event.value && this.banks) 
            this.accounts = _.findWhere(this.banks,
                {id: $event.value})['bankAccounts'];
    }

    validate(ruleCheckOnly: boolean = false) {
        if (!ruleCheckOnly) {
/*
            if (!this.getDescriptionKeywords())
                return this.notify.error(this.l('RuleTransactionDescriptorError'));
*/

            if (!this.getAttributes().length)
                return this.notify.error(this.l('RuleAttributesError'));

            if (isNaN(this.bankId) || isNaN(this.accountId))
                return this.notify.error(this.l('RuleBankAccountError'));

            if (this.minAmount && this.maxAmount && this.minAmount > this.maxAmount)
                return this.notify.error(this.l('RuleAmountError'));
        }

/*
        if (!this.descriptor)
            return this.notify.error(this.l('RuleDescriptorError'));
*/

        if (isNaN(this.getSelectedCategoryId()))
            return this.notify.error(this.l('RuleCategoryError'));

        return true;
    }

    onCustomItemCreating($event) {
        this.descriptor = $event.text;
    }

    onInitNewKeyword($event) {
        $event.data['caption'] = 'Keyword #' + this.keywords.length;
    }
}