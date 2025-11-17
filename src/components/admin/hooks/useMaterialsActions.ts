import { toast } from 'sonner';

const API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

interface UseMaterialsActionsProps {
  loadMaterials: () => void;
}

export function useMaterialsActions({ loadMaterials }: UseMaterialsActionsProps) {
  const handleSubmit = async (
    formData: any,
    editingMaterial: any,
    setDialogOpen: (open: boolean) => void,
    setEditingMaterial: (material: any) => void,
    setFormData: (data: any) => void
  ) => {
    if (!formData.name.trim() || !formData.section_id) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      const method = editingMaterial ? 'PUT' : 'POST';
      const body = editingMaterial 
        ? { ...formData, id: editingMaterial.id, section_id: Number(formData.section_id) }
        : { ...formData, section_id: Number(formData.section_id) };

      const response = await fetch(API, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(editingMaterial ? 'Материал обновлен' : 'Материал создан');
        setDialogOpen(false);
        setEditingMaterial(null);
        setFormData({ name: '', section_id: '', quantity: 0, manual_deduct: true, defect_tracking: false });
        loadMaterials();
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Удалить материал "${name}"?\n\nМатериал будет удален из базы безвозвратно.`)) return;

    try {
      const response = await fetch(`${API}?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success(`Материал "${name}" удален`);
        loadMaterials();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  return {
    handleSubmit,
    handleDelete,
  };
}
