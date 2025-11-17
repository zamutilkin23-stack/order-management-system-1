import { toast } from 'sonner';

const REQUESTS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';

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
      const response = await fetch(REQUESTS_API + '?type=requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
      });

      if (response.ok) {
        toast.success('Заявка создана');
        setDialogOpen(false);
        setFormData({
          request_number: '',
          section_id: '',
          comment: '',
          items: [{ material_name: '', quantity_required: '', color: '', size: '', comment: '' }]
        });
        loadRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка создания');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить заявку?')) return;

    try {
      const response = await fetch(`${REQUESTS_API}?type=requests&id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Заявка удалена');
        loadRequests();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const handleSendRequest = async (id: number) => {
    if (!confirm('Отправить заявку?')) return;

    try {
      const response = await fetch(`${REQUESTS_API}?type=requests&id=${id}&action=send`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' })
      });

      if (response.ok) {
        toast.success('Заявка отправлена');
        loadRequests();
      } else {
        toast.error('Ошибка отправки');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const updateItemQuantity = async (itemId: number, quantityCompleted: number) => {
    try {
      const response = await fetch(REQUESTS_API + '?type=requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          quantity_completed: quantityCompleted
        })
      });

      if (response.ok) {
        toast.success('Количество обновлено');
        loadRequests();
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  return {
    handleSubmit,
    handleDelete,
    handleSendRequest,
    updateItemQuantity,
  };
}
