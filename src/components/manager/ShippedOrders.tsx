import { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import CompletedOrdersCard from './shipment/CompletedOrdersCard';
import ShippedOrdersHistoryCard from './shipment/ShippedOrdersHistoryCard';
import OrderShipmentDialog from './shipment/OrderShipmentDialog';
import FreeShipmentDialog from './shipment/FreeShipmentDialog';

const ORDERS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';

interface Order {
  id: number;
  order_number: string;
  section_id: number;
  status: string;
  comment: string;
  created_at: string;
  shipped_at?: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  material_id: number;
  color_id: number;
  quantity_required: number;
  quantity_completed: number;
}

interface Material {
  id: number;
  name: string;
  section_id: number;
  quantity: number;
  colors: Color[];
  auto_deduct?: boolean;
}

interface Section {
  id: number;
  name: string;
}

interface Color {
  id: number;
  name: string;
  hex_code: string;
}

interface ShippedOrdersProps {
  orders: Order[];
  materials: Material[];
  sections: Section[];
  colors: Color[];
  userId: number;
  onRefresh: () => void;
}

interface ShipItem {
  material_id: number;
  color_id: number | null;
  quantity: number;
  is_defective: boolean;
  available_colors?: Color[];
  auto_deduct?: boolean;
}

interface FreeShipment {
  id: number;
  material_id: number;
  color_id: number;
  quantity: number;
  is_defective: boolean;
  shipped_by: number;
  comment: string;
  shipped_at: string;
}

export default function ShippedOrders({ orders, materials, sections, colors, userId, onRefresh }: ShippedOrdersProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shipItems, setShipItems] = useState<ShipItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFreeShipmentDialog, setIsFreeShipmentDialog] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [shipmentComment, setShipmentComment] = useState('');
  const [shipmentMode, setShipmentMode] = useState<'order' | 'free'>('order');
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

  const completedOrders = orders.filter(o => o.status === 'completed');
  
  const filterShippedByDate = (orders: Order[]) => {
    const now = new Date();
    return orders.filter(order => {
      if (!order.shipped_at) return false;
      const shippedDate = new Date(order.shipped_at);
      
      switch (dateFilter) {
        case 'today':
          return shippedDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return shippedDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return shippedDate >= monthAgo;
        default:
          return true;
      }
    });
  };
  
  const shippedOrders = filterShippedByDate(orders.filter(o => o.status === 'shipped'));

  const getSectionName = (id: number) => sections.find(s => s.id === id)?.name || '—';
  const getMaterialName = (id: number) => materials.find(m => m.id === id)?.name || '—';
  const getColorName = (id: number) => colors.find(c => c.id === id)?.name || '—';
  const getColorHex = (id: number) => colors.find(c => c.id === id)?.hex_code || '#000000';

  const openShipDialog = (order: Order) => {
    setShipmentMode('order');
    setSelectedOrder(order);
    setShipItems(order.items.map(item => {
      const material = materials.find(m => m.id === item.material_id);
      const hasColor = item.color_id && item.color_id > 0;
      return {
        material_id: item.material_id,
        color_id: hasColor ? item.color_id : null,
        quantity: item.quantity_completed,
        is_defective: false,
        available_colors: material?.colors || [],
        auto_deduct: material?.auto_deduct || false
      };
    }));
    setIsDialogOpen(true);
  };

  const openFreeShipmentDialog = () => {
    setShipmentMode('free');
    setShipItems([{
      material_id: 0,
      color_id: null,
      quantity: 0,
      is_defective: false,
      available_colors: [],
      auto_deduct: false
    }]);
    setShipmentComment('');
    setIsFreeShipmentDialog(true);
  };

  const addFreeShipmentItem = () => {
    setShipItems([...shipItems, {
      material_id: 0,
      color_id: null,
      quantity: 0,
      is_defective: false,
      available_colors: [],
      auto_deduct: false
    }]);
  };

  const removeFreeShipmentItem = (index: number) => {
    if (shipItems.length > 1) {
      setShipItems(shipItems.filter((_, i) => i !== index));
    }
  };

  const updateFreeShipmentItem = (index: number, field: string, value: any) => {
    const newItems = [...shipItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'material_id') {
      const material = materials.find(m => m.id === Number(value));
      newItems[index].available_colors = material?.colors || [];
      newItems[index].auto_deduct = material?.auto_deduct || false;
      newItems[index].color_id = null;
    }
    
    setShipItems(newItems);
  };

  const handleShip = async () => {
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

  const updateQuantity = (index: number, quantity: number) => {
    const newItems = [...shipItems];
    newItems[index].quantity = Math.max(0, quantity);
    setShipItems(newItems);
  };

  const toggleDefective = (index: number) => {
    const newItems = [...shipItems];
    newItems[index].is_defective = !newItems[index].is_defective;
    setShipItems(newItems);
  };

  const updateOrderShipmentColor = (index: number, colorId: number | null) => {
    const newItems = [...shipItems];
    newItems[index].color_id = colorId;
    setShipItems(newItems);
  };

  return (
    <TabsContent value="shipped">
      <div className="grid gap-6 md:grid-cols-2">
        <CompletedOrdersCard
          completedOrders={completedOrders}
          getSectionName={getSectionName}
          getMaterialName={getMaterialName}
          getColorName={getColorName}
          onOpenShipDialog={openShipDialog}
          onOpenFreeShipmentDialog={openFreeShipmentDialog}
        />

        <ShippedOrdersHistoryCard
          shippedOrders={shippedOrders}
          freeShipments={freeShipments}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          getSectionName={getSectionName}
          getMaterialName={getMaterialName}
          getColorName={getColorName}
          getColorHex={getColorHex}
          onRefresh={onRefresh}
        />
      </div>

      <OrderShipmentDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedOrder={selectedOrder}
        shipItems={shipItems}
        materials={materials}
        getMaterialName={getMaterialName}
        getColorName={getColorName}
        getColorHex={getColorHex}
        onUpdateQuantity={updateQuantity}
        onToggleDefective={toggleDefective}
        onShip={handleShip}
        onUpdateColor={updateOrderShipmentColor}
      />

      <FreeShipmentDialog
        isOpen={isFreeShipmentDialog}
        onOpenChange={setIsFreeShipmentDialog}
        shipItems={shipItems}
        materials={materials}
        shipmentComment={shipmentComment}
        onCommentChange={setShipmentComment}
        onUpdateItem={updateFreeShipmentItem}
        onAddItem={addFreeShipmentItem}
        onRemoveItem={removeFreeShipmentItem}
        onShip={handleShip}
      />
    </TabsContent>
  );
}