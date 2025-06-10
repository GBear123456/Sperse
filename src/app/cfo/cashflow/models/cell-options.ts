export class CellOptions {
    classes?: string[] = [];
    parentClasses?: string[] = [];
    attributes?: any = {};
    elementsToAppend?: HTMLElement[] = [];
    childrenSelectorsToRemove?: string[] = [];
    eventListeners?: object = {};
    eventsToTrigger?: string[] = [];
    value?: string = null;
    general?: any = {};
}
