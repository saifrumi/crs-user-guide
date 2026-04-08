import { Guide, MediaType, SearchResult } from '../services/guide-fake-db.service';

export type TocItem = {
    id: string;
    title: string;
};

export type GuideGroup = {
    name: string;
    guides: Guide[];
};

export type ReadingEditingPanelAction =
    | { type: 'toggleEditMode' }
    | { type: 'updateTopicDraftTitle'; value: string }
    | { type: 'addTopic' }
    | { type: 'deleteGuide' }
    | { type: 'updateGuideText'; field: 'title' | 'audience' | 'group'; event: Event }
    | { type: 'updateGuideHtml'; field: 'description' | 'intro'; event: Event }
    | { type: 'deleteTopic'; sectionId: string }
    | {
        type: 'updateSectionText';
        sectionId: string;
        field: 'title' | 'endpoint' | 'authentication' | 'code';
        event: Event;
    }
    | { type: 'updateSectionHtml'; sectionId: string; event: Event }
    | {
        type: 'updateSectionListItem';
        sectionId: string;
        field: 'steps' | 'bullets';
        index: number;
        event: Event;
    }
    | { type: 'addSectionListItem'; sectionId: string; field: 'steps' | 'bullets' }
    | { type: 'deleteSectionListItem'; sectionId: string; field: 'steps' | 'bullets'; index: number }
    | { type: 'addCallout'; sectionId: string }
    | { type: 'removeCallout'; sectionId: string }
    | { type: 'cycleCalloutTone'; sectionId: string }
    | { type: 'updateCalloutText'; sectionId: string; field: 'label' | 'text'; event: Event; asHtml?: boolean }
    | { type: 'addMedia'; sectionId: string; mediaType: MediaType }
    | { type: 'toggleMediaType'; sectionId: string; mediaId: string }
    | { type: 'updateMediaText'; sectionId: string; mediaId: string; field: 'url' | 'caption'; event: Event }
    | { type: 'deleteMedia'; sectionId: string; mediaId: string }
    | { type: 'openSearchResult'; result: SearchResult };