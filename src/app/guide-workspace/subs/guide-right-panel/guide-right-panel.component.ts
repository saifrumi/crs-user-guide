import { Component, input } from '@angular/core';
import { TocItem } from '../../../core/guide-workspace.types';

@Component({
    selector: 'app-guide-right-panel',
    standalone: true,
    templateUrl: './guide-right-panel.component.html'
})
export class GuideRightPanelComponent {
    readonly tableOfContents = input<TocItem[]>([]);
}