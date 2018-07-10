import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

import { ClassificationServiceProxy, AccountingCategoryDto, InstanceType } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import DsataSource from 'devextreme/data/data_source';
import { CategorizationComponent } from 'app/cfo/transactions/categorization/categorization.component';
import * as _ from 'underscore';
import * as XLSX from 'xlsx';
import { finalize } from 'rxjs/operators';

class UploadCategoryModel{
    'Cashflow Type': string;
    'Accounting Type': string;
    'Category': string;
    'Category Id': number;
    'Sub Category': string;
    'Sub Category Id': number;
    'Transaction Count': number;
};

@Component({
    selector: 'chart-of-accounts',
    templateUrl: './chart-of-accounts.component.html',
    styleUrls: ['./chart-of-accounts.component.less'],
    providers: [ClassificationServiceProxy],
    animations: [appModuleAnimation()]
})
export class ChartOfAccountsComponent extends CFOComponentBase implements OnInit {
    @ViewChild(CategorizationComponent) categorizationComponent: CategorizationComponent;
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    headlineConfig: any;
    ActionTitle = 'CUSTOM CHART';

    constructor(injector: Injector,
        private _router: Router,
        private _classificationServiceProxy: ClassificationServiceProxy){
        super(injector);
    }

    ngOnInit() {
        super.ngOnInit();

        this.headlineConfig = {
            names: [this.l('Setup_Title'), this.l('SetupStep_Chart')],
            iconSrc: 'assets/common/icons/magic-stick-icon.svg'
        };

        //this.dataSource = {
        //  store: {
        //    type: 'odata',
        //    url: this.getODataURL(this.dataSourceURI),
        //    version: this.getODataVersion(),
        //    beforeSend: function (request) {
        //      request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
        //    }
        //  }
        //};
    }

    locationColumn_calculateCellValue(rowData) {
        return rowData.StateId + ', ' + rowData.CountryId;
    }

    downloadExcel() {
        this.exportToXLS('all');
    }

    uploadExcel(evt) {
        abp.ui.setBusy();

        const target: DataTransfer = <DataTransfer>(evt.target);
        if (target.files.length !== 1) throw new Error('Cannot use multiple files');
        const reader: FileReader = new FileReader();

        reader.onload = (e: any) => {
            /* read workbook */
            const bstr: string = e.target.result;
            const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

            /* grab first sheet */
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];
            ws['!ref'] = "A1:G1000";

            /* save data */
            let data = XLSX.utils.sheet_to_json<UploadCategoryModel>(ws);

            let accTypes: AccountingCategoryDto[] = [];
            data.forEach((val, i) => {
                accTypes.push(new AccountingCategoryDto({
                    accountingType: val['Accounting Type'],
                    cashType: val['Cashflow Type'],
                    category: val['Category'],
                    subCategory: val['Sub Category'],
                    coAID: null,
                    sortId: null
                }));
            });
            this._classificationServiceProxy.importAccountingTree(
                InstanceType[this.instanceType],
                this.instanceId,
                accTypes
            )
                .pipe(finalize(() => { abp.ui.clearBusy(); }))
                .subscribe((result) => {
                    this.categorizationComponent.refreshCategories(false);
                });
        };

        reader.readAsBinaryString(target.files[0]);
    }
}
