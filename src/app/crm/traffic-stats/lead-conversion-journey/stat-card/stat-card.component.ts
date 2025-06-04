import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "app-stat-card",
    templateUrl: "./stat-card.component.html",
    styleUrls: ["./stat-card.component.less"],
})
export class StatCardComponent implements OnInit {
    @Input() icon: string = "";
    @Input() label: string = "";
    @Input() value: string = "";

    constructor() {}
    ngOnInit(): void {}
}
