import swal from 'sweetalert';
import extend from 'lodash/extend';
import { Checkbox } from '@shared/crm/helpers/checkbox.interface';

export class ContactsHelper {
    static showConfirmMessage(
        text: string,
        callback: (confirmed: boolean, checkboxesValues: boolean[]) => void,
        checkboxes?: Checkbox[],
        title?: string
    ) {
        let checkboxesContainer, inputs = [];
        if (checkboxes && checkboxes.length) {
            checkboxesContainer = document.createElement('div');
            checkboxesContainer.className = 'checkbox-container';
            checkboxes.forEach((checkBox: Checkbox, index: number) => {
                let checkboxElements;
                if (checkBox.visible) {
                    checkboxElements = ContactsHelper.createCheckbox(checkboxesContainer, checkBox, index);
                    checkboxesContainer.appendChild(checkboxElements.div);
                }
                inputs.push(checkboxElements && checkboxElements.input);
            });
        }
        let opts = extend({}, abp['libs'].sweetAlert.config.confirm, {
            text: text,
            content: checkboxesContainer
        }, title ? {title: title} : {});

        swal(opts).then(confirmed => {
            callback && callback(
                confirmed,
                checkboxes && checkboxes.map((checkbox: Checkbox, index: number) => {
                    return checkbox.visible ? inputs[index] && inputs[index].checked : false;
                })
            );
        });
    }

    static createCheckbox(containerElement, checkbox: Checkbox, index: number): { div: HTMLDivElement, input: HTMLInputElement } {
        let div = document.createElement('div');
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'modal-checkbox-' + index;
        input.checked = checkbox.checked;
        if (checkbox.disabled)
            input.disabled = true;
        div.appendChild(input);
        let label = document.createElement('label');
        label.htmlFor = 'modal-checkbox-' + index;
        const labelTextElement = document.createTextNode(checkbox.text);
        label.appendChild(labelTextElement);
        div.appendChild(label);
        return {
            div: div,
            input: input
        };
    }
}