import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

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

interface UseMaterialsDataProps {
  userId: number;
}

export function useMaterialsData({ userId }: UseMaterialsDataProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    loadMaterials();
    loadSections();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await fetch(API);
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      toast.error('Ошибка загрузки');
    }
  };

  const loadSections = async () => {
    try {
      const response = await fetch(`${API}?type=section`, {
        headers: { 'X-User-Id': String(userId) }
      });
      const data = await response.json();
      setSections(data);
    } catch (error) {
      toast.error('Ошибка загрузки разделов');
    }
  };

  return {
    materials,
    sections,
    loadMaterials,
  };
}
