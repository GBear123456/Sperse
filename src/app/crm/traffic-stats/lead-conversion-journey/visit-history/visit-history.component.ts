import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "app-visit-history",
    templateUrl: "./visit-history.component.html",
    styleUrls: ["./visit-history.component.less"],
})
export class VisitHistoryComponent implements OnInit {
    @Input() visits: any[] = [];

    constructor() {}

    ngOnInit(): void {}

    getFlagUrl(code: string): string {
        return code
            ? `https://flagcdn.com/16x12/${code.toLowerCase()}.png`
            : "";
    }
}
