import {Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import {
    CategoryTreeServiceProxy,
    ClassificationServiceProxy,
    InstanceType,
    TransactionDetailsDto,
    CommentServiceProxy,
    TransactionsServiceProxy,
    UpdateTransactionsCategoryInput,
    GetCategoryTreeOutput,
    CreateTransactionCommentThreadInput,
    UpdateCommentInput
} from '@shared/service-proxies/service-proxies';
import * as _ from 'underscore';

@Component({
    selector: 'app-transaction-detail-info',
    templateUrl: './transaction-detail-info.component.html',
    styleUrls: ['./transaction-detail-info.component.less'],
    providers: [ TransactionsServiceProxy, CommentServiceProxy ]
})
export class TransactionDetailInfoComponent extends CFOComponentBase implements OnInit {
    @Input() transactionId: number;
    @Input() targetDetailInfoTooltip = '';
    @Output() onTooltipClosed: EventEmitter<any> = new EventEmitter();
    newComment = {
        text: '',
        inplaceEdit: false
    };
    isVisible = false;
    transactionInfo = new TransactionDetailsDto();
    transactionAttributeTypes: any;
    isEditAllowed = true;
    private _isInPlaceEditAllowed = true;
    private _itemInEditMode: any;
    categorization: GetCategoryTreeOutput;
    categories: any;
    selectedAccountingType: string;
    selcetdCategoryId: number;
    accountingTypes: any = [];
    filteredCategory: any = [];
    filteredSubCategory: any = [];


    constructor(
        injector: Injector,
        private _transactionsService: TransactionsServiceProxy,
        private _categoryTreeServiceProxy: CategoryTreeServiceProxy,
        private _classificationServiceProxy: ClassificationServiceProxy,
        private _commentServiceProxy: CommentServiceProxy
    ) {
        super(injector);
    }

    toggleTransactionDetailsInfo() {
        setTimeout(() => {
            this.getTransactionDetails();
            this.isVisible = !this.isVisible;
        }, 0);
    }

    ngOnInit() {
        this.getTransactionAttributeTypes();
        this.getCategoryTree();
    }

    closeTooltip() {
        this.isVisible = false;
        this.onTooltipClosed.emit();
        this.accountingTypes = [];
        this.filteredCategory = [];
        this.filteredSubCategory = [];
        this.selectedAccountingType = '';
        this.selcetdCategoryId = null;
    }

    getTransactionDetails() {
        this._transactionsService.getTransactionDetails(InstanceType[this.instanceType], this.instanceId, this.transactionId)
            .subscribe(result => {
                this.transactionInfo = result.transactionDetails;
            });
    }

    getTransactionAttributeTypes() {
        this._transactionsService.getTransactionAttributeTypes(InstanceType[this.instanceType], this.instanceId)
            .subscribe(result => {
                this.transactionAttributeTypes = result.transactionAttributeTypes;
            });
    }

    updateTransactionCategory(e) {
        this._classificationServiceProxy.updateTransactionsCategory(
            InstanceType[this.instanceType],
            this.instanceId,
            new UpdateTransactionsCategoryInput({
                transactionIds: [this.transactionId],
                categoryId: e.itemData.key,
                standardDescriptor: this.transactionInfo.transactionDescriptor,
                descriptorAttributeTypeId: this.selectedAccountingType,
                suppressCashflowMismatch: false
            })
        ).subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    inPlaceEdit(field, item) {
        if (this.isEditAllowed) {

            if (!this._isInPlaceEditAllowed)
                return;

            item.inplaceEdit = true;
            item.original = item[field];

            if (this._itemInEditMode && this._itemInEditMode != item)
                this._itemInEditMode.inplaceEdit = false;

            this._itemInEditMode = item;
        }
    }


    closeInPlaceEdit(field, item) {
        item.inplaceEdit = false;
        item[field] = item.original;
        this._isInPlaceEditAllowed = true;
    }

    itemValueChanged(field, item) {
        this._isInPlaceEditAllowed = item[field] == item.original;
    }

    getCategoryTree() {
        this._categoryTreeServiceProxy.get(
            InstanceType[this.instanceType], this.instanceId, true
        ).subscribe(data => {
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
                    let accounting = data.accountingTypes[item.accountingTypeId];
                    if (accounting && (!item.parentId || data.categories[item.parentId])) {
                        categories.push({
                            key: parseInt(key),
                            parent: item.parentId || item.accountingTypeId + accounting.typeId,
                            coAID: item.coAID,
                            name: item.name,
                            typeId: accounting.typeId
                        });
                    }
                });

            this.categories = categories;
        });
    }

    updateDescriptor() {
        this._classificationServiceProxy.updateTransactionsCategory(
            InstanceType[this.instanceType],
            this.instanceId,
            new UpdateTransactionsCategoryInput({
                transactionIds: [this.transactionId],
                categoryId: this.transactionInfo.cashflowCategoryId,
                standardDescriptor: this.transactionInfo.transactionDescriptor,
                descriptorAttributeTypeId: null,
                suppressCashflowMismatch: true
            })
        ).subscribe(() => {
            this.transactionInfo['inplaceEdit'] = false;
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    inPlaceCreateComment(e) {
        this.newComment.inplaceEdit = true;
    }

    addNewComment() {
        this._commentServiceProxy.createTransactionCommentThread(
            InstanceType[this.instanceType],
            this.instanceId,
            new CreateTransactionCommentThreadInput({
                transactionId: this.transactionId,
                comment: this.newComment.text
            })
        ).subscribe(() => {
            this.newComment.inplaceEdit = false;
            this.newComment.text = '';
            this.notify.info(this.l('SavedSuccessfully'));
            this.getTransactionDetails();
        });
    }

    updateComment(field, data) {
        this._commentServiceProxy.updateComment(
            InstanceType[this.instanceType],
            this.instanceId,
            new UpdateCommentInput({
                comment: data.text,
                id: data.commentId
            })
        ).subscribe(() => {
            data.inplaceEdit = false;
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    getAccountingTypes() {
        this.accountingTypes = [];
        this.categories.filter(item => {
            if (item['parent'] == 'root' && item['typeId'] == this.transactionInfo.cashFlowTypeId) {
                this.accountingTypes.push(item);
                this.selectedAccountingType = item['typeId'];
            }
        });
    }

    filterCategoriesData(e) {
        this.filteredCategory = [];
        this.selcetdCategoryId = e.value;
        this.categories.filter(item => {
            if (item['parent'] == e.value) {
                this.filteredCategory.push(item);
            }
        });
    }

    filterSubCategoriesData(e) {
        this.filteredSubCategory = [];
        this.selcetdCategoryId = e.value;
        this.categories.filter(item => {
            if (item['parent'] == e.value) {
                this.filteredSubCategory.push(item);
            }
        });
    }
}
