import { Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

import { ClassificationServiceProxy, AccountingCategoryDto, InstanceType, CategoryTreeServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import { CategorizationComponent } from '@app/cfo/transactions/categorization/categorization.component';
import * as XLSX from 'xlsx';
import { finalize } from 'rxjs/operators';

class UploadCategoryModel {
    'Cashflow Type': string;
    'Accounting Type': string;
    'Category': string;
    'Category Id': number;
    'Sub Category': string;
    'Sub Category Id': number;
    'Transaction Count': number;
    'COAID': number;
}

@Component({
    selector: 'chart-of-accounts',
    templateUrl: './chart-of-accounts.component.html',
    styleUrls: ['./chart-of-accounts.component.less'],
    providers: [ClassificationServiceProxy, CategoryTreeServiceProxy],
    animations: [appModuleAnimation()]
})
export class ChartOfAccountsComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(CategorizationComponent) categorizationComponent: CategorizationComponent;
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    headlineConfig: any;

    constructor(injector: Injector,
        private _categoryTreeServiceProxy: CategoryTreeServiceProxy) {
        super(injector);
    }

    ngOnInit() {
        super.ngOnInit();

        this.getRootComponent().overflowHidden(true);
        this.headlineConfig = {
            names: [this.l('Setup_Title'), this.l('SetupStep_Chart')],
            iconSrc: './assets/common/icons/magic-stick-icon.svg'
        };

        //this.dataSource = {
        //  store: {
        //    type: 'odata',
        //    url: this.getODataUrl(this.dataSourceURI),
        //    version: AppConsts.ODataVersion,
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
            target['value'] = '';
            /* read workbook */
            const bstr: string = e.target.result;
            const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

            /* grab first sheet */
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];
            ws['!ref'] = "A1:H1000";

            /* save data */
            let data = XLSX.utils.sheet_to_json<UploadCategoryModel>(ws);

            let accTypes: AccountingCategoryDto[] = [];
            data.forEach((val, i) => {
                accTypes.push(new AccountingCategoryDto({
                    accountingType: val['Accounting Type'],
                    cashType: val['Cashflow Type'],
                    category: val['Category'],
                    subCategory: val['Sub Category'],
                    coAID: val['COAID'],
                    sortId: null
                }));
            });
            this._categoryTreeServiceProxy.import(
                InstanceType[this.instanceType],
                this.instanceId,
                accTypes
            )
                .pipe(finalize(() => { abp.ui.clearBusy(); }))
                .subscribe((result) => {
                    this.refreshCategories();
                });
        };

        reader.readAsBinaryString(target.files[0]);
    }

    refreshCategories() {
        this.categorizationComponent.refreshCategories(false);
    }

    refresh() {
        this.categorizationComponent.refreshCategories();
    }

    ngOnDestroy() {
        this.getRootComponent().overflowHidden();
    }
}
