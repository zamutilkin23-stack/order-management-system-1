import { ApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';

const client = new ApiClient(API_ENDPOINTS.REQUESTS);

export interface Request {
  id: number;
  request_number: string;
  section_id: number;
  section_name: string;
  status: 'new' | 'in_progress' | 'completed' | 'sent';
  comment: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  items: RequestItem[];
}

export interface RequestItem {
  id: number;
  request_id: number;
  material_name: string;
  quantity_required: number | null;
  quantity_completed: number;
  color: string | null;
  size: string | null;
  comment: string;
}

export interface CreateRequestData {
  request_number: string;
  section_id: number;
  comment: string;
  created_by: number;
  items: Array<{
    material_name: string;
    quantity_required: number | null;
    color: string | null;
    size: string | null;
    comment: string;
  }>;
}

export interface UpdateRequestItemData {
  item_id: number;
  quantity_completed: number;
}

export const requestsService = {
  getAll: () => client.get<Request[]>('', { type: 'requests' }),

  create: (data: CreateRequestData) => 
    client.post('', data, { type: 'requests' }),

  update: (data: UpdateRequestItemData) => 
    client.put('', data, { type: 'requests' }),

  delete: (id: number) => 
    client.delete('', { type: 'requests', id }),

  send: (id: number) => 
    client.patch('', { status: 'sent' }, { type: 'requests', id, action: 'send' }),

  getShippedItems: () => 
    client.get('', { get_shipped: true }),

  getFreeShipments: () => 
    client.get('', { get_free_shipments: true }),
};
