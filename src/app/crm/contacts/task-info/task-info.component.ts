import { Component, OnInit } from "@angular/core";
import { map, takeUntil } from "rxjs/operators";

import {
    ContactActivityLogInfo,
    ContactBalanceBaseDto,
    ContactServiceProxy,
    CreditBalanceServiceProxy,
    DocumentServiceProxy,
    GetPaymentsDto,
    InvoiceStatus,
    OrderSubscriptionDto,
    OrderSubscriptionServiceProxy,
    PaymentServiceProxy,
    RecurringPaymentFrequency,
} from "@shared/service-proxies/service-proxies";
import { CurrencyPipe, getCurrencySymbol } from "@angular/common";
import { ActivityServiceProxy } from "@shared/service-proxies/service-proxies";
import { ContactsService } from "../contacts.service";
import { LifecycleSubjectsService } from "@shared/common/lifecycle-subjects/lifecycle-subjects.service";
import { AppLocalizationService } from "@app/shared/common/localization/app-localization.service";
import { LeadInfoDto } from "@shared/service-proxies/service-proxies";
import { DocumentInfo } from "@shared/service-proxies/service-proxies";
import { SettingsHelper } from "@root/shared/common/settings/settings.helper";
import ODataStore from "devextreme/data/odata/store";
import { AppConsts } from "@root/shared/AppConsts";
import { ODataService } from "@root/shared/common/odata/odata.service";
import { InstanceModel } from "@root/shared/cfo/instance.model";
import { Param } from "@root/shared/common/odata/param.model";
import { FilterHelpers } from "@app/crm/shared/helpers/filter.helper";
import { DateHelper } from "@root/shared/helpers/DateHelper";

@Component({
    selector: "task-info",
    templateUrl: "./task-info.component.html",
    styleUrls: ["./task-info.component.less"],
    providers: [CreditBalanceServiceProxy, CurrencyPipe],
})
export class TaskInfoComponent implements OnInit {
    private readonly dataSourceCountURI = "InvoiceCount";
    defaultCurrency = SettingsHelper.getCurrency();
    leadId: number;
    balance: number;
    grossSale: number;
    contactIds: number[];
    currentPlan: {
        amount: number;
        currencyId: string;
        period: string;
    };
    invoices: number;
    tasks: number;
    logs: ContactActivityLogInfo[];
    files: DocumentInfo[];

    constructor(
        private contactServiceProxy: ContactServiceProxy,
        private lifeCycleService: LifecycleSubjectsService,
        private creditBalanceProxy: CreditBalanceServiceProxy,
        private paymentServiceProxy: PaymentServiceProxy,
        private orderSubscriptionProxy: OrderSubscriptionServiceProxy,
        public ls: AppLocalizationService,
        private documentProxy: DocumentServiceProxy,
        private currencyPipe: CurrencyPipe,
        private oDataService: ODataService,
        public activityProxy: ActivityServiceProxy,
        public contactsService: ContactsService
    ) { }

    ngOnInit(): void {
        this.contactsService.leadInfo$
            .pipe(takeUntil(this.lifeCycleService.destroy$))
            .subscribe((lead: LeadInfoDto) => {
                this.leadId = lead && lead.id;
            });

        this.contactServiceProxy
            .getSourceContacts("", this.leadId, true, 100)
            .pipe(takeUntil(this.lifeCycleService.destroy$))
            .subscribe((contacts) => {
                this.contactIds = contacts.map((contact) => contact.id);
            });

        this.contactsService.contactInfo$.subscribe(contactInfo => {
            this.contactServiceProxy.getActivityLogs(
                contactInfo.id
            ).subscribe((logs: ContactActivityLogInfo[]) => {
                this.logs = logs;
            });

            this.documentProxy.getAll(
                contactInfo.id
            ).subscribe((files: DocumentInfo[]) => {
                this.files = files;
            })

            this.creditBalanceProxy
                .getContactBalance(contactInfo.id)
                .subscribe((result: ContactBalanceBaseDto) => {
                    this.balance = result.balance;
                });
            this.paymentServiceProxy
                .getPayments(contactInfo.id)
                .subscribe((result: GetPaymentsDto) => {
                    this.grossSale =
                        result.totalPaymentAmounts[this.defaultCurrency];
                });
            this.getInvoiceCount(contactInfo.id);
            this.getCurrentSubscription(contactInfo.id);
        });
    }

    getInvoiceCount(id: number) {
        const invoiceStore = new ODataStore({
            version: AppConsts.ODataVersion,
            url: this.getODataUrl(this.dataSourceCountURI, [
                { ContactId: { eq: id } },
            ]),
            beforeSend: (request) => {
                request.headers["Authorization"] =
                    "Bearer " + abp.auth.getToken();
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
            },
        });
        invoiceStore
            .load()
            .then((res: any) => (this.invoices = res?.count ?? 0));
    }

    getODataUrl(
        uri: string,
        filter?: Object,
        instanceData: InstanceModel = null,
        params: Param[] = null
    ) {
        return this.oDataService.getODataUrl(uri, filter, instanceData, params);
    }

    getCurrentSubscription(id: number) {
        this.orderSubscriptionProxy
            .getSubscriptionHistory(id)
            .pipe(
                /** Filter draft subscriptions */
                map((subscriptions) =>
                    subscriptions.filter(
                        (subscription) => subscription.statusCode !== "D"
                    )
                )
            )
            .subscribe((result: OrderSubscriptionDto[]) => {
                if (result?.length > 0) {
                    const currentSubscription = result[0];
                    if (currentSubscription.statusCode === "A") {
                        this.currentPlan = {
                            amount: currentSubscription.fee,
                            period: this.getRecurringPaymentFrequencyShortForm(
                                currentSubscription.paymentPeriodType
                            ),
                            currencyId: currentSubscription.currencyId,
                        };
                    } else {
                        this.currentPlan = null;
                    }
                } else {
                    this.currentPlan = null;
                }
            });
    }

    amountCustomizer = (value, currencyId = null) => {
        const currency = getCurrencySymbol(
            currencyId ?? this.defaultCurrency,
            "narrow"
        );
        return (
            this.currencyPipe.transform(
                value,
                currencyId ?? this.defaultCurrency,
                currency,
                "1.0-0"
            ) || ""
        );
    };
    getRecurringPaymentFrequencyShortForm(
        frequency: RecurringPaymentFrequency
    ): string {
        switch (frequency) {
            case RecurringPaymentFrequency.Monthly:
                return "mo";
            case RecurringPaymentFrequency.Annual:
                return "yr";
            case RecurringPaymentFrequency.LifeTime:
                return "life";
            case RecurringPaymentFrequency.OneTime:
                return "once";
            case RecurringPaymentFrequency.Custom:
                return "custom";
            default:
                return "";
        }
    }
}