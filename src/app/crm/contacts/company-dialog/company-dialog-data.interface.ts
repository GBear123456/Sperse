import { ContactInfoDto, OrganizationContactInfoDto } from '@shared/service-proxies/service-proxies';
import { EventEmitter } from '@angular/core';

export interface CompanyDialogData {
    company: OrganizationContactInfoDto;
    contactInfo: ContactInfoDto;
    invalidate: EventEmitter<any>;
}