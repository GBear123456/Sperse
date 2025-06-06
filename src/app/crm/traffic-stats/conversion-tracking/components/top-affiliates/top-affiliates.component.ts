import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-top-affiliates",
    templateUrl: "./top-affiliates.component.html",
})
export class TopAffiliatesComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    tabs = [
        { label: "Visits", icon: "users" },
        { label: "Conversions", icon: "target" },
        { label: "Revenue", icon: "dollar-sign" },
        { label: "Earnings", icon: "trending-up" },
    ];

    selectedTab = this.tabs[2]; // Default: Revenue

    affiliates = [
        "davis",
        "brown",
        "wilson",
        "jones",
        "smith",
        "jamesome",
        "marktime",
        "ryan54",
        "zheng16",
        "garcia",
    ];

    selectTab(tab: any) {
        this.selectedTab = tab;
        // TODO: update data based on selection
    }
}
