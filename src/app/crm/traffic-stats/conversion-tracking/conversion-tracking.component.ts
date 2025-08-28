import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-conversion-tracking",
    templateUrl: "./conversion-tracking.component.html",
    styleUrls: ['./conversion-tracking.component.less']
})
export class ConversionTrackingComponent implements OnInit {
    currentDateTime: string;

    constructor() {}

    ngOnInit(): void {
        const now = new Date();
        this.currentDateTime = now.toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }
}
