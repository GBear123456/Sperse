import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-custom-fields",
    templateUrl: "./custom-fields.component.html",
    styleUrls: ["./custom-fields.component.less"],
})
export class CustomFieldsComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    customFields = Array.from({ length: 5 }).map((_, i) => ({
        label: `Custom Field ${i + 1}`,
        value: "",
        editingLabel: false,
        editingValue: false,
    }));

    trackingKeys = ["Applicant", "Application", "Click Id", "Site Id"];

    enableLabelEdit(index: number) {
        this.customFields[index].editingLabel = true;
    }

    enableValueEdit(index: number) {
        this.customFields[index].editingValue = true;
    }

    saveLabel(index: number, event: Event) {
        const input = (event.target as HTMLInputElement).value.trim();
        if (input) this.customFields[index].label = input;
        this.customFields[index].editingLabel = false;
    }

    saveValue(index: number, event: Event) {
        const input = (event.target as HTMLInputElement).value;
        this.customFields[index].value = input;
        this.customFields[index].editingValue = false;
    }
}
