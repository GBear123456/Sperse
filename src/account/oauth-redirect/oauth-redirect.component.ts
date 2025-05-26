/** Core imports */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */

/** Application imports */

@Component({
    template: '<p>Authenticating...</p>'
})
export class OAuthRedirectComponent implements OnInit {
    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        const code = this.route.snapshot.queryParamMap.get('code');
        const state = this.route.snapshot.queryParamMap.get('state');
        const error = this.route.snapshot.queryParamMap.get('error');

        if (window.opener && (code || state)) {
            window.opener.postMessage({ code, state, error }, '*');
        }
    }
}