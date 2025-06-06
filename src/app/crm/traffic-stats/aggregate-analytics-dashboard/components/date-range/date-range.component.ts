import { Component, OnInit, AfterViewInit } from "@angular/core";
import Litepicker from "litepicker";

@Component({
    selector: "app-aggregate-analytics-date-range",
    templateUrl: "./date-range.component.html",
    styleUrls: [],
})
export class AggregateAnalyticsDateRangeComponent
    implements AfterViewInit, OnInit
{
    constructor() {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        const picker = new Litepicker({
            element: document.getElementById("litepicker") as HTMLInputElement,
            singleMode: false,
            numberOfMonths: 2,
            numberOfColumns: 2,
            format: "MMM D, YYYY",
            startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
            endDate: new Date(),
            dropdowns: {
                minYear: 2020,
                maxYear: null,
                months: true,
                years: true,
            },
        });
    }
}
