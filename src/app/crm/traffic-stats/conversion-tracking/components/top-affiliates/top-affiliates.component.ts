import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-top-affiliates",
    templateUrl: "./top-affiliates.component.html",
})
export class TopAffiliatesComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    tabs = [
        { label: "Visits", icon: "users", valueField: "visits" },
        { label: "Conversions", icon: "target", valueField: "conversions" },
        { label: "Revenue", icon: "dollar-sign", valueField: "revenue" },
        { label: "Earnings", icon: "trending-up", valueField: "earnings" },
    ];

    selectedTab = this.tabs[2]; // Default: Revenue

    affiliates = [
        {
            name: "davis",
            visits: 1250,
            conversions: 45,
            revenue: 12500,
            earnings: 2500,
        },
        {
            name: "brown",
            visits: 980,
            conversions: 38,
            revenue: 9800,
            earnings: 1960,
        },
        {
            name: "wilson",
            visits: 850,
            conversions: 32,
            revenue: 8500,
            earnings: 1700,
        },
        {
            name: "jones",
            visits: 720,
            conversions: 28,
            revenue: 7200,
            earnings: 1440,
        },
        {
            name: "smith",
            visits: 650,
            conversions: 25,
            revenue: 6500,
            earnings: 1300,
        },
        {
            name: "jamesome",
            visits: 580,
            conversions: 22,
            revenue: 5800,
            earnings: 1160,
        },
        {
            name: "marktime",
            visits: 520,
            conversions: 20,
            revenue: 5200,
            earnings: 1040,
        },
        {
            name: "ryan54",
            visits: 480,
            conversions: 18,
            revenue: 4800,
            earnings: 960,
        },
        {
            name: "zheng16",
            visits: 450,
            conversions: 17,
            revenue: 4500,
            earnings: 900,
        },
        {
            name: "garcia",
            visits: 420,
            conversions: 16,
            revenue: 4200,
            earnings: 840,
        },
    ];

    selectTab(tab: any) {
        this.selectedTab = tab;
    }
}
