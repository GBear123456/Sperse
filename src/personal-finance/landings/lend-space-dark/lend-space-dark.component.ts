import {Component, ChangeDetectionStrategy, AfterViewInit, Injector, Renderer2, OnDestroy} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'app-lend-space-dark',
    templateUrl: './lend-space-dark.component.html',
    styleUrls: ['./lend-space-dark.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LendSpaceDarkComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    faq = [
        {title: 'How quickly will my loan be approved?', text: 'Every lender has their own procedures for processing loans. The best way to understand the loan process and the time it will take is to contact the specific lender that you applied for a loan with. They will be able to keep you updated on loan processing times.'},
        {title: 'How will I receive responses from lenders?', text: 'Depending on which lender you chose to work with and your preferences, a lender will contact you through your account, by email, by telephone or by postal mail.'},
        {title: 'Does LendSpace™ charge me anything for using this service?', text: 'LendSpace does not charge a fee for its standard services.'},
        {title: 'What should I be expecting after I submit my application for a loan?', text: 'The best way to understand the loan process is to contact the specific lender that you applied for a loan with. They will be able to walk you through the whole process and let you know what to expect.'},
        {title: 'Will the lender require any documentation prior to closing on my loan?', text: 'You’re almost there! Most lenders require past pay stubs, bank statements, information on debts and a copy of your tax return. Closing document requirements can vary depending on your location. Be sure to understand your specific lenders closing requirements.'},
        {title: 'What is the interest rate?', text: 'Interest rates vary based on employment, credit history, debt-to-income ratio, etc. Each lender has their own specific requirements that potential consumers need to meet before they can offer their services. LendSpace strives to help connect our consumer’s needs with lenders who can fulfill those needs.'}
    ];
    buttons = [
        {title: 'Credit Card', description: 'I want to get a'},
        {title: 'Personal Loan', description: 'I want to apply for a'},
        {title: 'Credit Score', description: 'I want to get my free'}
    ];
    features = [
        {
            imgClass: 'credit-score',
            title: 'Credit Scores',
            text: 'Credit is important. In addition to free credit scores, with LendSpace you will be able to see what might be affecting your credit scores and reports.'
        },
        {
            imgClass: 'credit-cards',
            title: 'Credit Cards',
            text: 'Finding the right credit card can help you build your credit and accumulate credit history.'
        },
        {
            imgClass: 'retirement-planning',
            title: 'Retirement Planning',
            text: 'Planning for retirement can be tough. LendSpace gives you access to the tools that will help you plan for your future.'
        },
        {
            imgClass: 'personal-loans',
            title: 'Personal Loans',
            text: 'Sometimes you need money now. Finding the right personal loan can be difficult. We are here to make it easier on you.'
        },
        {
            imgClass: 'business-loans',
            title: 'Business Loans',
            text: 'Have a dream of opening your own business? We believe in you. LendSpace will connect you with lenders who believe in you too.'
        },
        {
            imgClass: 'get-debt-free',
            title: 'Get Debt Free',
            text: 'LendSpace offers access to debt consolidation services which can help you get debt free.'
        }
    ];

    constructor(
        injector: Injector,
        private renderer: Renderer2
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        this.renderer.addClass(document.body, 'lending-page');
    }

    ngOnDestroy() {
        this.renderer.removeClass(document.body, 'lending-page');
    }
}
