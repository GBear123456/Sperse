import { 
    Globe, 
    Palette, 
    Globe2, 
    Zap, 
    BookOpen, 
    Puzzle, 
    Building2, 
    Mail, 
    CreditCard, 
    Megaphone, 
    Settings,
    Linkedin,
    Facebook,
    Mail as GmailIcon,
    Server,
    FileText,
    Users,
    Shield,
    Cloud,
    Briefcase,
    FileSpreadsheet,
    Users2,
    CreditCard as SubscriptionIcon,
    Coins,
    UserCircle,
    KeyRound,
    SendHorizontal,
    FileSignature,
    User
  } from "lucide-angular";
import { GeneralSettingsComponent } from "../shared/general-settings/general-settings.component";
import { AppearanceSettingsComponent } from "../shared/appearance-settings/appearance-settings.component";
import { DomainSettingsComponent } from "../shared/domain-settings/domain-settings.component";
import { EmailSettingsComponent } from "../shared/email-settings/email-settings.component";
import { PaypalSettingsComponent } from "../shared/paypal-settings/paypal-settings.component";
import { StripeSettingsComponent } from "../shared/stripe-settings/stripe-settings.component";
import { BankTransferComponent } from "@root/shared/common/tenant-settings-wizard/bank-transfer/bank-transfer.component";
import { BankSettingsComponent } from "../shared/bank-settings/bank-settings.component";
import { PersonalSettingsComponent } from "../shared/personal-settings/personal-settings.component";
import { LandingPageComponent } from "@root/shared/common/tenant-settings-wizard/landing-page/landing-page.component";
import { DocumentsComponent } from "@app/crm/documents/documents.component";
import { ZapierComponent } from "@root/shared/common/zapier/zapier.component";
import { InvoiceSettingsComponent } from "@root/shared/common/tenant-settings-wizard/invoice-settings/invoice-settings.component";
import { CommissionsComponent } from "@root/shared/common/tenant-settings-wizard/commissions/commissions.component";
import { OtherSettingsComponent } from "@root/shared/common/tenant-settings-wizard/other-settings/other-settings.component";
import { CreditsSettingsComponent } from "@root/shared/common/tenant-settings-wizard/credits-settings/credits-settings.component";
import { TrackingToolsSettingsComponent } from "../shared/tracking-tools-settings/tracking-tools-settings.component";
import { KlaviyoSettingsComponent } from "../shared/klaviyo-settings/klaviyo-settings.component";
import { MailchimpSettingsComponent } from "../shared/mailchimp-settings/mailchimp-settings.component";
import { SendgridSettingsComponent } from "../shared/sendgrid-settings/sendgrid-settings.component";
import { IAgeSettingsComponent } from "../shared/iage-settings/iage-settings.component";
import { OngageSettingsComponent } from "../shared/ongage-settings/ongage-settings.component";
import { YTelSettingsComponent } from "../shared/ytel-settings/ytel-settings.component";
import { UserManagementSettingsComponent } from "../shared/user-management-settings/user-management-settings.component";
import { SecuritySettingsComponent } from "../shared/security-settings/security-settings.component";
import { BugsnagSettingsComponent } from "../shared/bugsnag-settings/bugsnag-settings.component";
import { TenantManagementSettingsComponent } from "../shared/tenant-management-settings/tenant-management-settings.component";
import { LinkedInSettingsComponent } from "../shared/linkedin-settings/linkedin-settings.component";
import { FacebookSettingsComponent } from "../shared/facebook-settings/facebook-settings.component";
import { GoogleSettingsComponent } from "../shared/google-settings/google-settings.component";
import { DiscordSettingsComponent } from "../shared/discord-settings/discord-settings.component";

