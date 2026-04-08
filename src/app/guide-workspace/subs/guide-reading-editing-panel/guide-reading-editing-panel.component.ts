import { Component, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Guide, SearchResult } from '../../../services/guide-fake-db.service';
import { ReadingEditingPanelAction } from '../../../core/guide-workspace.types';

@Component({
    selector: 'app-guide-reading-editing-panel',
    standalone: true,
    templateUrl: './guide-reading-editing-panel.component.html'
})
export class GuideReadingEditingPanelComponent {
    private readonly sanitizer = inject(DomSanitizer);

    readonly pageMode = input<'guide' | 'search'>('guide');
    readonly guide = input<Guide | null>(null);
    readonly searchQuery = input('');
    readonly searchResults = input<SearchResult[]>([]);
    readonly isEditMode = input(false);
    readonly isSidebarCollapsed = input(false);
    readonly topicDraftTitle = input('');

    readonly action = output<ReadingEditingPanelAction>();

    updateTopicDraftTitle(event: Event): void {
        this.action.emit({
            type: 'updateTopicDraftTitle',
            value: (event.target as HTMLInputElement | null)?.value ?? ''
        });
    }

    asEmbedUrl(url: string): SafeResourceUrl {
        let normalizedUrl = url;

        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('watch?v=')[1]?.split('&')[0];
            normalizedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : url;
            return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedUrl);
        }

        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            normalizedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : url;
            return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedUrl);
        }

        if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            normalizedUrl = videoId ? `https://player.vimeo.com/video/${videoId}` : url;
            return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedUrl);
        }

        return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedUrl);
    }

    isDirectVideo(url: string): boolean {
        return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
    }

    isEmbeddableVideo(url: string): boolean {
        return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
    }
}