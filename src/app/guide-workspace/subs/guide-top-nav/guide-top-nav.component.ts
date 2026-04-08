import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-guide-top-nav',
    standalone: true,
    templateUrl: './guide-top-nav.component.html'
})
export class GuideTopNavComponent {
    readonly searchInput = input('');
    readonly sessionDisplayName = input('');
    readonly isEditMode = input(false);
    readonly isSidebarCollapsed = input(false);

    readonly sidebarToggle = output<void>();
    readonly searchInputChange = output<string>();
    readonly searchSubmitted = output<Event>();
    readonly clearSearch = output<void>();
    readonly editModeToggle = output<void>();
    readonly logout = output<void>();

    onSearchInput(event: Event): void {
        this.searchInputChange.emit((event.target as HTMLInputElement | null)?.value ?? '');
    }
}