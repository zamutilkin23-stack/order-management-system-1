import { useState, useEffect } from 'react';

const ORDERS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';

export interface FreeShipment {
  id: number;
  material_id: number;
  color_id: number;
  quantity: number;
  is_defective: boolean;
  shipped_by: number;
  comment: string;
  shipped_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  section_id: number;
  status: string;
  comment: string;
  created_at: string;
  shipped_at?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  material_id: number;
  color_id: number;
  quantity_required: number;
  quantity_completed: number;
}

export interface Material {
  id: number;
  name: string;
  section_id: number;
  quantity: number;
  colors: Color[];
  auto_deduct?: boolean;
}

export interface Section {
  id: number;
  name: string;
}

export interface Color {
  id: number;
  name: string;
  hex_code: string;
}

export function useShippedOrdersData() {
  const [freeShipments, setFreeShipments] = useState<FreeShipment[]>([]);

  useEffect(() => {
    loadFreeShipments();
  }, []);

  const loadFreeShipments = async () => {
    try {
      const response = await fetch(`${ORDERS_API}?get_free_shipments=true`);
      if (response.ok) {
        const data = await response.json();
        setFreeShipments(data);
      }
    } catch (error) {
      console.error('Error loading free shipments:', error);
    }
  };

  return {
    freeShipments,
    loadFreeShipments,
  };
}
