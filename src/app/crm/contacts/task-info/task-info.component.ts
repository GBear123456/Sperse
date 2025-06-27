import { Component, OnInit } from "@angular/core";
import { AppLocalizationService } from "@app/shared/common/localization/app-localization.service";

@Component({
    selector: "task-info",
    templateUrl: "./task-info.component.html",
    styleUrls: ["./task-info.component.less"],
})
export class TaskInfoComponent implements OnInit {
    constructor(public ls: AppLocalizationService) {}

    ngOnInit(): void {}
}
