/** Third party imports */
import * as moment from 'moment';
import { InvoiceStatus } from '@shared/service-proxies/service-proxies';

/** Application imports */
import { InvoiceDueStatus } from './invoices-dto.interface';

export class InvoiceHelpers {
    static getDueInfo(invoiceStatus: InvoiceStatus, invoiceDueGraceDays: number, invoiceDueDate, invoiceDate, l: Function) {
        let todayMoment = moment().endOf('day');

        if (invoiceStatus != InvoiceStatus.Sent && invoiceStatus != InvoiceStatus.PartiallyPaid)
            return null;

        let status: InvoiceDueStatus = null;
        let dateDiffDays: number = null;

        let baseDate = invoiceDueDate ? invoiceDueDate : invoiceDate;
        let momentBaseDate = moment(baseDate);
        dateDiffDays = moment([momentBaseDate.year(), momentBaseDate.month(), momentBaseDate.date()]).endOf('day').diff(todayMoment, 'days');
        if (dateDiffDays >= 0) {
            status = InvoiceDueStatus.InTime;
        }

        if (status == null) {
            if (dateDiffDays + invoiceDueGraceDays >= 0) {
                status = InvoiceDueStatus.Due;
            }
            else {
                status = InvoiceDueStatus.Overdue;
            }
            dateDiffDays = -dateDiffDays;
        }

        let dueStatusMessage: string;
        switch (status) {
            case InvoiceDueStatus.InTime:
                dueStatusMessage = dateDiffDays == 0 ? l('DueStatus_Today') : l('DueStatus_DueIn', dateDiffDays);
                break;
            case InvoiceDueStatus.Due:
            case InvoiceDueStatus.Overdue:
                dueStatusMessage = l('DueStatus_DueFor', dateDiffDays);
                break;
            default:
        }

        return {
            status: status,
            message: dueStatusMessage
        };
    }
}
