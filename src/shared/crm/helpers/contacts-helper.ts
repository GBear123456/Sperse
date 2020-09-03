import swal from 'sweetalert';
import extend from 'lodash/extend';

export class ContactsHelper {
    static showConfirmMessage(
        text: string,
        actionText: string,
        callback: (confirmed: boolean, force: boolean) => void,
        canForceAction: boolean,
        title?: string
    ) {
        let content, input;
        if (canForceAction) {
            content = document.createElement('div');
            content.className = 'checkbox-container';

            input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'modal-checkbox';
            input.checked = true;
            content.appendChild(input);

            let label = document.createElement('label');
            label.htmlFor = 'modal-checkbox';
            const labelTextElement = document.createTextNode(actionText);
            label.appendChild(labelTextElement);
            content.appendChild(label);
        }

        let opts = extend({}, abp['libs'].sweetAlert.config.confirm, {
            text: text,
            content: content
        }, title ? {title: title} : {});

        swal(opts).then(confirmed => { callback && callback(confirmed, canForceAction ? input.checked : false); });
    }
}