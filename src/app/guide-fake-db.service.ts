import { Injectable } from '@angular/core';

export type CalloutTone = 'info' | 'tip' | 'warning';
export type MediaType = 'image' | 'video';

export type GuideMedia = {
    id: string;
    type: MediaType;
    url: string;
    caption: string;
};

export type FlowOption = {
    id: string;
    title: string;
    description: string;
    status: string;
};

export type GuideSection = {
    id: string;
    title: string;
    content: string;
    endpoint: string;
    authentication: string;
    code: string;
    steps: string[];
    bullets: string[];
    media: GuideMedia[];
    callout?: {
        label: string;
        tone: CalloutTone;
        text: string;
    };
};

export type FailureCase = {
    id: string;
    title: string;
    steps: string[];
};

export type QuickReferenceRow = {
    action: string;
    endpoint: string;
    auth: string;
    appliesTo: string;
};

export type Guide = {
    id: string;
    group: string;
    title: string;
    description: string;
    intro: string;
    updated: string;
    audience: string;
    flowOptions: FlowOption[];
    sections: GuideSection[];
    failureCases: FailureCase[];
    quickReference: QuickReferenceRow[];
};

export type GuideDraft = {
    group: string;
    title: string;
    audience: string;
    description: string;
    firstSectionTitle: string;
    firstSectionBody: string;
};

export type TopicDraft = {
    title: string;
};

export type SearchResult = {
    id: string;
    guideId: string;
    guideTitle: string;
    sectionId: string;
    sectionTitle: string;
    snippet: string;
};

const STORAGE_KEY = 'crs-userguide-fake-db';