export interface MenuItem {
    id: string;
    label: string;
    icon?: string;
    iconComponent?: any;
    path?: string;
    searchAliases?: string[];
    submenu?: MenuItem[];
    component?: any;
    data?: any;
  }
  
  export const mainNavigation: MenuItem[] = [
    {
      id: "personal",
      label: "Personal Settings",
      path: "personal",
      iconComponent: UserCircle,
      searchAliases: ["user settings", "account settings", "my account", "profile settings"],
      component: PersonalSettingsComponent,
    },
    {
        id: "localization",
        label: "Localization Settings",
        path: "localization",
        iconComponent: Globe,
        searchAliases: ["language", "region", "timezone", "international", "locale", "i18n", "translation"],
        component: GeneralSettingsComponent
    },
    {
        id: "appearance",
        label: "Appearance Settings",
        path: "appearance",
        iconComponent: Palette,
        searchAliases: ["theme", "ui", "look and feel", "colors", "styling", "visual", "dark mode", "light mode"],
        component: AppearanceSettingsComponent
    },
    {
        id: "domains",
        label: "Domains & SSL",
        path: "domains",
        iconComponent: Globe2,
        searchAliases: ["dns", "custom domain", "ssl certificate", "https", "tls", "website address", "url"],
        component: DomainSettingsComponent
    },
    {
        id: "payment",
        label: "Payment Providers",
        path: "payment",
        iconComponent: CreditCard,
        searchAliases: ["payment gateways", "payment methods", "payment processors", "online payments"],
        submenu: [
            { 
              id: "paypal", 
              label: "PayPal", 
              path: "payment/paypal",
              searchAliases: ["paypal checkout", "paypal payments"],
              component: PaypalSettingsComponent
            },
            { 
              id: "stripe", 
              label: "Stripe", 
              path: "payment/stripe",
              searchAliases: ["stripe checkout", "stripe payments", "credit card processor"],
              component: StripeSettingsComponent
            },
            { 
              id: "authorize", 
              label: "Authorize.Net", 
              path: "payment/authorize",
              searchAliases: ["authorize net", "auth net"],
            },
            { 
              id: "razorpay", 
              label: "RazorPay", 
              path: "payment/razorpay",
              searchAliases: ["razor", "india payments"],
            },
            { 
              id: "paystack", 
              label: "PayStack", 
              path: "payment/paystack",
              searchAliases: ["africa payments"],
            },
            { 
              id: "adyen", 
              label: "Adyen", 
              path: "payment/adyen",
              searchAliases: ["adyen payments", "global payments"],
            },
            { 
              id: "mollie", 
              label: "Mollie", 
              path: "payment/mollie",
              searchAliases: ["european payments", "eu payments"],
            },
            { 
              id: "coinbase", 
              label: "Coinbase", 
              path: "payment/coinbase",
              searchAliases: ["crypto", "bitcoin", "cryptocurrency", "blockchain payments"],
            },
            { 
              id: "zelle", 
              label: "Zelle", 
              path: "payment/zelle",
              searchAliases: ["bank transfers", "instant transfers"],
            },
            { 
              id: "ach", 
              label: "ACH Bank Transfer", 
              path: "payment/ach",
              searchAliases: ["bank transfer", "direct deposit", "electronic transfer", "automated clearing house"],
              component: BankTransferComponent
            },
            { 
              id: "wire", 
              label: "Wire Transfer Instructions", 
              path: "payment/wire",
              searchAliases: ["swift", "bank wire", "international transfer", "bank instructions"],
              component: BankSettingsComponent
            },
            { 
              id: "other", 
              label: "Other 100+ Providers", 
              path: "payment/other",
              searchAliases: ["additional payment methods", "alternative payments", "more payment options"],
            }
        ]
    },
    {
      id: "email",
      label: "Email Providers",
      path: "email",
      iconComponent: Mail,
      searchAliases: ["mail providers", "email services", "smtp providers", "email connections"],
      component: EmailSettingsComponent,
      submenu: [
        { 
          id: "gmail", 
          label: "Gmail", 
          path: "email/gmail", 
          iconComponent: GmailIcon,
          searchAliases: ["google mail", "google workspace email"],
        },
        { 
          id: "system", 
          label: "System Email", 
          path: "email/system", 
          iconComponent: Server,
          searchAliases: ["default email", "app email", "system notifications"],
        },
        { 
          id: "hotmail", 
          label: "Outlook (Hotmail)", 
          path: "email/hotmail",
          searchAliases: ["microsoft mail", "hotmail", "outlook.com", "microsoft 365 email"],
        },
        { 
          id: "yahoo", 
          label: "Yahoo", 
          path: "email/yahoo",
          searchAliases: ["yahoo mail", "ymail"],
        },
        { 
          id: "migadu", 
          label: "Migadu", 
          path: "email/migadu",
          searchAliases: ["migadu mail"],
        },
        { 
          id: "mandrill", 
          label: "Mandrill", 
          path: "email/mandrill",
          searchAliases: ["mailchimp transactional", "mailchimp mandrill"],
        },
        { 
          id: "mailtrap", 
          label: "Mailtrap", 
          path: "email/mailtrap",
          searchAliases: ["email testing", "email sandbox"],
        },
        { 
          id: "aol", 
          label: "AOL", 
          path: "email/aol",
          searchAliases: ["aol mail", "america online"],
        },
        { 
          id: "proton", 
          label: "ProtonMail", 
          path: "email/proton",
          searchAliases: ["proton", "encrypted email", "secure email"],
        },
        { 
          id: "zoho", 
          label: "Zoho Mail", 
          path: "email/zoho",
          searchAliases: ["zoho email", "zoho workplace"],
        },
        { 
          id: "other", 
          label: "Other Mail Provider", 
          path: "email/other",
          searchAliases: ["custom mail provider", "generic smtp"],
        }
      ]
    },
    {
      id: "ai",
      label: "AI Platforms",
      path: "ai",
      iconComponent: Zap,
      searchAliases: ["artificial intelligence", "machine learning", "ml", "ai integration", "chatbots"],
      submenu: [
        { 
          id: "openai", 
          label: "Open AI", 
          path: "ai/openai",
          searchAliases: ["gpt", "chatgpt", "davinci", "openai api", "gpt-4", "gpt-3"],
        },
        { 
          id: "claude", 
          label: "Anthropic Claude", 
          path: "ai/claude",
          searchAliases: ["anthropic", "claude ai", "claude api"],
        },
        { 
          id: "gemini", 
          label: "Google Gemini", 
          path: "ai/gemini",
          searchAliases: ["google ai", "bard", "gemini api", "google llm"],
        }
      ]
    },
    {
      id: "content",
      label: "Content & Publishing",
      path: "content",
      iconComponent: BookOpen,
      searchAliases: ["landing page", "checkout pages", "affiliate pages", "subscribe pages", "client portal", "privacy", "files"],
      submenu: [
        { id: "landing", label: "Landing Page", path: "content/landing", component: LandingPageComponent },
        { id: "checkout", label: "Checkout Pages", path: "content/checkout" },
        { id: "affiliate-signup", label: "Affiliate Pages", path: "content/affiliate-signup" },
        { id: "subscribe", label: "Subscribe & Unsubscribe", path: "content/subscribe" },
        { id: "client-portal", label: "Client Portal Settings", path: "content/client-portal" },
        { id: "privacy", label: "Privacy & Terms", path: "content/privacy" },
        { id: "files", label: "File Manager", path: "content/files", component: DocumentsComponent }
      ]
    },
    {
      id: "integration",
      label: "Integration Apps",
      path: "integration",
      iconComponent: Puzzle,
      searchAliases: ["connections", "third-party", "app connections", "integrations", "api connections"],
      submenu: [
        { 
            id: "zapier", 
            label: "Zapier", 
            path: "integration/zapier",
            searchAliases: ["zaps", "automation"],
            component: ZapierComponent
        },
        { 
            id: "make", 
            label: "Make", 
            path: "integration/make",
            searchAliases: ["integromat", "make.com", "scenarios"],
        },
        { 
            id: "activepieces", 
            label: "Active Pieces", 
            path: "integration/activepieces",
            searchAliases: ["workflow"],
        },
        { 
            id: "n8n", 
            label: "n8n", 
            path: "integration/n8n",
            searchAliases: ["workflow automation", "n8n.io"],
        }
      ]
    },
    {
      id: "business",
      label: "Business Settings",
      path: "business",
      iconComponent: Building2,
      searchAliases: ["company", "org", "organization", "business info"],
      submenu: [
        { 
            id: "invoice", 
            label: "Invoice Settings", 
            path: "business/invoice", 
            iconComponent: FileSpreadsheet,
            searchAliases: ["billing", "invoices", "receipts", "invoice templates"],
            component: InvoiceSettingsComponent
        },
        { 
            id: "affiliate", 
            label: "Affiliate Program", 
            path: "business/affiliate", 
            iconComponent: Users2,
            searchAliases: ["referrals", "partners", "affiliates", "commission", "referral program"],
            component: CommissionsComponent
        },
        { 
            id: "subscription", 
            label: "Subscription Billing", 
            path: "business/subscription", 
            iconComponent: SubscriptionIcon,
            searchAliases: ["recurring billing", "subscriptions", "plans", "pricing plans"],
            component: OtherSettingsComponent
        },
        { 
            id: "credits", 
            label: "User Credits", 
            path: "business/credits", 
            iconComponent: Coins,
            searchAliases: ["points", "balance", "wallet", "virtual currency"],
            component: CreditsSettingsComponent
        }
      ]
    },
    {
      id: "marketing",
      label: "Marketing Services",
      path: "marketing",
      iconComponent: Megaphone,
      searchAliases: ["marketing tools", "promotion", "campaigns", "email marketing"],
      submenu: [
        { 
            id: "tracking", 
            label: "Tracking Tools", 
            path: "marketing/tracking",
            searchAliases: ["email campaigns", "newsletter"],
            component: TrackingToolsSettingsComponent
        },
        { 
          id: "mailchimp", 
          label: "MailChimp", 
          path: "marketing/mailchimp",
          searchAliases: ["email campaigns", "newsletter"],
          component: MailchimpSettingsComponent
        },
        { 
            id: "klaviyo", 
            label: "Klaviyo", 
            path: "marketing/klaviyo",
            searchAliases: ["email automation", "ecommerce marketing"],
            component: KlaviyoSettingsComponent
        },
        { 
            id: "sendgrid", 
            label: "SendGrid", 
            path: "marketing/sendgrid",
            searchAliases: ["twilio sendgrid", "email delivery"],
            component: SendgridSettingsComponent
        },
        { 
            id: "iage", 
            label: "iAge", 
            path: "marketing/iage",
            searchAliases: ["iage marketing"],
            component: IAgeSettingsComponent
        },
        { 
            id: "ongage", 
            label: "Ongage", 
            path: "marketing/ongage",
            searchAliases: ["email marketing platform"],
            component: OngageSettingsComponent
        },
        { 
            id: "ytel", 
            label: "YTel SMS", 
            path: "marketing/ytel",
            searchAliases: ["sms marketing", "text messaging", "sms campaigns"],
            component: YTelSettingsComponent
        }
      ]
    },
    {
      id: "advanced",
      label: "Advanced Settings",
      path: "advanced",
      iconComponent: Settings,
      searchAliases: ["developer settings", "technical settings", "expert settings", "system settings"],
      submenu: [
        { 
            id: "tenant", 
            label: "Tenant Management", 
            path: "advanced/tenant", 
            iconComponent: Briefcase,
            searchAliases: ["multi-tenancy", "organizations", "workspaces", "teams"],
            component: TenantManagementSettingsComponent
        },
        { 
            id: "registration", 
            label: "User Registration", 
            path: "advanced/registration", 
            iconComponent: Users,
            searchAliases: ["user signup", "account creation", "onboarding"],
            component: UserManagementSettingsComponent
        },
        { 
            id: "security", 
            label: "Security", 
            path: "advanced/security", 
            iconComponent: Shield,
            searchAliases: ["password policy", "access control", "permissions", "authentication"],
            component: SecuritySettingsComponent
        },
        { 
            id: "insights", 
            label: "Insight Hub (BugSnag)", 
            path: "advanced/insights", 
            iconComponent: Cloud,
            searchAliases: ["error tracking", "monitoring", "bugsnag", "analytics", "logs"],
            component: BugsnagSettingsComponent
        },
        { 
          id: "oauth", 
          label: "oAuth Providers",
          path: "advanced/oauth",
          searchAliases: ["social login", "single sign-on", "sso", "social authentication", "third-party login"],
          submenu: [
            { 
              id: "linkedin", 
              label: "LinkedIn", 
              path: "advanced/oauth/linkedin", 
              iconComponent: Linkedin,
              searchAliases: ["linkedin login", "linkedin auth", "professional network login"],
              component: LinkedInSettingsComponent
            },
            { 
              id: "facebook", 
              label: "Facebook", 
              path: "advanced/oauth/facebook", 
              iconComponent: Facebook,
              searchAliases: ["facebook login", "fb login", "meta login"],
              component: FacebookSettingsComponent
            },
            { 
              id: "google", 
              label: "Google", 
              path: "advanced/oauth/google",
              searchAliases: ["google login", "gmail login", "google account"],
              component: GoogleSettingsComponent
            },
            { 
              id: "discord", 
              label: "Discord", 
              path: "advanced/oauth/discord",
              searchAliases: ["discord login", "discord auth", "gaming platform"],
              component: DiscordSettingsComponent
            }
          ]
        }
      ]
    }
  ];
  