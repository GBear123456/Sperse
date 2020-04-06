/** Core imports */
import { Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import * as XLSX from 'xlsx';
import 'devextreme/data/odata/store';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { ClassificationServiceProxy, AccountingCategoryDto, InstanceType, CategoryTreeServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { CategorizationComponent } from '@app/cfo/transactions/categorization/categorization.component';
import { SyncTypeIds } from '../../../shared/AppEnums';
import { AppConsts } from '../../../shared/AppConsts';

class UploadCategoryModel {
    'Cashflow Type': string;
    'Accounting Type': string;
    'Category': string;
    'Category Id': number;
    'Parent Category': string;
    'Parent Category Id': number;
    'Transaction Count': number;
    'COAID': string;
}

@Component({
    selector: 'chart-of-accounts',
    templateUrl: './chart-of-accounts.component.html',
    styleUrls: ['./chart-of-accounts.component.less'],
    providers: [ ClassificationServiceProxy, CategoryTreeServiceProxy ],
    animations: [ appModuleAnimation() ]
})
export class ChartOfAccountsComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(CategorizationComponent, { static: true }) categorizationComponent: CategorizationComponent;
    override = false;
    syncTypeIds = SyncTypeIds;
    isMobile = AppConsts.isMobile;

    constructor(
        injector: Injector,
        private categoryTreeServiceProxy: CategoryTreeServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.getRootComponent().overflowHidden(true);

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
            ws['!ref'] = 'A1:H1000';

            /* save data */
            let data = XLSX.utils.sheet_to_json<UploadCategoryModel>(ws);

            let accTypes: AccountingCategoryDto[] = [];
            data.forEach((val, i) => {
                accTypes.push(new AccountingCategoryDto({
                    id: null,
                    accountingType: val['Accounting Type'],
                    cashType: val['Cashflow Type'],
                    category: val['Category'],
                    parentCategory: val['Parent Category'],
                    coAID: val['COAID'],
                    sortId: null,
                    reportingCategoryCode: null,
                    reportingCategoryName: null,
                    isActive: val['isActive']
                }));
            });
            this.categoryTreeServiceProxy.import(
                InstanceType[this.instanceType],
                this.instanceId,
                this.override,
                accTypes
            )
                .pipe(finalize(() => abp.ui.clearBusy()))
                .subscribe(() => {
                    this.refreshCategories();
                });
        };

        reader.onerror = () => { abp.ui.clearBusy(); };
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