const INITIAL_GUIDES: Guide[] = [
    {
        id: 'payment-operations',
        group: 'Guides',
        title: 'Payment Operations',
        description: 'Reference patterns for charge flows, reversals, refunds, and recovery steps.',
        intro:
            'Use this guide when your team needs a predictable way to operate payment actions inside CRS. It is written as a reading-first document: choose the flow, read the operational rule, then execute the action from the relevant screen or service.',
        updated: 'Apr 8, 2026',
        audience: 'Operations and support',
        flowOptions: [
            {
                id: 'purchase-flow',
                title: '1. Purchase',
                description: 'Charges the customer immediately and closes the transaction in a single step.',
                status: 'charged -> settled'
            },
            {
                id: 'authorize-flow',
                title: '2. Authorization',
                description: 'Places a hold first, then allows your team to capture or release the amount later.',
                status: 'authorized -> captured or voided'
            }
        ],
        sections: [
            {
                id: 'authorization',
                title: 'Authorization',
                content:
                    'Use authorization when you need to verify a payment method but should not charge it until stock, approval, or manual review is complete.',
                endpoint: 'POST /payments',
                authentication: 'Publishable or session-scoped key',
                code: `{
  "amount": 5000,
  "currency": "SAR",
  "description": "Order #1234",
  "mode": "authorize",
  "callback_url": "https://example.internal/callback"
}`,
                steps: [],
                bullets: [
                    'The payment remains on hold until your team captures or voids it.',
                    'Only use this mode for workflows that genuinely need delayed charging.',
                    'Make the authorization window visible to operators so holds do not expire unnoticed.'
                ],
                media: [
                    {
                        id: 'authorization-image',
                        type: 'image',
                        url: 'https://placehold.co/1200x700/f5f5f4/1c1917?text=Authorization+Flow',
                        caption: 'Example diagram placeholder for authorization flow.'
                    }
                ],
                callout: {
                    label: 'Info',
                    tone: 'info',
                    text: 'Authorization is best for stock confirmation, fraud review, and delayed dispatch workflows.'
                }
            },
            {
                id: 'capture',
                title: 'Capture',
                content:
                    'Capture converts a valid authorization into a real charge. Do this only after the order is confirmed and the team is ready to fulfill.',
                endpoint: 'POST /payments/{id}/capture',
                authentication: 'Secret key',
                code: `{
  "amount": 3000
}`,
                steps: [
                    'Open the authorized payment record.',
                    'Confirm the remaining capturable amount.',
                    'Capture the full amount or a reduced amount if partial fulfillment applies.'
                ],
                bullets: [
                    'The capture amount cannot exceed the authorized amount.',
                    'After capture, treat the transaction as charged for refund rules and reporting.',
                    'Document partial captures in the order notes if fulfillment continues later.'
                ],
                media: [],
                callout: undefined
            },
            {
                id: 'void',
                title: 'Void',
                content:
                    'Void releases an authorization or reverses a very recent charge before it becomes a full refund case. Prefer it when the customer should not be charged at all.',
                endpoint: 'POST /payments/{id}/void',
                authentication: 'Secret key',
                code: '',
                steps: [],
                bullets: [
                    'Use void when the order is cancelled before completion.',
                    'If the transaction is no longer voidable, move to a refund workflow instead.',
                    'Always confirm the current status before retrying a failed void.'
                ],
                media: [
                    {
                        id: 'void-video',
                        type: 'video',
                        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        caption: 'Replace this sample video with your internal walkthrough.'
                    }
                ],
                callout: {
                    label: 'Tip',
                    tone: 'tip',
                    text: 'Prefer void over refund when timing allows it. It is operationally simpler and reduces unnecessary finance handling.'
                }
            },
            {
                id: 'refund',
                title: 'Refund',
                content:
                    'Refund returns money after a payment has already been charged. Use it for customer returns, overcharges, or post-settlement reversals.',
                endpoint: 'POST /payments/{id}/refund',
                authentication: 'Secret key',
                code: `{
  "amount": 2000
}`,
                steps: [],
                bullets: [
                    'Refund less than the charged amount only when a partial return or adjustment is approved.',
                    'Record the refund reason clearly for reconciliation and support follow-up.',
                    'Check balance or settlement rules before issuing live refunds if your finance process requires it.'
                ],
                media: [],
                callout: {
                    label: 'Warning',
                    tone: 'warning',
                    text: 'Refunds affect reporting and finance reconciliation. Make sure the operational reason is captured before completing the action.'
                }
            }
        ],
        failureCases: [
            {
                id: 'capture-failure',
                title: 'Capture Failure',
                steps: [
                    'Check the payment status again before assuming the capture failed.',
                    'If the payment is still authorized, retry the capture once.',
                    'If the second attempt fails, create a new payment path and ask the customer to retry.'
                ]
            },
            {
                id: 'void-failure',
                title: 'Void Failure',
                steps: [
                    'Refresh the payment record and confirm whether the transaction is already voided.',
                    'Retry once if it is still in a voidable state.',
                    'If it remains charged and cannot be voided, issue a refund instead.'
                ]
            }
        ],
        quickReference: [
            {
                action: 'Authorize',
                endpoint: 'POST /payments',
                auth: 'Publishable key',
                appliesTo: 'Delayed charge workflows'
            },
            {
                action: 'Capture',
                endpoint: 'POST /payments/{id}/capture',
                auth: 'Secret key',
                appliesTo: 'Authorized payments'
            },
            {
                action: 'Void',
                endpoint: 'POST /payments/{id}/void',
                auth: 'Secret key',
                appliesTo: 'Authorized or recently charged payments'
            },
            {
                action: 'Refund',
                endpoint: 'POST /payments/{id}/refund',
                auth: 'Secret key',
                appliesTo: 'Charged or captured payments'
            }
        ]
    },
    {
        id: 'order-lifecycle',
        group: 'Guides',
        title: 'Order Lifecycle',
        description: 'Operational checkpoints from order creation through dispatch and closure.',
        intro:
            'This page documents the decisions an operator makes after payment is accepted: review, picking, packing, dispatch, and final completion.',
        updated: 'Apr 7, 2026',
        audience: 'Fulfillment teams',
        flowOptions: [],
        sections: [
            {
                id: 'review',
                title: 'Review',
                content:
                    'Validate customer information, payment confirmation, and fulfillment ownership before work begins.',
                endpoint: '',
                authentication: '',
                code: '',
                steps: [],
                bullets: [
                    'Check address quality and branch routing.',
                    'Confirm the payment state matches the required workflow.',
                    'Assign exceptions to the right queue immediately.'
                ],
                media: [],
                callout: undefined
            },
            {
                id: 'dispatch',
                title: 'Dispatch',
                content:
                    'Dispatch should only happen after stock, payment, and packaging checkpoints are all complete.',
                endpoint: '',
                authentication: '',
                code: '',
                steps: [
                    'Confirm the packing checklist is complete.',
                    'Attach carrier or branch transfer details.',
                    'Mark the order as dispatched with the correct timestamp.'
                ],
                bullets: [],
                media: [],
                callout: undefined
            }
        ],
        failureCases: [],
        quickReference: []
    }
];

@Injectable({ providedIn: 'root' })
export class GuideFakeDbService {
    getGuides(): Guide[] {
        const savedGuides = this.read();

        if (savedGuides.length > 0) {
            return savedGuides;
        }

        return this.write(this.clone(INITIAL_GUIDES));
    }

    getGuideById(guideId: string, guides = this.getGuides()): Guide | null {
        return guides.find((guide) => guide.id === guideId) ?? null;
    }

    searchTopics(query: string, guides = this.getGuides()): SearchResult[] {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return [];
        }

        const results: SearchResult[] = [];

        for (const guide of guides) {
            for (const section of guide.sections) {
                const searchSurface = [
                    guide.title,
                    guide.description,
                    guide.intro,
                    section.title,
                    section.content,
                    section.endpoint,
                    section.authentication,
                    section.code,
                    section.steps.join(' '),
                    section.bullets.join(' '),
                    section.callout?.label ?? '',
                    section.callout?.text ?? '',
                    section.media.map((media) => `${media.caption} ${media.url}`).join(' ')
                ]
                    .map((value) => this.stripHtml(value))
                    .join(' ')
                    .toLowerCase();

                if (!searchSurface.includes(normalizedQuery)) {
                    continue;
                }

                const snippetSource = this.stripHtml(
                    [section.content, section.bullets[0], section.steps[0], section.callout?.text ?? '']
                        .filter(Boolean)
                        .join(' ')
                );

                results.push({
                    id: `${guide.id}-${section.id}`,
                    guideId: guide.id,
                    guideTitle: guide.title,
                    sectionId: section.id,
                    sectionTitle: section.title,
                    snippet: this.snippet(snippetSource || guide.description, normalizedQuery)
                });
            }
        }

