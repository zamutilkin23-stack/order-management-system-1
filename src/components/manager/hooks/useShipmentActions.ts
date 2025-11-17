import { toast } from 'sonner';

const ORDERS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';

interface ShipItem {
  material_id: number;
  color_id: number | null;
  quantity: number;
  is_defective: boolean;
  available_colors?: any[];
  auto_deduct?: boolean;
}

interface UseShipmentActionsProps {
  onRefresh: () => void;
  loadFreeShipments: () => void;
}

export function useShipmentActions({ onRefresh, loadFreeShipments }: UseShipmentActionsProps) {
  const handleShip = async (
    shipItems: ShipItem[],
    shipmentMode: 'order' | 'free',
    selectedOrder: any,
    userId: number,
    shipmentComment: string,
    setIsDialogOpen: (open: boolean) => void,
    setIsFreeShipmentDialog: (open: boolean) => void,
    setSelectedOrder: (order: any) => void
  ) => {
    const missingColors = shipItems.filter(item => !item.color_id || item.color_id === 0);
    if (missingColors.length > 0) {
      toast.error('Укажите цвет для всех материалов');
      return;
    }

    if (shipmentMode === 'free') {
      const missingMaterials = shipItems.filter(item => !item.material_id || item.material_id === 0);
      if (missingMaterials.length > 0) {
        toast.error('Выберите материалы для всех позиций');
        return;
      }

      const invalidQuantities = shipItems.filter(item => item.quantity <= 0);
      if (invalidQuantities.length > 0) {
        toast.error('Укажите количество для всех позиций');
        return;
      }

      try {
        const response = await fetch(ORDERS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            free_shipment: true,
            items: shipItems.map(item => ({
              material_id: item.material_id,
              color_id: item.color_id,
              quantity: item.quantity,
              is_defective: item.is_defective
            })),
            shipped_by: userId,
            comment: shipmentComment
          })
        });

        if (response.ok) {
          toast.success('Материалы отправлены');
          setIsFreeShipmentDialog(false);
          loadFreeShipments();
          onRefresh();
        } else {
          const error = await response.json();
          toast.error(error.error || 'Ошибка отправки');
        }
      } catch (error) {
        toast.error('Ошибка сервера');
      }
      return;
    }

    if (!selectedOrder) return;

    try {
      const response = await fetch(ORDERS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrder.id,
          status: 'shipped',
          shipped_items: shipItems.map(item => ({
            material_id: item.material_id,
            color_id: item.color_id,
            quantity: item.quantity,
            is_defective: item.is_defective
          })),
          shipped_by: userId
        })
      });

      if (response.ok) {
        toast.success('Заявка отправлена, материалы списаны');
        setIsDialogOpen(false);
        setSelectedOrder(null);
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка отправки');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const deleteFreeShipment = async (id: number) => {
    if (!confirm('Удалить эту отправку?')) return;

    try {
      const response = await fetch(`${ORDERS_API}?shipment_id=${id}&shipment_type=free`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Отправка удалена');
        loadFreeShipments();
        onRefresh();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  return {
    handleShip,
    deleteFreeShipment,
  };
}
