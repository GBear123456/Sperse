export class FilterDropDownModel {
    displayName: string = "test";
    displayElementExp: any;
    elements: any;
    selectedElement: any;
    filterField: any;


    onElementSelect: (event, element) => void;
    clearSelectedElement: (filter) => void;   
}
