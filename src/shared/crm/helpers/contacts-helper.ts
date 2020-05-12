import { DeleteContactLeadOutput } from '@shared/service-proxies/service-proxies';

export class ContactsHelper {
    static getDeleteErrorMessage(res: DeleteContactLeadOutput) : string {
        let message = '<div style="text-align:left"> Following conditions are preventing delete:<br>';
        if (Object.keys(res.leadErrors).length)
            message += this.getDeleteErrorHtml('Lead', res.leadErrors);
        if (Object.keys(res.contactErrors).length) {
            message += 'Related contact conditions:<br>' + this.getDeleteErrorHtml('Contact', res.contactErrors);
        }
        return message += '</div>';
    }

    private static getDeleteErrorHtml(name, errors: { [key: string]: string[]; }) {
        let result = '<ul>';
        Object.keys(errors).forEach(v => {
            result += `<li>${name} ${v}: ${errors[v].join(', ')}</li>`;
        });
        return result + '</ul>'
    }
}