import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "app-utm-parameters-card",
    templateUrl: "./utm-parameters-card.component.html",
    styleUrls: ["./utm-parameters-card.component.less"],
})
export class UtmParametersCardComponent implements OnInit {
    @Input() campaign: string = "";
    @Input() channel: string = "";
    @Input() source: string = "";
    @Input() medium: string = "";
    @Input() content: string = "";
    @Input() term: string = "";

    constructor() {}

    ngOnInit(): void {}
}
