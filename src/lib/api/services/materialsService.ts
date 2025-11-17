import { ApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';

const client = new ApiClient(API_ENDPOINTS.MATERIALS);

export interface Material {
  id: number;
  name: string;
  section_id: number;
  quantity: number;
  auto_deduct: boolean;
  manual_deduct: boolean;
  defect_tracking: boolean;
}

export interface Section {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface Color {
  id: number;
  name: string;
  hex_code: string;
}

export interface CreateMaterialData {
  name: string;
  section_id: number;
  quantity: number;
  manual_deduct: boolean;
  defect_tracking: boolean;
}

export interface UpdateMaterialData extends CreateMaterialData {
  id: number;
}

export const materialsService = {
  getAll: () => client.get<Material[]>(''),

  getSections: (userId?: number) => 
    client.get<Section[]>('', { type: 'section' }),

  getColors: () => 
    client.get<Color[]>('', { type: 'color' }),

  create: (data: CreateMaterialData) => 
    client.post('', data),

  update: (data: UpdateMaterialData) => 
    client.put('', data),

  delete: (id: number) => 
    client.delete('', { id }),

  updateQuantity: (id: number, quantityChange: number, comment?: string, colorId?: number) => 
    client.put('', {
      id,
      quantity_change: quantityChange,
      comment,
      color_id: colorId,
    }),
};
