import { Component, OnInit } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'required-documents',
    templateUrl: './required-documents.component.html',
    styleUrls: ['./required-documents.component.less']
})
export class RequiredDocumentsComponent implements OnInit {

    documents = [
        {
            'name': 'Document 1',
            'status': 'success'
        },
        {
            'name': 'Document 2',
            'status': 'success'
        },
        {
            'name': 'Document 3',
            'status': 'success'
        },
        {
            'name': 'Document 4',
            'status': 'unsuccess'
        }
    ];
    statuses = {
        'success_amount': 0,
        'unsuccess_amount': 0,
        'pending_amount': 0
    };
    documents_colupsed = false;

    constructor(
        public ls: AppLocalizationService
    ) { }

    ngOnInit() {
//    this.documents = this.FinancialService.getDocuments();
//    this.statuses = this.getStatuses(this.documents);
    }

    changeColupsStatus() {
        this.documents_colupsed = !this.documents_colupsed;
    }

}
