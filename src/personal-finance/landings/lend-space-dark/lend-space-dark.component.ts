import {Component, ChangeDetectionStrategy, AfterViewInit, Injector} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'app-lend-space-dark',
    templateUrl: './lend-space-dark.component.html',
    styleUrls: ['./lend-space-dark.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LendSpaceDarkComponent extends AppComponentBase implements AfterViewInit {
    currentDate = new Date();
    faq = [
        {title: 'How quickly will my loan be approved?', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'},
        {title: 'How will I get a response from the lenders?', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'},
        {title: 'Does CreditSoup® charge me anything for using their service?', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'},
        {title: 'What should I be expecting after I submit my application for a loan?', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'},
        {title: 'Are there any hidden fees associated with applying online at CreditSoup®?', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'},
        {title: 'Will the lender require any documentation prior to closing my loan?', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'},
        {title: 'What is the interest rate?', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'}
    ];
    buttons = [
        {title: 'Credit Card', description: 'I want to get my'},
        {title: 'Personal Loan', description: 'I want to apply for a'},
        {title: 'Credit Score', description: 'I want to get my free'}
    ];
    features = [
        {
            imgClass: 'credit-score',
            title: 'Credit Scores',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse.'
        },
        {
            imgClass: 'credit-cards',
            title: 'Credit Cards',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse.'
        },
        {
            imgClass: 'retirement-planning',
            title: 'Retirement Planning',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse.'
        },
        {
            imgClass: 'personal-loans',
            title: 'Personal Loans',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse.'
        },
        {
            imgClass: 'business-loans',
            title: 'Business Loans',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse.'
        },
        {
            imgClass: 'get-debt-free',
            title: 'Get Debt Free',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse.'
        }
    ];

    constructor(
        injector: Injector,
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
    }
}
