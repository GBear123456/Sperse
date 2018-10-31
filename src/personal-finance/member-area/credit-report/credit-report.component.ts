import { Component, OnInit, Injector } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AppComponentBase } from '@shared/common/app-component-base';
import { PackageIdService } from '../../shared/common/packages/package-id.service';
import { AppConsts } from '@shared/AppConsts';
import { KBAServiceProxy, CreditReportServiceProxy, CreditReportOutput } from '@shared/service-proxies/service-proxies';
import { PageScrollConfig } from 'ngx-page-scroll';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as moment from 'moment';
@Component({
    selector: 'app-root',
    templateUrl: './credit-report.component.html',
    styleUrls: ['./credit-report.component.less'],
    providers: [KBAServiceProxy],
    animations: [appModuleAnimation()]
})
export class CreditReportComponent extends AppComponentBase implements OnInit {
    creditReportResult: CreditReportOutput;
    today: moment.Moment = moment();
    storage = sessionStorage;
    pdfUrl: SafeUrl;
    isPdfGenerated = false;
    isPdfGenerating = false;

    menuItems = [
        { name: 'creditScores', class: 'icon-credit-score-menu-icon'},
        { name: 'creditSummary', class: 'icon-credit-summary-menu-icon'},
        { name: 'personalInfo', class: 'icon-credit-report-menu-icon'},
        { name: 'accountBalances', class: 'icon-credit-tracker-menu-icon'},
        { name: 'creditAlerts', class: 'icon-credit-alerts-menu-icon'},
        { name: 'recommendations', class: 'icon-credit-recommendation-menu-icon'},
        { name: 'inquiries', class: 'icon-credit-inquiries-menu-icon'},
        { name: 'creditorContactList', class: 'icon-credit-contact-list-menu-icon'},
        { name: 'scoreFactors', class: 'icon-score-factors-menu-icon'},
        { name: 'consumerStatements', class: 'icon-consumer-statements-menu-icon'},
        { name: 'publicInfo', class: 'icon-credit-recommendation-menu-icon' },
        { name: 'creditHistory', class: 'icon-credit-tracker-menu-icon' },
        { name: 'disputeManagement', class: 'icon-dispute-management-menu-icon'},
    ];
    imgList = [
        {img: 'daily-reports-icon.svg', text: 'CreditMonitorAlerts'},
        {img: 'interactive-tools-icon.svg', text: 'EducationalResources'},
        {img: 'TUmonitoring-icon.svg', text: 'TransUnionMonitoring'}
    ];

    constructor(
        injector: Injector,
        private _creditReportService: CreditReportServiceProxy,
        private _packageService: PackageIdService,
        private _sanitizer: DomSanitizer
    ) {
        super(injector);
        PageScrollConfig.defaultDuration = 500;
        this.localizationSourceName = AppConsts.localization.CreditReportLocalizationSourceName;
    }

    ngOnInit(): void {
        this.getCreditReport();
    }

    getCreditReport(date?: moment.Moment): void {
        abp.ui.setBusy();
        this._creditReportService
            .getLastCreditReport(date)
            .subscribe(result => {
                sessionStorage.setItem('showSCWarning', String(result.isSubscriptionCancelled));
                sessionStorage.setItem('showPDWarning', String(result.isPaymentDelayed));

                if (!result.memberExists && result.uncompletedPackageId) {
                    this._packageService.choosePackage(result.uncompletedPackageId);
                    this._router.navigate(['personal-finance/signup']);
                }
                this.creditReportResult = result;
                abp.ui.clearBusy();
            }, () => abp.ui.clearBusy()
        );
    }

    generatePdf(element) {
        if (this.isPdfGenerating || this.isPdfGenerated) return;

        this.isPdfGenerating = true;
        element.firstChild.textContent = this.l('generatingPdf');

        if (this.creditReportResult && this.creditReportResult.creditReport) {
            this._creditReportService
                .downloadCreditReport(this.creditReportResult.creditReport.creditReportId)
                .subscribe(result => {
                    var bytes = this.base64ToArrayBuffer(result);

                    var blob = new Blob([bytes], { type: "application/pdf" });
                    var url = window.URL.createObjectURL(blob);
                    this.pdfUrl = this._sanitizer.bypassSecurityTrustUrl(url);

                    element.firstChild.textContent = this.l('downloadPdf');

                    this.isPdfGenerating = false;
                    this.isPdfGenerated = true;
                },
                () => {
                    this.isPdfGenerating = false;
                    element.firstChild.textContent = this.l('generatePdf');
                });
        }
    }

    base64ToArrayBuffer(base64) {
        var binaryString = window.atob(base64);
        var binaryLen = binaryString.length;
        var bytes = new Uint8Array(binaryLen);
        for (var i = 0; i < binaryLen; i++) {
            var ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        return bytes;
    }
}
