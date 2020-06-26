/** Core imports */
import { Component, ElementRef, HostListener } from '@angular/core';

/** Third party imports */
import { Observable, zip } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'resources',
    templateUrl: 'resources.component.html',
    styleUrls: ['resources.component.less']
})
export class ResourcesComponent {
    isClicked = 0;
    data$: Observable<any> = zip(
        this.profileService.checkServiceSubscription(BankCodeServiceType.BANKAffiliate),
        this.profileService.checkServiceSubscription(BankCodeServiceType.BANKTrainer)
    ).pipe(
        map(([hasAffiliateSubscription, hasTrainerSubscription]: [boolean, boolean]) => {
            return (hasAffiliateSubscription || hasTrainerSubscription ? [
                {
                    categoryName: 'AR TOOLS',
                    anchor: 'marketing',
                    list: [
                        {
                            title: 'Akzidenz Berthold Font',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Marketing+Materials/Akzidenz+Berthold+Font.zip',
                            img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/Akzidenz_Berthold_Font.png'
                        },
                        {
                            title: 'Aviano Font',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Marketing+Materials/Aviano+Font.zip',
                            img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/Aviano_Sans_Font.png'
                        },
                        {
                            title: 'BANK Style Guide',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Marketing+Materials/BANK+Style+Guide.zip',
                            img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/BANK_Style_Guide.png'
                        },
                        {
                            title: 'CODEBREAKER Style Guide',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Marketing+Materials/BANKCODE+Style+Guide.zip',
                            img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/CODEBREAKER_Style_Guide.png'
                        },
                        {
                            title: 'Media Kit',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Media+Kit/Media+Kit.pdf',
                            img: './assets/common/images/bank-code/thumbnails/affiliate-marketing-tools/Media_Kit.png'
                        },
                        {
                            title: 'AR Tools',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Affiliate+Supplies/Affiliate+Supplies.pdf',
                            img: './assets/common/images/bank-code/no_image.png'
                        }
                    ]
                },
                {
                    categoryName: 'FINANCING',
                    anchor: 'fin',
                    list: [
                        {
                            title: 'ATM Workbook',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Finance/ATM+Workbook.pdf',
                            img: './assets/common/images/bank-code/thumbnails/ATM.png'
                        },
                        {
                            title: 'Codebreaker Financing Program',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Finance/BANKCODE+Financing+Program.pdf',
                            img: './assets/common/images/bank-code/thumbnails/CreditApproval.png'
                        },
                        {
                            title: 'Seed Overview Slides',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Finance/SEED+OVERVIEW+SLIDES+V.2.0.pptx',
                            img: './assets/common/images/bank-code/thumbnails/SeedCapital.png'
                        }
                    ]
                },
                {
                    categoryName: 'GRAPHICS & MEDIA',
                    anchor: 'graph',
                    list: [
                        {
                            title: 'BANK Logos',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/BANK+Logos.zip',
                            img: './assets/common/images/bank-code/thumbnails/BANK-Logos.png'
                        },
                        {
                            title: 'Codebreaker Logos',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/BANKCODE+Logos.zip',
                            img: './assets/common/images/bank-code/thumbnails/Codebreaker-Logos.png'
                        },
                        {
                            title: 'One World One Language',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/One+World+One+Language.zip',
                            img: './assets/common/images/bank-code/thumbnails/One_World.png'
                        },
                        {
                            title: 'Why They Buy Graphic',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Why+They+Buy.zip',
                            img: './assets/common/images/bank-code/thumbnails/Why_They_Buy_Ad.png'
                        },
                        {
                            title: '300%',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/300%25.zip',
                            img: './assets/common/images/bank-code/thumbnails/social-media-ads/300.png'
                        },
                        {
                            title: '90 Seconds',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/90_Sec.zip',
                            img: './assets/common/images/bank-code/thumbnails/social-media-ads/90_Seconds.png'
                        },
                        {
                            title: 'Holiday Promotions',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/Holiday+Promotions.zip',
                            img: './assets/common/images/bank-code/thumbnails/social-media-ads/Holiday_Promotions.png'
                        },
                        {
                            title: 'One World',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/One+World.zip',
                            img: './assets/common/images/bank-code/thumbnails/social-media-ads/One_World.png'
                        },
                        {
                            title: 'Read The Digital Book',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/Read+the+digital+book.zip',
                            img: './assets/common/images/bank-code/thumbnails/social-media-ads/Read_The_Digital_Book.png'
                        },
                        {
                            title: 'What\'s Your BANKCODE',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/What\'s+your+BANK+code.zip',
                            img: './assets/common/images/bank-code/thumbnails/social-media-ads/What_Your_BANK_Code.png'
                        },
                        {
                            title: 'Why They Buy Ad',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Art_Graphics/Social+Media+Ads/Why+They+Buy.zip',
                            img: './assets/common/images/bank-code/thumbnails/social-media-ads/Why_They_Buy_Ad.png'
                        }
                    ]
                },
                {
                    categoryName: 'LEGAL DOCUMENTS',
                    anchor: 'legal',
                    list: [
                        {
                            title: '2019 BANKCODE Compensation Plan',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Compensation+Plan/Compensation+Plan+-+September+2019.pdf',
                            img: './assets/common/images/bank-code/thumbnails/legal-documents/Compensation_Plan.png'
                        },
                        {
                            title: 'BANKCODE E-Sign Consent',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+E-Sign+_+Consent.pdf',
                            img: './assets/common/images/bank-code/thumbnails/legal-documents/E_Sign_Consent.png'
                        },
                        {
                            title: 'BANKCODE IMA Application and Agreement',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+IMA+Application+and+Agreement.pdf',
                            img: './assets/common/images/bank-code/thumbnails/legal-documents/IMA_Application_and_Agreement.png'
                        },
                        {
                            title: 'BANKCODE Income Disclaimer',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+Income+Disclaimer.pdf',
                            img: './assets/common/images/bank-code/thumbnails/legal-documents/Income_Disclaimer.png'
                        },
                        {
                            title: 'BANKCODE Policies and Procedures',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+Policies+and+Procedures.pdf',
                            img: './assets/common/images/bank-code/thumbnails/legal-documents/Policies_and_Procedures.png'
                        },
                        {
                            title: 'BANKCODE Privacy Policy - Updated 2019',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+Privacy+Policy+-+Updated+2019.pdf',
                            img: './assets/common/images/bank-code/thumbnails/legal-documents/Privacy_Policy.png'
                        },
                        {
                            title: 'BANKCODE Terms of Use - Updated 2019',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODE+Terms+of+Use+-+Updated+2019.pdf',
                            img: './assets/common/images/bank-code/thumbnails/legal-documents/Terms_of_Use.png'
                        },
                        {
                            title: 'BANKCODE Advertising Guidelines',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Legal+Docs/BANKCODEAdvertisingGuidelines.pdf',
                            img: './assets/common/images/bank-code/thumbnails/legal-documents/Guideline.png'
                        }
                    ]
                },
                {
                    categoryName: 'ORDER FORMS',
                    anchor: 'forms',
                    list: [
                        {
                            title: 'Trainer Application Form',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Trainer+Application+Forms/Trainer+Application+Form+(1).pdf',
                            img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Application_Form.png'
                        },
                        {
                            title: 'Trainer Application Form - Print Ready',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Trainer+Application+Forms/Trainer+Application+Form_Print.pdf',
                            img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Application_Form_Print_Ready.png'
                        },
                        {
                            title: 'Trainer Order Form',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Trainer+Order+Forms/Trainer+Order+Form+(1).pdf',
                            img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Order_Form.png'
                        },
                        {
                            title: 'Trainer Order Form - Print Ready',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Trainer+Order+Forms/Trainer+Order+Form_Print.pdf',
                            img: './assets/common/images/bank-code/thumbnails/application-form/Trainer_Order_Form_Print_Ready.png'
                        },
                        {
                            title: 'Signature Series Order Form',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Signature+Series+Order+Forms/Signature+Series+Order+Form.pdf',
                            img: './assets/common/images/bank-code/no_image.png'
                        },
                        {
                            title: 'Signature Series Order Form - Print Ready',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Corporate+Docs/Signature+Series+Order+Forms/Signature+Series+Order+Form+-+Print+Ready.pdf',
                            img: './assets/common/images/bank-code/no_image.png'
                        }
                    ]
                },
                {
                    categoryName: 'SLIDE DECKS',
                    anchor: 'decks',
                    list: [
                        {
                            title: 'Intro to BANK Intelligences',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Slide+Decks/Intro+to+BANK+Intelligences+090319.pptx.zip',
                            img: './assets/common/images/bank-code/thumbnails/slide-decks/Intro_to_Bank_Intelligences.png'
                        },
                        {
                            title: 'Intro to BANK Why They Buy',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Slide+Decks/Intro+to+BANK+Why+They+Buy+090319.pptx.zip',
                            img: './assets/common/images/bank-code/thumbnails/slide-decks/Intro_to_Why_They_Buy.png'
                        },
                        {
                            title: 'Quote Deck - Memes',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Slide+Decks/Quote+Deck+-+Memes.zip',
                            img: './assets/common/images/bank-code/thumbnails/slide-decks/Quote_Deck_Memes.png'
                        },
                        {
                            title: 'Trainer Opportunity',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Slide+Decks/Trainer+Opportunity.zip',
                            img: './assets/common/images/bank-code/thumbnails/slide-decks/Trainer_Opportunity.png'
                        }
                    ]
                },
                {
                    categoryName: 'VIDEOS',
                    anchor: 'videos',
                    list: [
                        {
                            title: 'Video - BANK Cryptex',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Videos/BANK+Cryptex+Video.mp4',
                            img: './assets/common/images/bank-code/thumbnails/videos/Video_BANK_Cryptex.png'
                        },
                        {
                            title: 'Video - BANKCODE One World',
                            fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Videos/BANKCODE+One+World.mp4',
                            img: './assets/common/images/bank-code/thumbnails/videos/Video_BANKCODE_One_World.png'
                        }
                    ]
                }] : []
            ).concat(
                hasTrainerSubscription ? [
                    {
                        categoryName: 'TRAINER KITS',
                        anchor: 'trainer',
                        list: [
                            {
                                title: 'L1: BANK Fundamentals Kit',
                                fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L1/BANK+Fundamentals.zip',
                                img: './assets/common/images/bank-code/thumbnails/trainer-kits/L1_BANK_Fundamentas_Kit.png'
                            },
                            {
                                title: 'L1: Intro to BANK Intelligences - Keynote',
                                fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L1/Intro+to+BANK+Intelligences+090219.key.zip',
                                img: './assets/common/images/bank-code/thumbnails/trainer-kits/L1_BF_Trainer_Kit.png'
                            },
                            {
                                title: 'L1: Intro to BANK Why They Buy - Keynote',
                                fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L1/Intro+to+BANK+Why+They+Buy+090219.key.zip',
                                img: './assets/common/images/bank-code/thumbnails/trainer-kits/L1_Intro_to_Why_They_Buy_Keynote.png'
                            },
                            {
                                title: 'L2: Speed Coding Kit',
                                fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L2/Speed+Coding.zip',
                                img: './assets/common/images/bank-code/thumbnails/trainer-kits/L2_Speed_Coding_Kit.png'
                            },
                            {
                                title: 'L2: Speed Coding PNG',
                                fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L2/SPEED+CODING_TK.png',
                                img: './assets/common/images/bank-code/thumbnails/trainer-kits/L2_Speed_Coding_PNG.png'
                            },
                            {
                                title: 'L3: Power Scripting Kit',
                                fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L3/Power+Scripting+Kit.zip',
                                img: './assets/common/images/bank-code/thumbnails/trainer-kits/L3_Power_Scripting_Kit.png'
                            },
                            {
                                title: 'L3: Power Scripting PNG',
                                fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L3/POWER+SCRIPTING_TK.png',
                                img: './assets/common/images/bank-code/thumbnails/trainer-kits/L3_Power_Scripting_PNG.png'
                            },
                            {
                                title: 'L4: Communication Mastery Kit',
                                fileLink: 'https://vo.bankcode.com/trainerkits#',
                                img: './assets/common/images/bank-code/thumbnails/trainer-kits/L4_Communication_Mastery_Kit.png'
                            },
                            {
                                title: 'L4: Communication Mastery PNG',
                                fileLink: 'https://new-resources-2019.s3-us-west-1.amazonaws.com/Trainer+L4/COMMUNICATION+MASTERY_TK.png',
                                img: './assets/common/images/bank-code/thumbnails/trainer-kits/L4_Communication_Mastery_PNG.png'
                            }
                        ]
                    }
                ] : []
            );
        }
    ));
    autoScrollingIsWorking = false;

    constructor(
        private profileService: ProfileService,
        private elementRef: ElementRef,
        public ls: AppLocalizationService
    ) {}

    @HostListener('window:scroll')
    onWindowScroll() {
        if (!this.autoScrollingIsWorking) {
            const bottomHasReached = $(window).scrollTop() + $(window).height() == $(document).height(),
                  cardList = this.elementRef.nativeElement.querySelectorAll('.card');
            this.isClicked = bottomHasReached
                ? cardList.length - 1
                : [].findIndex.call(cardList, (card) => {
                    return card.getBoundingClientRect().bottom > 99;
                });
        }
    }

    pageScrollStart() {
        this.autoScrollingIsWorking = true;
    }

    pageScrollFinish() {
        this.autoScrollingIsWorking = false;
    }
}
