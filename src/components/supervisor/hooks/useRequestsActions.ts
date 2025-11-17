import { toast } from 'sonner';
import { requestsService } from '@/lib/api';

interface UseRequestsActionsProps {
  loadRequests: () => void;
}

export function useRequestsActions({ loadRequests }: UseRequestsActionsProps) {
  const handleSubmit = async (formData: any, userId: number, setDialogOpen: (open: boolean) => void, setFormData: (data: any) => void) => {
    if (!formData.request_number.trim() || !formData.section_id) {
      toast.error('Заполните номер заявки и раздел');
      return;
    }

    const validItems = formData.items.filter((item: any) => item.material_name.trim());
    if (validItems.length === 0) {
      toast.error('Добавьте хотя бы один материал');
      return;
    }

    try {
      await requestsService.create({
        request_number: formData.request_number,
        section_id: Number(formData.section_id),
        comment: formData.comment,
        created_by: userId,
        items: validItems.map((item: any) => ({
          material_name: item.material_name,
          quantity_required: item.quantity_required ? Number(item.quantity_required) : null,
          color: item.color || null,
          size: item.size || null,
          comment: item.comment || ''
        }))
      });

      toast.success('Заявка создана');
      setDialogOpen(false);
      setFormData({
        request_number: '',
        section_id: '',
        comment: '',
        items: [{ material_name: '', quantity_required: '', color: '', size: '', comment: '' }]
      });
      loadRequests();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить заявку?')) return;

    try {
      await requestsService.delete(id);
      toast.success('Заявка удалена');
      loadRequests();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления');
    }
  };

  const handleSendRequest = async (id: number) => {
    if (!confirm('Отправить заявку?')) return;

    try {
      await requestsService.send(id);
      toast.success('Заявка отправлена');
      loadRequests();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка отправки');
    }
  };

  const updateItemQuantity = async (itemId: number, quantityCompleted: number) => {
    try {
      await requestsService.update({ item_id: itemId, quantity_completed: quantityCompleted });
      toast.success('Количество обновлено');
      loadRequests();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка обновления');
    }
  };

  return {
    handleSubmit,
    handleDelete,
    handleSendRequest,
    updateItemQuantity,
  };
}