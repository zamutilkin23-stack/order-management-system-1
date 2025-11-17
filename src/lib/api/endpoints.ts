export const API_ENDPOINTS = {
  REQUESTS: 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd',
  MATERIALS: 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77',
  SCHEDULE: 'https://functions.poehali.dev/f617714b-d72a-41e1-87ec-519f6dff2f28',
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];
