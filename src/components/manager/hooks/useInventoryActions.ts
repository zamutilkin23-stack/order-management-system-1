import { toast } from 'sonner';

const SHIPMENTS_API = '/api/materials';

interface UseInventoryActionsProps {
  onRefresh: () => void;
}

interface Material {
  id: number;
  name: string;
  quantity: number;
}

export function useInventoryActions({ onRefresh }: UseInventoryActionsProps) {
  const handleManualDeduct = async (
    deductMaterial: Material | null,
    deductFormData: any,
    setManualDeductDialog: (open: boolean) => void
  ) => {
    if (!deductMaterial || deductFormData.quantity <= 0) {
      toast.error('Укажите количество');
      return;
    }

    if (deductFormData.quantity > deductMaterial.quantity) {
      toast.error('Недостаточно материала на складе');
      return;
    }

    try {
      const response = await fetch(SHIPMENTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deductMaterial.id,
          quantity_change: -deductFormData.quantity,
          comment: `Ручное списание: ${deductFormData.comment}`,
          color_id: deductFormData.color_id ? Number(deductFormData.color_id) : null
        })
      });

      if (response.ok) {
        toast.success('Материал списан');
        setManualDeductDialog(false);
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка списания');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const handleShipSubmit = async (
    selectedMaterial: Material | null,
    shipFormData: any,
    setShipDialogOpen: (open: boolean) => void
  ) => {
    if (!selectedMaterial || !shipFormData.color_id || shipFormData.quantity <= 0) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (shipFormData.quantity > selectedMaterial.quantity) {
      toast.error('Недостаточно материала на складе');
      return;
    }

    try {
      const response = await fetch(SHIPMENTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedMaterial.id,
          quantity_change: -shipFormData.quantity,
          comment: `Отправка: ${shipFormData.recipient || 'без получателя'}. ${shipFormData.comment}`,
          ship_material: true,
          color_id: Number(shipFormData.color_id),
          recipient: shipFormData.recipient
        })
      });

      if (response.ok) {
        toast.success('Материал отправлен');
        setShipDialogOpen(false);
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка отправки');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  return {
    handleManualDeduct,
    handleShipSubmit,
  };
}
