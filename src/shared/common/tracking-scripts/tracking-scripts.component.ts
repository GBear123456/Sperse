/** Core imports */
import { Component, Input, OnInit, Renderer2 } from '@angular/core';

/** Application imports */
import {
    TrackingToolsSettingsDto
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-tracking-scripts',
    template: '',
})
export class TrackingScriptsComponent implements OnInit {
    @Input() config: TrackingToolsSettingsDto;

    constructor(private renderer: Renderer2) { }

    ngOnInit(): void {
        if (!this.config)
            return;

        // Google Analytics 4
        if (this.config.googleAnalytics) {
            this.loadScript(
                'google-analytics',
                `https://www.google-analytics.com/analytics.js`,
                `
                  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
                  ga('create', '${this.config.googleAnalytics}', 'auto');
                  ga('send', 'pageview');
                `
            );
        }

        // Google Tag Manager
        if (this.config.googleTagManager) {
            this.loadScript(
                'google-tag-manager',
                `https://www.googletagmanager.com/gtm.js?id=${this.config.googleTagManager}`,
                `
                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','${this.config.googleTagManager}');
                `
            );
        }

        // Meta Pixel
        if (this.config.metaPixelId) {
            this.loadScript(
                'meta-pixel',
                `https://connect.facebook.net/en_US/fbevents.js`,
                `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${this.config.metaPixelId}');
                  fbq('track', 'PageView');
                `
            );
        }

        // TikTok Pixel
        if (this.config.tikTokPixelId) {
            this.loadScript(
                'tiktok-pixel',
                `https://analytics.tiktok.com/i18n/pixel/events.js`,
                `
                  !function (w, d, t) {
                    w.TiktokAnalyticsObject = t;
                    var ttq = w[t] = w[t] || [];
                    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
                    ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
                    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
                    ttq.instance = function (t) { for (var e = ttq._i[t] = [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e };
                    ttq.load('${this.config.tikTokPixelId}');
                    ttq.page();
                  }(window, document, 'ttq');
                `
            );
        }

        // LinkedIn Insight Tag
        if (this.config.linkedInPartnerId) {
            this.loadScript(
                'linkedin-insight',
                `https://snap.licdn.com/li.lms-analytics/insight.min.js`,
                `
                  _linkedin_partner_id = "${this.config.linkedInPartnerId}";
                  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
                  window._linkedin_data_partner_ids.push(_linkedin_partner_id);
                `
            );
        }

        // HubSpot Tracking Code
        if (this.config.hubSpotTrackingCode) {
            this.loadScript(
                'hubspot-tracking',
                `https://js.hs-scripts.com/${this.config.hubSpotTrackingCode}.js`,
                ''
            );
        }

        // Mixpanel
        if (this.config.mixpanelProjectToken) {
            this.loadScript(
                'mixpanel-tracking',
                `https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js`,
                `
                  (function(f,b){
                    if(!b.__SV){var a,e,i,g;window.mixpanel=b;b._i=[];
                    b.init=function(a,e,d){function f(b,h){var a=h.split(".");
                    2==a.length&&(b=b[a[0]],h=a[1]);b[h]=function(){b.push([h].concat(
                    Array.prototype.slice.call(arguments,0)))}}var c=b;"undefined"!==
                    typeof d?c=b[d]=[]:d="mixpanel";c.people=c.people||[];c.toString=function(b){
                    var a="mixpanel";"mixpanel"!==d&&(a+="."+d);b||(a+=" (stub)");return a};
                    c.people.toString=function(){return c.toString(1)+".people (stub)"};
                    i="disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(" ");
                    for(g=0;g<i.length;g++)f(c,i[g]);b._i.push([a,e,d])};
                    b.__SV=1.2;a=f.createElement("script");a.type="text/javascript";
                    a.async=!0;a.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?
                    MIXPANEL_CUSTOM_LIB_URL:"file:"===f.location.protocol&&
                    "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)?
                    "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":
                    "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";e=f.getElementsByTagName("script")[0];
                    e.parentNode.insertBefore(a,e)}})(document,window.mixpanel||[]);
                    mixpanel.init("${this.config.mixpanelProjectToken}");
                `
            );
        }

        // Amplitude
        if (this.config.amplitudeAPIKey) {
            this.loadScript(
                'amplitude-tracking',
                `https://cdn.amplitude.com/libs/amplitude-8.17.0-min.gz.js`,
                `
                  amplitude.getInstance().init("${this.config.amplitudeAPIKey}");
                `
            );
        }

        // Twitter Pixel
        if (this.config.twitterPixelId) {
            this.loadScript(
                'twitter-pixel',
                `https://static.ads-twitter.com/uwt.js`,
                `
                  twq('init','${this.config.twitterPixelId}');
                  twq('track','PageView');
                `
            );
        }
    }

    private loadScript(id: string, src: string, inlineScript: string): void {
        if (document.getElementById(id)) return;

        const script = this.renderer.createElement('script');
        script.id = id;
        script.type = 'text/javascript';
        script.async = true;
        script.src = src;
        this.renderer.appendChild(document.body, script);

        if (inlineScript) {
            const inline = this.renderer.createElement('script');
            inline.type = 'text/javascript';
            inline.text = inlineScript;
            this.renderer.appendChild(document.body, inline);
        }
    }
}