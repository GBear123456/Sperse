import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-url-agent-panel",
    templateUrl: "./url-agent-panel.component.html",
})
export class UrlAgentPanelComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    entryUrl =
        "https://preview--golden-years-locator.lovable.app/visitor-details?utm_source=google&utm_medium=ppc&utm_campaign=Google&utm_channel=PPC";

    referringUrl = "https://www.referring-domain.com/somepage.php";

    userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";
}
