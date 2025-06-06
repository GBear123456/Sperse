import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-utm-parameters-card",
    templateUrl: "./utm-parameters-card.component.html",
})
export class UtmParametersCardComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    utmParams = [
        { label: "UTM Source", value: "google", icon: "target" },
        { label: "UTM Medium", value: "ppc", icon: "radio" },
        { label: "UTM Content", value: "directory-listing", icon: "tag" },
        { label: "UTM Term", value: "adult-daycare", icon: "tag" },
    ];
}
