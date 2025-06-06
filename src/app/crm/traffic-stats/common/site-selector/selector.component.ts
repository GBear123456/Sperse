import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-traffic-stats-site-selector",
    templateUrl: "./selector.component.html",
})
export class AggregateAnalyticsSelectorComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    dropdownOpen = false;
    selectedSite = "All Sites";
    sites = ["All Sites", "Main Site", "Landing Page A", "Landing Page B"];

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }

    selectSite(site: string) {
        this.selectedSite = site;
        this.dropdownOpen = false;
    }
}
