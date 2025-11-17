import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const REQUESTS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';
const MATERIALS_API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

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

export interface Section {
  id: number;
  name: string;
}

export function useRequestsData() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    loadRequests();
    loadSections();
    loadMaterials();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await fetch(REQUESTS_API + '?type=requests');
      const data = await response.json();
      setRequests(data || []);
    } catch (error) {
      toast.error('Ошибка загрузки заявок');
    }
  };

  const loadSections = async () => {
    try {
      const response = await fetch(`${MATERIALS_API}?type=section`);
      const data = await response.json();
      setSections(data);
    } catch (error) {
      toast.error('Ошибка загрузки разделов');
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await fetch(`${MATERIALS_API}?type=material`);
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      toast.error('Ошибка загрузки материалов');
    }
  };

  return {
    requests,
    sections,
    materials,
    loadRequests,
  };
}
