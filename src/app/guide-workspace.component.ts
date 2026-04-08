import { computed, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { AuthService } from './auth.service';
import {
    Guide,
    GuideDraft,
    GuideFakeDbService,
    GuideMedia,
    GuideSection,
    MediaType,
    SearchResult,
    TopicDraft
} from './guide-fake-db.service';

type TocItem = {
    id: string;
    title: string;
};

const SIDEBAR_STORAGE_KEY = 'crs-userguide-sidebar-collapsed';

@Component({
    selector: 'app-guide-workspace',
    imports: [FormsModule],
    templateUrl: './guide-workspace.component.html',
    styleUrl: './guide-workspace.component.css'
})
export class GuideWorkspaceComponent {
    private readonly auth = inject(AuthService);
    private readonly fakeDb = inject(GuideFakeDbService);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly pageMode = this.route.snapshot.routeConfig?.path === 'search' ? 'search' : 'guide';
    readonly session = this.auth.session;
    readonly isLoggedIn = this.auth.isLoggedIn;
    readonly isEditMode = signal(false);
    readonly isGuideModalOpen = signal(false);
    readonly isSidebarCollapsed = signal(this.readSidebarState());
    readonly guides = signal(this.fakeDb.getGuides());
    readonly editorMessage = signal('');
    readonly searchInput = signal('');

    draftGuide: GuideDraft = this.createEmptyDraft();
    topicDraft: TopicDraft = { title: '' };

    private readonly paramMap = toSignal(this.route.paramMap, {
        initialValue: convertToParamMap({})
    });

    private readonly queryParamMap = toSignal(this.route.queryParamMap, {
        initialValue: convertToParamMap({})
    });

    readonly currentGuideId = computed(() => this.paramMap().get('guideId') ?? '');
    readonly searchQuery = computed(() => this.queryParamMap().get('q')?.trim() ?? '');

    readonly selectedGuide = computed(
        () => this.fakeDb.getGuideById(this.currentGuideId(), this.guides())
    );

    readonly groupedGuides = computed(() => {
        const groups = new Map<string, Guide[]>();

        for (const guide of this.guides()) {
            const bucket = groups.get(guide.group) ?? [];
            bucket.push(guide);
            groups.set(guide.group, bucket);
        }

        return Array.from(groups.entries()).map(([name, guides]) => ({ name, guides }));
    });

    readonly tableOfContents = computed(() => {
        const guide = this.selectedGuide();
        if (!guide) {
            return [] as TocItem[];
        }

        return guide.sections.map((section) => ({
            id: section.id,
            title: section.title
        }));
    });

    readonly searchResults = computed(() => this.fakeDb.searchTopics(this.searchQuery(), this.guides()));

    constructor() {
        effect(() => {
            this.searchInput.set(this.searchQuery());
        });

        effect(() => {
            if (this.pageMode !== 'guide') {
                return;
            }

            const guides = this.guides();
            const currentGuideId = this.currentGuideId();
            if (!guides.length) {
                return;
            }

            if (!currentGuideId || !guides.some((guide) => guide.id === currentGuideId)) {
                void this.router.navigate(['/guides', guides[0].id], { replaceUrl: true });
            }
        });
    }

    toggleSidebar(): void {
        const nextValue = !this.isSidebarCollapsed();
        this.isSidebarCollapsed.set(nextValue);
        this.writeSidebarState(nextValue);
    }

    toggleEditMode(): void {
        this.isEditMode.update((value) => !value);
        this.editorMessage.set('');
    }

    submitSearch(event?: Event): void {
        event?.preventDefault();

        const query = this.searchInput().trim();
        if (!query) {
            if (this.pageMode === 'search' && this.guides()[0]) {
                void this.router.navigate(['/guides', this.guides()[0].id]);
            }

            return;
        }

        void this.router.navigate(['/search'], {
            queryParams: { q: query }
        });
    }

    clearSearch(): void {
        this.searchInput.set('');

        if (this.pageMode === 'search' && this.guides()[0]) {
            void this.router.navigate(['/guides', this.guides()[0].id]);
        }
    }

    logout(): void {
        this.auth.logout();
        this.isEditMode.set(false);
        this.isGuideModalOpen.set(false);
        this.editorMessage.set('');
        void this.router.navigate(['/login']);
    }

    openGuideModal(): void {
        this.draftGuide = this.createEmptyDraft();
        this.isGuideModalOpen.set(true);
        this.editorMessage.set('');
    }

    closeGuideModal(): void {
        this.isGuideModalOpen.set(false);
    }

    selectGuide(guideId: string): void {
        this.editorMessage.set('');
        void this.router.navigate(['/guides', guideId]);
    }

    openSearchResult(result: SearchResult): void {
        this.isEditMode.set(false);
        this.editorMessage.set('');
        void this.router.navigate(['/guides', result.guideId], {
            fragment: result.sectionId
        });
    }

    addGuide(): void {
        if (!this.draftGuide.title.trim() || !this.draftGuide.firstSectionTitle.trim()) {
            this.editorMessage.set('Complete the guide title and first topic title.');
            return;
        }

        const guides = this.fakeDb.createGuide(this.draftGuide);
        const guideId = guides[0]?.id;

        this.guides.set(guides);
        this.isGuideModalOpen.set(false);
        this.isEditMode.set(true);
        this.editorMessage.set('Guide created. You can now edit it inline in the middle panel.');

        if (guideId) {
            void this.router.navigate(['/guides', guideId]);
        }
    }

    deleteGuide(): void {
        const guide = this.selectedGuide();
        if (!guide) {
            return;
        }

        const guides = this.fakeDb.deleteGuide(guide.id);
        this.guides.set(guides);

        const nextGuideId = guides[0]?.id;
        this.editorMessage.set('Guide deleted from the fake database.');

        if (nextGuideId) {
            void this.router.navigate(['/guides', nextGuideId]);
            return;
        }

        this.isEditMode.set(false);
    }

    addTopic(): void {
        const guide = this.selectedGuide();
        if (!guide) {
            return;
        }

        if (!this.topicDraft.title.trim()) {
            this.editorMessage.set('Enter a topic title before adding it.');
            return;
        }

        const guides = this.fakeDb.createSection(guide.id, this.topicDraft);
        this.guides.set(guides);
        this.topicDraft = { title: '' };
        this.editorMessage.set('Topic created. Edit the topic content directly in the middle panel.');
    }

    deleteTopic(sectionId: string): void {
        const guide = this.selectedGuide();
        if (!guide) {
            return;
        }

        const guides = this.fakeDb.deleteSection(guide.id, sectionId);
        this.guides.set(guides);
        this.editorMessage.set('Topic deleted from the fake database.');
    }

    updateGuideField(field: keyof Pick<Guide, 'title' | 'description' | 'intro' | 'audience' | 'group'>, value: string): void {
        const guide = this.selectedGuide();
        if (!guide) {
            return;
        }

        this.guides.set(this.fakeDb.updateGuide(guide.id, { [field]: value }));
    }

    updateGuideTextFromEvent(field: keyof Pick<Guide, 'title' | 'audience' | 'group'>, event: Event): void {
        this.updateGuideField(field, this.readText(event));
    }

    updateGuideHtmlFromEvent(field: keyof Pick<Guide, 'description' | 'intro'>, event: Event): void {
        this.updateGuideField(field, this.readHtml(event));
    }

    updateSectionField(
        sectionId: string,
        field: keyof Pick<GuideSection, 'title' | 'content' | 'endpoint' | 'authentication' | 'code'>,
        value: string
    ): void {
        const guide = this.selectedGuide();
        if (!guide) {
            return;
        }

        this.guides.set(this.fakeDb.updateSection(guide.id, sectionId, { [field]: value }));
    }

    updateSectionTextFromEvent(
        sectionId: string,
        field: keyof Pick<GuideSection, 'title' | 'endpoint' | 'authentication' | 'code'>,
        event: Event
    ): void {
        this.updateSectionField(sectionId, field, this.readText(event));
    }

    updateSectionHtmlFromEvent(sectionId: string, field: keyof Pick<GuideSection, 'content'>, event: Event): void {
        this.updateSectionField(sectionId, field, this.readHtml(event));
    }

    updateSectionListItem(
        sectionId: string,
        field: keyof Pick<GuideSection, 'steps' | 'bullets'>,
        index: number,
        event: Event
    ): void {
        const guide = this.selectedGuide();
        const section = guide?.sections.find((item) => item.id === sectionId);
        if (!guide || !section) {
            return;
        }

        const items = [...section[field]];
        items[index] = this.readText(event);

        this.guides.set(this.fakeDb.updateSection(guide.id, sectionId, { [field]: items.filter(Boolean) }));
    }

    addSectionListItem(sectionId: string, field: keyof Pick<GuideSection, 'steps' | 'bullets'>): void {
        const guide = this.selectedGuide();
        const section = guide?.sections.find((item) => item.id === sectionId);
        if (!guide || !section) {
            return;
        }

        this.guides.set(
            this.fakeDb.updateSection(guide.id, sectionId, {
                [field]: [...section[field], field === 'steps' ? 'New step' : 'New bullet']
            })
        );
    }

    deleteSectionListItem(
        sectionId: string,
        field: keyof Pick<GuideSection, 'steps' | 'bullets'>,
        index: number
    ): void {
        const guide = this.selectedGuide();
        const section = guide?.sections.find((item) => item.id === sectionId);
        if (!guide || !section) {
            return;
        }

        this.guides.set(
            this.fakeDb.updateSection(guide.id, sectionId, {
                [field]: section[field].filter((_, itemIndex) => itemIndex !== index)
            })
        );
    }

    addCallout(sectionId: string): void {
        const guide = this.selectedGuide();
        const section = guide?.sections.find((item) => item.id === sectionId);
        if (!guide || !section || section.callout) {
            return;
        }

        this.guides.set(
            this.fakeDb.updateSection(guide.id, sectionId, {
                callout: {
                    label: 'Info',
                    tone: 'info',
                    text: 'Add a short note, warning, or tip here.'
                }
            })
        );
    }

    removeCallout(sectionId: string): void {
        const guide = this.selectedGuide();
        if (!guide) {
            return;
        }

        this.guides.set(this.fakeDb.updateSection(guide.id, sectionId, { callout: undefined }));
    }

    updateCalloutField(sectionId: string, field: 'label' | 'tone' | 'text', value: string): void {
        const guide = this.selectedGuide();
        const section = guide?.sections.find((item) => item.id === sectionId);
        if (!guide || !section?.callout) {
            return;
        }

        this.guides.set(
            this.fakeDb.updateSection(guide.id, sectionId, {
                callout: {
                    ...section.callout,
                    [field]: value
                }
            })
        );
    }

    updateCalloutTextFromEvent(sectionId: string, field: 'label' | 'text', event: Event, asHtml = false): void {
        this.updateCalloutField(sectionId, field, asHtml ? this.readHtml(event) : this.readText(event));
    }

    cycleCalloutTone(sectionId: string): void {
        const guide = this.selectedGuide();
        const section = guide?.sections.find((item) => item.id === sectionId);
        const currentTone = section?.callout?.tone;

        if (!guide || !section?.callout || !currentTone) {
            return;
        }

        const tones: Array<'info' | 'tip' | 'warning'> = ['info', 'tip', 'warning'];
        const currentIndex = tones.indexOf(currentTone);
        const nextTone = tones[(currentIndex + 1) % tones.length];
        this.updateCalloutField(sectionId, 'tone', nextTone);
    }

    addMedia(sectionId: string, type: MediaType): void {
        const guide = this.selectedGuide();
        const section = guide?.sections.find((item) => item.id === sectionId);
        if (!guide || !section) {
            return;
        }

        const media: GuideMedia = {
            id: `${type}-${Date.now()}`,
            type,
            url: '',
            caption: ''
        };

        this.guides.set(
            this.fakeDb.updateSection(guide.id, sectionId, {
                media: [...section.media, media]
            })
        );
    }

    updateMediaField(
        sectionId: string,
        mediaId: string,
        field: keyof Pick<GuideMedia, 'type' | 'url' | 'caption'>,
        value: string
    ): void {
        const guide = this.selectedGuide();
        const section = guide?.sections.find((item) => item.id === sectionId);
        if (!guide || !section) {
            return;
        }

        this.guides.set(
            this.fakeDb.updateSection(guide.id, sectionId, {
                media: section.media.map((media) =>
                    media.id === mediaId ? { ...media, [field]: value } : media
                )
            })
        );
    }

    updateMediaTextFromEvent(
        sectionId: string,
        mediaId: string,
        field: keyof Pick<GuideMedia, 'url' | 'caption'>,
        event: Event
    ): void {
        this.updateMediaField(sectionId, mediaId, field, this.readText(event));
    }

    toggleMediaType(sectionId: string, mediaId: string): void {
        const guide = this.selectedGuide();
        const section = guide?.sections.find((item) => item.id === sectionId);
        const media = section?.media.find((item) => item.id === mediaId);

        if (!guide || !section || !media) {
            return;
        }

        this.updateMediaField(sectionId, mediaId, 'type', media.type === 'image' ? 'video' : 'image');
    }

    deleteMedia(sectionId: string, mediaId: string): void {
        const guide = this.selectedGuide();
        const section = guide?.sections.find((item) => item.id === sectionId);
        if (!guide || !section) {
            return;
        }

        this.guides.set(
            this.fakeDb.updateSection(guide.id, sectionId, {
                media: section.media.filter((media) => media.id !== mediaId)
            })
        );
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

    private readText(event: Event): string {
        return ((event.target as HTMLElement | null)?.innerText ?? '')
            .replace(/\u00a0/g, ' ')
            .replace(/\n{2,}/g, '\n')
            .trim();
    }

    private readHtml(event: Event): string {
        const element = event.target as HTMLElement | null;
        const html = element?.innerHTML ?? '';
        return html === '<br>' ? '' : html.trim();
    }

    private createEmptyDraft(): GuideDraft {
        return {
            group: 'Guides',
            title: '',
            audience: 'Authorized users',
            description: '',
            firstSectionTitle: 'Overview',
            firstSectionBody: ''
        };
    }

    private readSidebarState(): boolean {
        try {
            return globalThis.localStorage?.getItem(SIDEBAR_STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    }

    private writeSidebarState(value: boolean): void {
        try {
            globalThis.localStorage?.setItem(SIDEBAR_STORAGE_KEY, String(value));
        } catch {
            // Ignore storage failures and use the in-memory value only.
        }
    }
}