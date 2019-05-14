import { Component, Injector, OnInit } from '@angular/core';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';
import { CFOService } from '@shared/cfo/cfo.service';
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
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

@Component({
    selector: 'app-transaction-detail-info',
    templateUrl: './transaction-detail-info.component.html',
    styleUrls: ['./transaction-detail-info.component.less'],
    providers: [ CategoryTreeServiceProxy, TransactionsServiceProxy, CommentServiceProxy, ClassificationServiceProxy ]
})
export class TransactionDetailInfoComponent extends AppModalDialogComponent implements OnInit {
    transactionId: number;
    newComment = {
        text: '',
        inplaceEdit: false
    };
    transactionInfo = new TransactionDetailsDto();
    transactionAttributeTypes: any;
    isEditAllowed = true;
    private _itemInEditMode: any;
    categorization: GetCategoryTreeOutput;
    categories: any;
    selectedAccountingType: string;
    selectedCategoryId: number;
    accountingTypes: any = [];
    filteredCategory: any = [];
    filteredSubCategory: any = [];
    constructor(
        injector: Injector,
        private _cfoService: CFOService,
        private _transactionsService: TransactionsServiceProxy,
        private _categoryTreeServiceProxy: CategoryTreeServiceProxy,
        private _classificationServiceProxy: ClassificationServiceProxy,
        private _commentServiceProxy: CommentServiceProxy,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data.transactionId$.subscribe((id) => {
            this.transactionId = id;
            this.getTransactionDetails();
        });
        this.getTransactionAttributeTypes();
        this.getCategoryTree();
    }

    getTransactionDetails() {
        this._transactionsService.getTransactionDetails(InstanceType[this._cfoService.instanceType], this._cfoService.instanceId, this.transactionId)
            .subscribe(result => {
                this.transactionInfo = result.transactionDetails;
            });
    }

    get categoryPathTitle() {
        return [ this.transactionInfo.accountingType, this.transactionInfo.cashflowCategory, this.transactionInfo.cashflowSubCategory ]
                .filter(Boolean).join(' > ');
    }

    getTransactionAttributeTypes() {
        this._transactionsService.getTransactionAttributeTypes(InstanceType[this._cfoService.instanceType], this._cfoService.instanceId)
            .subscribe(result => {
                this.transactionAttributeTypes = result.transactionAttributeTypes;
            });
    }

    updateTransactionCategory(e) {
        this._classificationServiceProxy.updateTransactionsCategory(
            InstanceType[this._cfoService.instanceType],
            this._cfoService.instanceId,
            new UpdateTransactionsCategoryInput({
                transactionIds: [this.transactionId],
                categoryId: e.itemData.key,
                standardDescriptor: this.transactionInfo.transactionDescriptor,
                descriptorAttributeTypeId: this.selectedAccountingType,
                suppressCashflowMismatch: false
            })
        ).subscribe(() => {
            this.refreshParent();
            this.getTransactionDetails();
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    inPlaceEdit(field, item) {
        if (this.isEditAllowed) {

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
    }

    getCategoryTree() {
        this._categoryTreeServiceProxy.get(
            InstanceType[this._cfoService.instanceType], this._cfoService.instanceId, true
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
            InstanceType[this._cfoService.instanceType],
            this._cfoService.instanceId,
            new UpdateTransactionsCategoryInput({
                transactionIds: [this.transactionId],
                categoryId: this.transactionInfo.cashflowCategoryId,
                standardDescriptor: this.transactionInfo.transactionDescriptor,
                descriptorAttributeTypeId: null,
                suppressCashflowMismatch: true
            })
        ).subscribe(() => {
            this.refreshParent();
            this.transactionInfo['inplaceEdit'] = false;
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    inPlaceCreateComment(e) {
        this.newComment.inplaceEdit = true;
    }

    addNewComment() {
        this._commentServiceProxy.createTransactionCommentThread(
            InstanceType[this._cfoService.instanceType],
            this._cfoService.instanceId,
            new CreateTransactionCommentThreadInput({
                transactionId: this.transactionId,
                comment: this.newComment.text
            })
        ).subscribe(() => {
            this.refreshParent();
            this.newComment.inplaceEdit = false;
            this.newComment.text = '';
            this.notify.info(this.l('SavedSuccessfully'));
            this.getTransactionDetails();
        });
    }

    updateComment(field, data) {
        let request$ = data.text
            ? this._commentServiceProxy.updateComment(
                InstanceType[this._cfoService.instanceType],
                this._cfoService.instanceId,
                new UpdateCommentInput({
                    comment: data.text,
                    id: data.commentId
                })
            )
            : this._commentServiceProxy.deleteComment(
                InstanceType[this._cfoService.instanceType],
                this._cfoService.instanceId,
                data.commentId
            );
        request$.subscribe(() => {
            this.refreshParent();
            data.inplaceEdit = false;
            this.notify.info(this.l('SavedSuccessfully'));
            this.getTransactionDetails();
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
        this.selectedCategoryId = e.value;
        this.categories.filter(item => {
            if (item['parent'] == e.value) {
                this.filteredCategory.push(item);
            }
        });
    }

    filterSubCategoriesData(e) {
        this.filteredSubCategory = [];
        this.selectedCategoryId = e.value;
        this.categories.filter(item => {
            if (item['parent'] == e.value) {
                this.filteredSubCategory.push(item);
            }
        });
    }

    refreshParent() {
        this.data.refreshParent && this.data.refreshParent();
    }

    trackElement(index: number, element: any) {
        return element ? element.guid : null;
    }
}
