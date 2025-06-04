import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "app-lead-detail-card",
    templateUrl: "./lead-detail-card.component.html",
    styleUrls: ["./lead-detail-card.component.less"],
})
export class LeadDetailCardComponent implements OnInit {
    @Input() referrerName: string;
    @Input() trackingCode: string = "johndavis";
    @Input() dealAmount: string = "";
    @Input() firstVisit: string = "May 23, 2025 22:30";
    @Input() lastModified: string = "May 23, 2025 22:30";

    constructor() {}

    ngOnInit(): void {}
}
