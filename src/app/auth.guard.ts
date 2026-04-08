import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_, state) => {
    const auth = inject(AuthService);
    if (auth.isLoggedIn()) {
        return true;
    }

    return inject(Router).createUrlTree(['/login'], {
        queryParams: { redirectTo: state.url }
    });
};