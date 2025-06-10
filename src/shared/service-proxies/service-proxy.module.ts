import { NgModule } from '@angular/core';
import * as ApiServiceProxies from './service-proxies';

@NgModule({
    providers: [
        ApiServiceProxies.ContactAddressServiceProxy,
        ApiServiceProxies.ContactEmailServiceProxy,
        ApiServiceProxies.ContactPhoneServiceProxy,
        ApiServiceProxies.ContactLinkServiceProxy,
        ApiServiceProxies.AuditLogServiceProxy,
        ApiServiceProxies.CachingServiceProxy,
        ApiServiceProxies.ChatServiceProxy,
        ApiServiceProxies.CommonLookupServiceProxy,
        ApiServiceProxies.EditionServiceProxy,
        ApiServiceProxies.FriendshipServiceProxy,
        ApiServiceProxies.HostSettingsServiceProxy,
        ApiServiceProxies.LanguageServiceProxy,
        ApiServiceProxies.NotificationServiceProxy,
        ApiServiceProxies.OrganizationUnitServiceProxy,
        ApiServiceProxies.PermissionServiceProxy,
        ApiServiceProxies.ProfileServiceProxy,
        ApiServiceProxies.RoleServiceProxy,
        ApiServiceProxies.SessionServiceProxy,
        ApiServiceProxies.TenantServiceProxy,
        ApiServiceProxies.TenantSettingsServiceProxy,
        ApiServiceProxies.TenantCustomizationServiceProxy,
        ApiServiceProxies.TimingServiceProxy,
        ApiServiceProxies.UserServiceProxy,
        ApiServiceProxies.UserLinkServiceProxy,
        ApiServiceProxies.UserLoginServiceProxy,
        ApiServiceProxies.WebLogServiceProxy,
        ApiServiceProxies.AccountServiceProxy,
        ApiServiceProxies.TokenAuthServiceProxy,
        ApiServiceProxies.HostDashboardServiceProxy,
        ApiServiceProxies.PaymentServiceProxy,
        ApiServiceProxies.InvoiceServiceProxy,
        ApiServiceProxies.TenantPaymentSettingsServiceProxy,
        ApiServiceProxies.LocalizationServiceProxy,
        ApiServiceProxies.PersonContactServiceProxy,
        ApiServiceProxies.MemberSubscriptionServiceProxy,
        ApiServiceProxies.MemberSettingsServiceProxy,
        ApiServiceProxies.CommissionServiceProxy,
        ApiServiceProxies.TenantHostServiceProxy,
        ApiServiceProxies.EmailSettingsTestServiceProxy,
        ApiServiceProxies.GoogleServiceProxy,
        ApiServiceProxies.EmailTemplateServiceProxy
    ]
})
export class ServiceProxyModule { }
