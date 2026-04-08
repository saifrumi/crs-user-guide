import { Component, input, output } from '@angular/core';
import { GuideGroup } from '../../../core/guide-workspace.types';

@Component({
    selector: 'app-guide-left-panel',
    standalone: true,
    templateUrl: './guide-left-panel.component.html'
})
export class GuideLeftPanelComponent {
    readonly groupedGuides = input<GuideGroup[]>([]);
    readonly currentGuideId = input('');
    readonly isSidebarCollapsed = input(false);
    readonly sessionRole = input('');
    readonly editorMessage = input('');

    readonly toggleSidebar = output<void>();
    readonly openGuideModal = output<void>();
    readonly selectGuide = output<string>();
}