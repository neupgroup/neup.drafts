export type BusinessBlockType =
  | 'tourio_package'
  | 'tourio_food'
  | 'tourio_toolkit'
  | 'shop_product'
  | 'tourio_location'
  | 'blog_block'
  | 'cta_block'
  | 'contact_block'
  | 'author_block'
  | 'qna_block'
  | 'review_block';

interface BusinessBlockTemplate {
  title: string;
  eyebrow: string;
  body: string;
  items?: string[];
}

export const businessBlockOptions: Array<{
  id: BusinessBlockType;
  label: string;
}> = [
  { id: 'tourio_package', label: 'Tourio package block' },
  { id: 'tourio_food', label: 'Tourio food block' },
  { id: 'tourio_toolkit', label: 'Tourio toolkit block' },
  { id: 'shop_product', label: 'Shop product block' },
  { id: 'tourio_location', label: 'Tourio location block' },
  { id: 'blog_block', label: 'Blog block' },
  { id: 'cta_block', label: 'CTA block' },
  { id: 'contact_block', label: 'Contact block' },
  { id: 'author_block', label: 'Author block' },
  { id: 'qna_block', label: 'Q&A block' },
  { id: 'review_block', label: 'Review block' },
];

const businessBlockTemplates: Record<BusinessBlockType, BusinessBlockTemplate> = {
  tourio_package: {
    eyebrow: 'Tourio package',
    title: 'Package name',
    body: 'Describe the itinerary, included services, duration, and ideal guest.',
    items: ['Duration', 'Starting price', 'Included highlights'],
  },
  tourio_food: {
    eyebrow: 'Tourio food',
    title: 'Food experience',
    body: 'Describe the dish, venue, cuisine, and why travelers should try it.',
    items: ['Cuisine', 'Best time', 'Dietary notes'],
  },
  tourio_toolkit: {
    eyebrow: 'Tourio toolkit',
    title: 'Traveler toolkit',
    body: 'Add practical resources, packing notes, permits, or booking guidance.',
    items: ['Before you go', 'Bring along', 'Local tip'],
  },
  shop_product: {
    eyebrow: 'Shop product',
    title: 'Product name',
    body: 'Summarize the product, benefits, variants, and purchase details.',
    items: ['Price', 'Availability', 'Key feature'],
  },
  tourio_location: {
    eyebrow: 'Tourio location',
    title: 'Location name',
    body: 'Describe the destination, access, nearby attractions, and visitor fit.',
    items: ['Region', 'Travel time', 'Best season'],
  },
  blog_block: {
    eyebrow: 'Blog block',
    title: 'Related article',
    body: 'Introduce a related blog post and why readers should continue there.',
    items: ['Article link', 'Reading time', 'Topic'],
  },
  cta_block: {
    eyebrow: 'CTA block',
    title: 'Call to action',
    body: 'Write the offer, next step, and button text readers should follow.',
    items: ['Primary action', 'Link', 'Supporting note'],
  },
  contact_block: {
    eyebrow: 'Contact block',
    title: 'Contact details',
    body: 'Add the contact person, phone, email, address, and preferred response path.',
    items: ['Phone', 'Email', 'Office address'],
  },
  author_block: {
    eyebrow: 'Author block',
    title: 'Author name',
    body: 'Add a concise author bio, expertise, and profile link.',
    items: ['Role', 'Expertise', 'Profile link'],
  },
  qna_block: {
    eyebrow: 'Q&A block',
    title: 'Question',
    body: 'Answer the question clearly with the details readers need.',
    items: ['Short answer', 'Details', 'Source or note'],
  },
  review_block: {
    eyebrow: 'Review block',
    title: 'Reviewer name',
    body: 'Add the review summary, rating, and context for the experience.',
    items: ['Rating', 'Visited on', 'Review highlight'],
  },
};

function appendEditableText(parent: HTMLElement, tagName: 'h3' | 'p' | 'li', text: string) {
  const element = document.createElement(tagName);

  element.contentEditable = 'plaintext-only';
  element.textContent = text;
  parent.append(element);
}

function createBusinessBlockRoot(blockType: BusinessBlockType): HTMLDivElement {
  const block = document.createElement('div');
  const template = businessBlockTemplates[blockType];

  block.dataset.editorBlock = 'businessblocks';
  block.dataset.businessBlock = blockType;
  block.dataset.businessBlockGroup = 'businessblocks';
  block.dataset.businessBlockRoute = '/businessblocks';
  block.dataset.businessBlockLabel = template.eyebrow;

  return block;
}

function createContactBusinessBlock(): HTMLElement {
  const block = createBusinessBlockRoot('contact_block');
  const icon = document.createElement('div');
  const content = document.createElement('div');
  const methods = document.createElement('div');
  const action = document.createElement('div');
  const button = document.createElement('a');

  icon.dataset.contactIcon = 'phone';
  content.dataset.contactContent = 'true';
  methods.dataset.contactMethods = 'true';
  action.dataset.contactAction = 'true';

  appendEditableText(content, 'h3', 'Contact Us');
  appendEditableText(content, 'p', 'Call us now or send a message.');

  appendEditableText(methods, 'p', '+977 980-0000000');
  methods.lastElementChild?.setAttribute('data-contact-method', 'phone');
  appendEditableText(methods, 'p', 'hello@example.com');
  methods.lastElementChild?.setAttribute('data-contact-method', 'email');

  button.href = 'tel:+977980000000';
  button.textContent = 'Call Now';

  appendEditableText(action, 'p', 'Replies within 24 hours');
  action.prepend(button);

  block.append(icon, content, action);
  content.append(methods);

  return block;
}

export function createBusinessBlock(blockType: BusinessBlockType): HTMLElement {
  const template = businessBlockTemplates[blockType];
  const block = createBusinessBlockRoot(blockType);
  const list = document.createElement('ul');

  if (blockType === 'contact_block') {
    return createContactBusinessBlock();
  }

  appendEditableText(block, 'p', template.eyebrow);
  appendEditableText(block, 'h3', template.title);
  appendEditableText(block, 'p', template.body);

  list.dataset.businessBlockFields = 'true';

  template.items?.forEach((item) => appendEditableText(list, 'li', item));
  block.append(list);

  return block;
}
