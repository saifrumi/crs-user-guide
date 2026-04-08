import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { GuideFakeDbService } from '../services/guide-fake-db.service';

@Component({
    selector: 'app-login-page',
    imports: [FormsModule],
    templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
    private readonly auth = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fakeDb = inject(GuideFakeDbService);

    readonly errorMessage = signal('');

    credentials = {
        username: '',
        password: ''
    };

    constructor() {
        if (this.auth.isLoggedIn()) {
            void this.router.navigateByUrl(this.redirectTarget());
        }
    }

    submit(): void {
        this.errorMessage.set('');

        const isAuthorized = this.auth.login(this.credentials.username, this.credentials.password);
        if (!isAuthorized) {
            this.errorMessage.set('Only authorized users can sign in and view the guides.');
            return;
        }

        void this.router.navigateByUrl(this.redirectTarget());
    }

    private redirectTarget(): string {
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
        if (redirectTo) {
            return redirectTo;
        }

        const firstGuide = this.fakeDb.getGuides()[0];
        return `/guides/${firstGuide?.id ?? 'payment-operations'}`;
    }
}