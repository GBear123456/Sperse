import { OverlayContainer } from "@angular/cdk/overlay";
import { Injectable } from "@angular/core";

@Injectable()
export class DynamicOverlayContainer extends OverlayContainer {

    public setContainerElement(containerElement: HTMLElement): void {
        this._containerElement = containerElement;
    }

    protected _createContainer(): void {
        const container = this._document.createElement('div');
        container.classList.add('custom-overlay-container');

        this._document.body.appendChild(container);
        this._containerElement = container;
    }
}
