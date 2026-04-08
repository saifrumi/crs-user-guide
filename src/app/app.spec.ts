import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { AuthService } from './auth.service';
import { routes } from './app.routes';
import { GuideFakeDbService } from './guide-fake-db.service';

describe('App', () => {
    beforeEach(async () => {
        localStorage.clear();

        await TestBed.configureTestingModule({
            imports: [App],
            providers: [provideRouter(routes)]
        }).compileComponents();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it('should redirect unauthenticated users to login', async () => {
        const harness = await RouterTestingHarness.create();

        await harness.navigateByUrl('/guides/payment-operations');

        expect(TestBed.inject(Router).url).toContain('/login');
        expect(harness.routeNativeElement?.textContent).toContain('Authorized access');
    });

    it('should allow only authorized login credentials', () => {
        const auth = TestBed.inject(AuthService);

        expect(auth.login('guest', 'guest')).toBe(false);
        expect(auth.login('operator', 'crs-ops-2026')).toBe(true);
    });

    it('should render a guide page after login', async () => {
        TestBed.inject(AuthService).login('operator', 'crs-ops-2026');
        const harness = await RouterTestingHarness.create();

        await harness.navigateByUrl('/guides/payment-operations');

        expect(harness.routeNativeElement?.textContent).toContain('Payment Operations');
    });

    it('should search topics from the fake database', () => {
        const fakeDb = TestBed.inject(GuideFakeDbService);
        const results = fakeDb.searchTopics('capture');

        expect(
            results.some((result) => result.guideId === 'payment-operations' && result.sectionId === 'capture')
        ).toBe(true);
    });

    it('should navigate search results to the guide url with fragment', async () => {
        TestBed.inject(AuthService).login('operator', 'crs-ops-2026');
        const harness = await RouterTestingHarness.create();

        await harness.navigateByUrl('/search?q=capture');

        const resultButton = Array.from(
            (harness.routeNativeElement as HTMLElement).querySelectorAll('.search-result')
        ).find((element) => element.textContent?.includes('Capture')) as HTMLButtonElement;

        resultButton.click();
        await harness.fixture.whenStable();

        expect(TestBed.inject(Router).url).toContain('/guides/payment-operations#capture');
    });
});