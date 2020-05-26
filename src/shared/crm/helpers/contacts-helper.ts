import swal from 'sweetalert';
import extend from 'lodash/extend';

export class ContactsHelper {
    static showConfirmMessage(text: string, labelText: string, callback: (confirmed: boolean, forceDelete: boolean) => void, canForceDelete: boolean) {
        let content, input;
        if (canForceDelete) {
            content = document.createElement("div");
            content.className = "checkbox-container";

            input = document.createElement("input");
            input.type = "checkbox";
            input.id = "modal-checkbox";
            content.appendChild(input);

            let label = document.createElement("label");
            label.htmlFor = 'modal-checkbox';
            const labelTextElement = document.createTextNode(labelText);
            label.appendChild(labelTextElement);
            content.appendChild(label);
        }

        let opts = extend({}, abp['libs'].sweetAlert.config.confirm, {
            text: text,
            content: content
        })

        swal(opts).then((isConfirmed) => { callback && callback(isConfirmed, canForceDelete ? input.checked : false); });
    }
}