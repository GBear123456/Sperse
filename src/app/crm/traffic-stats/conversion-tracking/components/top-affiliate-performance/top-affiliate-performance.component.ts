import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-top-affiliate-performance",
    templateUrl: "./top-affiliate-performance.component.html",
})
export class TopAffiliatePerformanceComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    affiliates = [
        {
            name: "Sarah Marketing Pro",
            code: "SMP2024",
            conversions: 342,
            rate: 8.7,
            revenue: 68400,
        },
        {
            name: "Digital Growth Hub",
            code: "DGH001",
            conversions: 298,
            rate: 7.2,
            revenue: 59600,
        },
        {
            name: "Traffic Wizard",
            code: "TWZ789",
            conversions: 267,
            rate: 6.8,
            revenue: 53400,
        },
        {
            name: "Convert Masters",
            code: "CM2024",
            conversions: 234,
            rate: 5.9,
            revenue: 46800,
        },
        {
            name: "Lead Generation Co",
            code: "LGC456",
            conversions: 189,
            rate: 4.7,
            revenue: 37800,
        },
    ];

    getCardStyle(index: number): string {
        if (index === 0) return "border-purple-300 bg-purple-50";
        if (index === 1) return "border-yellow-300 bg-yellow-50";
        if (index === 2) return "border-yellow-300 bg-yellow-50";
        return "border-gray-200 bg-white";
    }
}
