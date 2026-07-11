import { PRIMARY_SITE_URL } from './site-url';

function upsertJsonLd(id: string, data: object) {
	if (typeof document === 'undefined') return;

	const selector = `script[type="application/ld+json"][data-schema-id="${id}"]`;
	const current = document.head.querySelector<HTMLScriptElement>(selector);
	const element = current ?? document.createElement('script');

	element.type = 'application/ld+json';
	element.dataset.schemaId = id;
	element.textContent = JSON.stringify(data);

	if (!current) {
		document.head.appendChild(element);
	}
}

function removeJsonLd(id: string) {
	if (typeof document === 'undefined') return;
	document.head
		.querySelector(`script[type="application/ld+json"][data-schema-id="${id}"]`)
		?.remove();
}

export function syncJsonLd(id: string, data?: object | null) {
	if (!data) {
		removeJsonLd(id);
		return;
	}

	upsertJsonLd(id, data);
}

export const defaultOrganizationSchema = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	'@id': `${PRIMARY_SITE_URL}/#organization`,
	name: 'Koreshield',
	legalName: 'Koreshield Labs Ltd',
	url: PRIMARY_SITE_URL,
	logo: {
		'@type': 'ImageObject',
		url: `${PRIMARY_SITE_URL}/logo.png`,
		width: 457,
		height: 482,
	},
	description: 'Runtime security for production AI applications, including prompt, RAG, agent, provider, policy, and audit controls.',
	identifier: {
		'@type': 'PropertyValue',
		propertyID: 'UK Companies House',
		value: '17057784',
	},
	address: {
		'@type': 'PostalAddress',
		streetAddress: '3rd Floor, 86-90 Paul Street',
		addressLocality: 'London',
		postalCode: 'EC2A 4NE',
		addressCountry: 'GB',
	},
	sameAs: [
		'https://github.com/koreshield',
		'https://x.com/koreshield',
		'https://www.linkedin.com/company/koreshield',
	],
};

export const defaultSiteNavigationSchema = {
	'@context': 'https://schema.org',
	'@type': 'ItemList',
	itemListElement: [
		{
			'@type': 'SiteNavigationElement',
			position: 1,
			name: 'Solutions',
			description: 'Explore our AI security layers: prompt injection protection, RAG security, agent control, and more.',
			url: `${PRIMARY_SITE_URL}/solutions`,
		},
		{
			'@type': 'SiteNavigationElement',
			position: 2,
			name: 'Pricing',
			description: 'Koreshield pricing plans for teams of all sizes, from Growth to custom Enterprise self-hosted options.',
			url: `${PRIMARY_SITE_URL}/pricing`,
		},
		{
			'@type': 'SiteNavigationElement',
			position: 3,
			name: 'Documentation',
			description: 'Complete documentation for the Koreshield platform. API reference, SDK guides, and integration examples.',
			url: `${PRIMARY_SITE_URL}/docs`,
		},
		{
			'@type': 'SiteNavigationElement',
			position: 4,
			name: 'Blog',
			description: 'Latest insights on LLM security, AI threat detection, and enterprise AI infrastructure.',
			url: `${PRIMARY_SITE_URL}/blog`,
		},
		{
			'@type': 'SiteNavigationElement',
			position: 5,
			name: 'About',
			description: 'We are building the runtime security layer for production AI applications. Learn more about our team and mission.',
			url: `${PRIMARY_SITE_URL}/about`,
		},
		{
			'@type': 'SiteNavigationElement',
			position: 6,
			name: 'Careers',
			description: 'Join the Koreshield team and help secure the future of enterprise AI infrastructure.',
			url: `${PRIMARY_SITE_URL}/careers`,
		},
	],
};
