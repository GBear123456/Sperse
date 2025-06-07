import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-custom-fields-tracking",
    templateUrl: "./custom-fields-tracking.component.html",
})
export class CustomFieldsTrackingComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    customFields = Array.from({ length: 5 }).map((_, i) => ({
        label: `Custom Field ${i + 1}`,
        value: "",
        editingLabel: false,
        editingValue: false,
    }));

    trackingFields = [
        { label: "Applicant", value: "", editingValue: false },
        { label: "Application", value: "", editingValue: false },
        { label: "Click Id", value: "", editingValue: false },
        { label: "Site Id", value: "", editingValue: false },
    ];

    startEditing(field: any, target: "label" | "value") {
        field[`editing${this.capitalize(target)}`] = true;
    }

    stopEditing(
        field: any,
        target: "label" | "value",
        event: FocusEvent | KeyboardEvent
    ) {
        const input = event.target as HTMLInputElement;
        field[target] = input.value.trim();
        field[`editing${this.capitalize(target)}`] = false;
    }

    capitalize(text: string): string {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
}
