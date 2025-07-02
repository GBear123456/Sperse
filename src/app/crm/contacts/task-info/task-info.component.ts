import { Component, OnInit } from "@angular/core";
import { takeUntil } from "rxjs/operators";

import {
    ContactActivityLogInfo,
    ContactBalanceBaseDto,
    ContactServiceProxy,
    CreditBalanceServiceProxy,
    DocumentServiceProxy,
} from "@shared/service-proxies/service-proxies";
import { ActivityServiceProxy } from "@shared/service-proxies/service-proxies";
import { ContactsService } from "../contacts.service";
import { LifecycleSubjectsService } from "@shared/common/lifecycle-subjects/lifecycle-subjects.service";
import { AppLocalizationService } from "@app/shared/common/localization/app-localization.service";
import { LeadInfoDto } from "@shared/service-proxies/service-proxies";
import { DocumentInfo } from "@shared/service-proxies/service-proxies";

@Component({
    selector: "task-info",
    templateUrl: "./task-info.component.html",
    styleUrls: ["./task-info.component.less"],
    providers: [CreditBalanceServiceProxy],
})
export class TaskInfoComponent implements OnInit {
    leadId: number;
    balance: number;
    contactIds: number[];
    logs: ContactActivityLogInfo[];
    files: DocumentInfo[];

    constructor(
        private contactServiceProxy: ContactServiceProxy,
        private lifeCycleService: LifecycleSubjectsService,
        private creditBalanceProxy: CreditBalanceServiceProxy,
        public ls: AppLocalizationService,
        private documentProxy: DocumentServiceProxy,
        public activityProxy: ActivityServiceProxy,
        public contactsService: ContactsService
    ) {}

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

        this.contactsService.contactInfo$.subscribe((contactInfo) => {
            this.contactServiceProxy
                .getActivityLogs(contactInfo.id)
                .subscribe((logs: ContactActivityLogInfo[]) => {
                    this.logs = logs;
                });

            this.documentProxy
                .getAll(contactInfo.id)
                .subscribe((files: DocumentInfo[]) => {
                    this.files = files;
                });

            this.creditBalanceProxy
                .getContactBalance(contactInfo.id)
                .subscribe((result: ContactBalanceBaseDto) => {
                    this.balance = result.balance;
                });
        });
    }
}
