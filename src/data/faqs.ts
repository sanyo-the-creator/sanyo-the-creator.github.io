import en from '../i18n/messages/en.json';

export interface FAQItem {
    question: string;
    answer: string;
    summary?: string;
}

export interface FAQGroup {
    icon: string;
    title: string;
    items: FAQItem[];
}

// English source of truth lives in i18n/messages/en.json, other languages sit next to it.
export const faqGroups: FAQGroup[] = en.faq.groups;

export const faqItems: FAQItem[] = faqGroups.flatMap((g) => g.items);
