export class AppConsts {

    static readonly tenancyNamePlaceHolderInUrl = '{TENANCY_NAME}';
    static readonly tenantHostType = 1;

    static readonly googleMapsApiUrl = 'https://maps.googleapis.com/maps/api/js?key={KEY}&libraries=places&language=en';

    static remoteServiceBaseUrl: string;
    static remoteServiceBaseUrlFormat: string;
    static appBaseUrl: string;
    static appBaseUrlFormat: string;
    static recaptchaSiteKey: string;
    static subscriptionExpireNootifyDayCount: number;

    static localeMappings: any = [];

    static readonly userManagement = {
        defaultAdminUserName: 'admin'
    };

    static readonly localization = {
        defaultLocalizationSourceName: 'Platform',
        CRMLocalizationSourceName: 'CRM',
        CFOLocalizationSourceName: 'CFO'
    };

    static readonly authorization = {
        encrptedAuthTokenName: 'enc_auth_token'
    };

    static readonly grid = {
        defaultPageSize: 10
    };

    static readonly tenantCustomizations = {
        uiCustomizationsGroupName: 'UiCustomizations',
        UiCustomizationsSiteTitleName: 'SiteTitle'
    };

    static readonly PipelinePurposeIds = {
        lead: 'L',
        order: 'O'
    };
}

