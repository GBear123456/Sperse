import { Location } from "@angular/common";
import { Inject, Injectable, Injector, Optional, Renderer2, SkipSelf } from "@angular/core";
import { MAT_DIALOG_SCROLL_STRATEGY, MatDialog, MatDialogConfig, MAT_DIALOG_DEFAULT_OPTIONS } from "@angular/material/dialog";
import { DynamicOverlay } from "./dynamic-overlay";
import { DynamicOverlayContainer } from "./dynamic-overlay-container";

@Injectable()
export class DynamicMatDialog extends MatDialog {

    private _customOverlay: DynamicOverlay;

    constructor(_overlay: DynamicOverlay,
        _injector: Injector,
        @Optional() location: Location,
        @Optional() @Inject(MAT_DIALOG_DEFAULT_OPTIONS) defaultOptions: MatDialogConfig,
        @Inject(MAT_DIALOG_SCROLL_STRATEGY) _scrollStrategy,
        @Optional() @SkipSelf() _parentDialog: DynamicMatDialog,
        overlayContainer: DynamicOverlayContainer) {

        super(_overlay, _injector, location, defaultOptions, _scrollStrategy, _parentDialog, overlayContainer);

        this._customOverlay = _overlay;
    }

    public setContainerElement(containerElement: HTMLElement, renderer: Renderer2): void {

        // need to apply this styling to make the backdrop with position: fixed styling cover only the containerElement
        //renderer.setStyle(containerElement, "transform", "translateZ(0)");

        this._customOverlay.setContainerElement(containerElement);
    }
}
