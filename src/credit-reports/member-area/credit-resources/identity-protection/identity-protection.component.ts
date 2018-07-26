import {Component, OnInit, Injector} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'app-identity-protection',
    templateUrl: './identity-protection.component.html',
    styleUrls: ['./identity-protection.component.less']
})
export class IdentityProtectionComponent extends AppComponentBase implements OnInit {
    identityList = [
        {
            title: 'FraudTips.net',
            url: 'http://www.fraudtips.net/',
            img: 'assets/images/credit-resources/logos/fraudtips.png',
            imgSrcset: 'assets/images/credit-resources/logos/fraudtips@2x.png 2x, assets/images/credit-resources/logos/fraudtips@3x.png 3x',
            description: 'A collection of tips, articles, and other information related to the prevention of fraud, in particular check fraud.'
        },
        {
            title: 'Annual Credit Report',
            url: 'https://www.annualcreditreport.com/cra/index.jsp',
            img: 'assets/images/credit-resources/logos/annual-credit-report.png',
            imgSrcset: 'assets/images/credit-resources/logos/annual-credit-report@2x.png 2x, assets/images/credit-resources/logos/annual-credit-report@3x.png 3x',
            description: 'By law, consumers are entitled to one free credit report in a twelve month period through this Web site.'
        },
        {
            title: 'Federal Trade Commission',
            url: 'http://www.ftc.gov/bcp/edu/microsites/idtheft/',
            img: 'assets/images/credit-resources/logos/federal-trade-commision.png',
            imgSrcset: 'assets/images/credit-resources/logos/federal-trade-commision@2x.png 2x, assets/images/credit-resources/logos/federal-trade-commision@3x.png 3x',
            description: 'Victims of identity theft may file a complaint with the FTC and take further steps to prevent fraud.'
        },
        {
            title: 'Federal Trade Commission',
            url: 'http://faq.ssa.gov/ics',
            img: 'assets/images/credit-resources/logos/social-security-administration.png',
            imgSrcset: 'assets/images/credit-resources/logos/social-security-administration@2x.png 2x, assets/images/credit-resources/logos/social-security-administration@3x.png 3x',
            description: 'Visit this Web site for next steps should your social security card become lost or stolen.'
        },
        {
            title: 'Internet Fraud Complaint Center',
            url: 'http://ssa-custhelp.ssa.gov/app/answers/list/c/16%2C35/search/1',
            img: 'assets/images/credit-resources/logos/ifcc.png',
            imgSrcset: 'assets/images/credit-resources/logos/ifcc@2x.png 2x, assets/images/credit-resources/logos/ifcc@3x.png 3x',
            description: 'A collaboration between the Federal Bureau of Investigation and the National White Collar Crime Center, this agency addresses fraud committed over the Internet.'
        },
        {
            title: 'United States Postal Service',
            url: 'http://www.usps.com/',
            img: 'assets/images/credit-resources/logos/united-state-postal-service.png',
            imgSrcset: 'assets/images/credit-resources/logos/united-state-postal-service@2x.png 2x, assets/images/credit-resources/logos/united-state-postal-service@3x.png 3x',
            description: 'Consumers can file a mail fraud complaint through USPS for cases of identity theft that involve the US Mail.'
        }
    ];

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }

}