        return results;
    }

    createGuide(draft: GuideDraft): Guide[] {
        const guides = this.getGuides();
        const title = draft.title.trim();
        const firstSectionTitle = draft.firstSectionTitle.trim();
        const firstSectionBody = draft.firstSectionBody.trim();
        const guideId = this.uniqueSlug(title || `guide-${Date.now()}`, guides.map((guide) => guide.id));
        const firstSectionId = this.uniqueSlug(firstSectionTitle || `topic-${Date.now()}`, []);

        const guide: Guide = {
            id: guideId,
            group: draft.group.trim() || 'Guides',
            title: title || 'Untitled Guide',
            description: draft.description.trim() || 'New internal guide.',
            intro: draft.description.trim() || 'New internal guide.',
            updated: 'Apr 8, 2026',
            audience: draft.audience.trim() || 'Internal users',
            flowOptions: [],
            sections: [
                {
                    id: firstSectionId,
                    title: firstSectionTitle || 'Overview',
                    content: firstSectionBody || 'Add the first topic content.',
                    endpoint: '',
                    authentication: '',
                    code: '',
                    steps: [],
                    bullets: [],
                    media: [],
                    callout: undefined
                }
            ],
            failureCases: [],
            quickReference: []
        };

        return this.write([guide, ...guides]);
    }

    updateGuide(guideId: string, patch: Partial<Guide>): Guide[] {
        const guides = this.getGuides().map((guide) =>
            guide.id === guideId ? { ...guide, ...this.clone(patch), updated: 'Apr 8, 2026' } : guide
        );

        return this.write(guides);
    }

    deleteGuide(guideId: string): Guide[] {
        return this.write(this.getGuides().filter((guide) => guide.id !== guideId));
    }

    createSection(guideId: string, draft: TopicDraft): Guide[] {
        const guides = this.getGuides().map((guide) => {
            if (guide.id !== guideId) {
                return guide;
            }

            const title = draft.title.trim() || `New Topic ${guide.sections.length + 1}`;
            const sectionId = this.uniqueSlug(title, guide.sections.map((section) => section.id));
            const section: GuideSection = {
                id: sectionId,
                title,
                content: 'Write the topic content here.',
                endpoint: '',
                authentication: '',
                code: '',
                steps: [],
                bullets: [],
                media: [],
                callout: undefined
            };

            return {
                ...guide,
                updated: 'Apr 8, 2026',
                sections: [...guide.sections, section]
            };
        });

        return this.write(guides);
    }

    updateSection(guideId: string, sectionId: string, patch: Partial<GuideSection>): Guide[] {
        const guides = this.getGuides().map((guide) => {
            if (guide.id !== guideId) {
                return guide;
            }

            return {
                ...guide,
                updated: 'Apr 8, 2026',
                sections: guide.sections.map((section) =>
                    section.id === sectionId ? { ...section, ...this.clone(patch) } : section
                )
            };
        });

        return this.write(guides);
    }

    deleteSection(guideId: string, sectionId: string): Guide[] {
        const guides = this.getGuides().map((guide) => {
            if (guide.id !== guideId) {
                return guide;
            }

            return {
                ...guide,
                updated: 'Apr 8, 2026',
                sections: guide.sections.filter((section) => section.id !== sectionId)
            };
        });

        return this.write(guides);
    }

    private read(): Guide[] {
        try {
            const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as Guide[]) : [];
        } catch {
            return [];
        }
    }

    private write(guides: Guide[]): Guide[] {
        const clonedGuides = this.clone(guides);

        try {
            globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(clonedGuides));
        } catch {
            return clonedGuides;
        }

        return clonedGuides;
    }

    private clone<T>(value: T): T {
        return JSON.parse(JSON.stringify(value)) as T;
    }

    private stripHtml(value: string): string {
        return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    private snippet(value: string, query: string): string {
        if (!value) {
            return 'Open this topic to review the matching guide details.';
        }

        const lowerValue = value.toLowerCase();
        const matchIndex = lowerValue.indexOf(query);

        if (matchIndex === -1) {
            return value.slice(0, 140);
        }

        const start = Math.max(0, matchIndex - 40);
        const end = Math.min(value.length, matchIndex + query.length + 100);
        const prefix = start > 0 ? '...' : '';
        const suffix = end < value.length ? '...' : '';
        return `${prefix}${value.slice(start, end).trim()}${suffix}`;
    }

    private uniqueSlug(value: string, existingIds: string[]): string {
        const baseSlug = this.slugify(value);
        let candidate = baseSlug;
        let counter = 2;

        while (existingIds.includes(candidate)) {
            candidate = `${baseSlug}-${counter}`;
            counter += 1;
        }

        return candidate;
    }

    private slugify(value: string): string {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
}
