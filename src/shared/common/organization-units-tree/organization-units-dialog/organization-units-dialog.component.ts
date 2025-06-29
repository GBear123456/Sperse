/** Core imports */
import {
    Component,
    OnInit,
    AfterViewInit,
    Inject,
    ElementRef,
} from "@angular/core";

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { OrganizationUnitsDialogData } from "@shared/common/organization-units-tree/organization-units-dialog/organization-units-dialog-data.interface";
import { AppLocalizationService } from "@app/shared/common/localization/app-localization.service";

@Component({
    templateUrl: "organization-units-dialog.html",
    styleUrls: ["organization-units-dialog.less"],
})
export class OrganizationUnitsDialogComponent implements OnInit, AfterViewInit {
    private slider: any;

    constructor(
        private elementRef: ElementRef,
        public ls: AppLocalizationService,
        public dialogRef: MatDialogRef<OrganizationUnitsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: OrganizationUnitsDialogData
    ) {
        this.dialogRef.beforeClosed().subscribe(() => {
            this.dialogRef.updatePosition({
                top: "157px",
                right: "-100vw",
            });
        });
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest(".slider");
        this.slider.classList.add("hide", "min-width-0", "without-shadow");
        this.dialogRef.updateSize("0px", "0px");
        this.dialogRef.updatePosition({
            top: "155px",
            right: "-100vw",
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove("hide");
            this.dialogRef.updateSize("425px", "calc(100vh - 76px)");
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: "76px",
                    right: "0px",
                });
            }, 100);
        });
    }

    close() {
        this.dialogRef.close(true);
    }
}
