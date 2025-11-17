import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { requestsService, materialsService } from '@/lib/api';

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
      const data = await requestsService.getAll();
      setRequests(data || []);
    } catch (error) {
      toast.error('Ошибка загрузки заявок');
    }
  };

  const loadSections = async () => {
    try {
      const data = await materialsService.getSections();
      setSections(data);
    } catch (error) {
      toast.error('Ошибка загрузки разделов');
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await materialsService.getAll();
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