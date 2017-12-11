import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, OnInit, AfterViewInit, ViewChild } from '@angular/core';

import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { DxTreeListComponent, DxDataGridComponent } from 'devextreme-angular';

import {CashflowServiceProxy, CategorizationServiceProxy, 
    CreateRuleDto, ConditionAttributeDto, ConditionDto } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
  selector: 'rule-dialog',
  templateUrl: 'rule-edit-dialog.component.html',
  styleUrls: ['rule-edit-dialog.component.less'],
  providers: [CashflowServiceProxy, CategorizationServiceProxy]  
})
export class RuleDialogComponent extends ModalDialogComponent implements OnInit, AfterViewInit {
    @ViewChild(DxTreeListComponent) categoryList: DxTreeListComponent;
    @ViewChild('keywordsComponent') keywordList: DxDataGridComponent;
    @ViewChild('attributesComponent') attributeList: DxDataGridComponent;

    minAmount: number;
    maxAmount: number;
    bankId: number;
    accountId: number;
    banks: any;
    accounts: any;
    categories: any = [];
    descriptor: string;
    attributes: any = [];
    keywords: any = [];

    constructor(
      injector: Injector,
      private _categorizationService: CategorizationServiceProxy,
      private _cashflowServiceProxy: CashflowServiceProxy
    ) { 
        super(injector);

        _cashflowServiceProxy.getCashFlowInitialData().subscribe((data) => {
            this.banks = data.banks;
        });

        _categorizationService.getCategories().subscribe((data) => {
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
            this.categoryList.instance.refresh();
        });
    }

    ngOnInit() {
        this.data.categories = this.categories;
        this.data.editTitle = true;
        this.data.title = 'Define rule';
        this.data.buttons = [{
            title: this.l('Don\'t add'),
            class: 'default',
            action: () => {
                this.close(true);
            }
        }, {
            title: this.l('Add rule'),
            class: 'primary',
            action: () => {
                if (this.validate())
                    this._categorizationService.createRule(CreateRuleDto.fromJS({
                        name: this.data.title,
                        categoryId: this.getSelectedCategoryId(),
                        transactionDecriptor: this.descriptor,
                        conditions: [ConditionDto.fromJS({
                            minAmount: this.minAmount,
                            maxAmount: this.maxAmount,
                            bankId: this.bankId,
                            bankAccountId: this.accountId,
                            descriptionWords: this.getDescriptionKeywords(),
                            attributes: [ConditionAttributeDto.fromJS(this.getAttributes())]
                        })]
                    })).subscribe((success) => {
                        if (success) {
                            this.notify.info(this.l('SavedSuccessfully'));
                            this.close(true);
                        } else
                            this.notify.error(this.l('SomeErrorOccured'));
                    });
            }
        }];
        this.data.options = [{
            text: this.l('Apply this rule to other 34 occurences'),
            value: true
        }];      
    }

    ngAfterViewInit() {
        this.categoryList.instance.refresh();
    }

    getSelectedCategoryId() {
        let selected = this.categoryList.instance.getSelectedRowsData();
        return selected.length && selected[0].id || null;
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
            return {
                id: item['id'],
                attributeTypeId: item['attributeTypeId'],
                conditionTypeId: item['conditionTypeId'],
                conditionValue: item['conditionValue']
            }
        });
    }

    addAttributeRow() { 
        this.attributeList.instance.addRow();
    }

    addKeywordRow() {                                                    
        this.keywordList.instance.addRow();
    }

    onBankChanged($event) {
        if ($event.value)
            this.accounts = _.findWhere(this.banks, 
                {id: $event.value})['bankAccounts'];
    }

    validate() {
        if (!this.getDescriptionKeywords())
            return this.notify.error(this.l('RuleTransactionDescriptorError'));

        if (!this.getAttributes().length)
            return this.notify.error(this.l('RuleAttributesError'));

        if (isNaN(this.bankId) || isNaN(this.accountId))
            return this.notify.error(this.l('RuleBankAccountError'));

        if (isNaN(this.minAmount) || isNaN(this.maxAmount) || this.minAmount > this.maxAmount)
            return this.notify.error(this.l('RuleAmountError'));

        if (!this.descriptor)
            return this.notify.error(this.l('RuleDescriptorError'));      

        if (isNaN(this.getSelectedCategoryId()))
            return this.notify.error(this.l('RuleCategoryError'));

        return true;
    }

    onInitNewKeyword($event) {
        $event.data['caption'] = 'Keyword #' 
            + this.keywords.length;
    }
}