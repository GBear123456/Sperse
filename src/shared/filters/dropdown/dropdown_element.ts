export class DropDownElement {
    displayName: string = "test";
    displayElementExp: any;
    elements: any;
    selectedElement: any;
    filterField: any;


    onElementSelect: (event, element) => void;
    clearSelectedElement: (filter) => void;   
}
