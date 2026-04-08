import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { GuideWorkspaceComponent } from './guide-workspace.component';
import { LoginPageComponent } from './login-page.component';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginPageComponent
    },
    {
        path: 'guides/:guideId',
        canActivate: [authGuard],
        component: GuideWorkspaceComponent
    },
    {
        path: 'search',
        canActivate: [authGuard],
        component: GuideWorkspaceComponent
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'guides/payment-operations'
    },
    {
        path: '**',
        redirectTo: 'guides/payment-operations'
    }
];
