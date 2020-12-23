import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { CommissionDto } from '@app/crm/commission-history/commission-dto';

export const CommissionFields: KeysEnum<CommissionDto> = {
    BuyerAffiliateCode: 'BuyerAffiliateCode',
    BuyerContactId: 'BuyerContactId',
    BuyerEmailAddress: 'BuyerEmailAddress',
    BuyerName: 'BuyerName',
    CommissionAmount: 'CommissionAmount',
    CommissionRate: 'CommissionRate',
    CommissionableAmount: 'CommissionableAmount',
    EarnedDate: 'EarnedDate',
    Id: 'Id',
    InvoiceDate: 'InvoiceDate',
    InvoiceNumber: 'InvoiceNumber',
    InvoiceStatus: 'InvoiceStatus',
    OrderDate: 'OrderDate',
    OrderNumber: 'OrderNumber',
    ProductAmount: 'ProductAmount',
    ProductCode: 'ProductCode',
    ProductName: 'ProductName',
    ResellerAffiliateRate: 'ResellerAffiliateRate',
    ResellerAffiliateCode: 'ResellerAffiliateCode',
    ResellerContactId: 'ResellerContactId',
    ResellerEmailAddress: 'ResellerEmailAddress',
    ResellerName: 'ResellerName',
    Status: 'Status',
    TransactionAuthCode: 'TransactionAuthCode',
    TransactionDate: 'TransactionDate',
    TransactionGatewayName: 'TransactionGatewayName',
    TransactionId: 'TransactionId',
    OrderId: 'OrderId'
};