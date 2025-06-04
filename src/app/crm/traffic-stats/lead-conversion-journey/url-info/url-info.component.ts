import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "app-url-info",
    templateUrl: "./url-info.component.html",
    styleUrls: ["./url-info.component.less"],
})
export class UrlInfoComponent implements OnInit {
    @Input() entryUrl: string =
        "https://preview--golden-years-locator.lovable.app/visitor-details?utm_source=google&utm_medium=ppc&utm_campaign=Google&utm_channel=PPC";
    @Input() referringUrl: string =
        "https://www.referring-domain.com/somepage.php";
    @Input() userAgent: string =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

    constructor() {}

    ngOnInit(): void {}
}
