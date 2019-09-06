import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { PackageIdService } from '../../shared/common/packages/package-id.service';
import { KBAServiceProxy, CreditReportServiceProxy, CreditReportOutput } from '@shared/service-proxies/service-proxies';
import { PageScrollConfig } from 'ngx-page-scroll';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as moment from 'moment';
import { Router } from '@angular/router';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@root/shared/AppConsts';
@Component({
    selector: 'app-root',
    templateUrl: './credit-report.component.html',
    styleUrls: ['./credit-report.component.less'],
    providers: [KBAServiceProxy],
    animations: [appModuleAnimation()]
})
export class CreditReportComponent implements OnInit {
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
        private _router: Router,
        private _creditReportService: CreditReportServiceProxy,
        private _packageService: PackageIdService,
        private _sanitizer: DomSanitizer,
        public ls: AppLocalizationService
    ) {
        PageScrollConfig.defaultDuration = 500;
    }

    ngOnInit(): void {
        this.getCreditReport();
    }

    onSelectChanged() {
        abp.ui.setBusy();
        this._router.navigate(['personal-finance/credit-simulator']).then(() => abp.ui.clearBusy());
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
        element.firstChild.textContent = this.ls.l('generatingPdf');

        if (this.creditReportResult && this.creditReportResult.creditReport) {
            this._creditReportService
                .downloadCreditReport(this.creditReportResult.creditReport.creditReportId)
                .subscribe(result => {
                    let bytes = this.base64ToArrayBuffer(result);

                    let blob = new Blob([bytes], { type: 'application/pdf' });
                    let url = window.URL.createObjectURL(blob);
                    this.pdfUrl = this._sanitizer.bypassSecurityTrustUrl(url);

                    element.firstChild.textContent = this.ls.l('downloadPdf');

                    this.isPdfGenerating = false;
                    this.isPdfGenerated = true;
                },
                () => {
                    this.isPdfGenerating = false;
                    element.firstChild.textContent = this.ls.l('generatePdf');
                });
        }
    }

    base64ToArrayBuffer(base64) {
        let binaryString = window.atob(base64);
        let binaryLen = binaryString.length;
        let bytes = new Uint8Array(binaryLen);
        for (let i = 0; i < binaryLen; i++) {
            let ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        return bytes;
    }
}
