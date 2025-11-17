import { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import CompletedOrdersCard from './shipment/CompletedOrdersCard';
import ShippedOrdersHistoryCard from './shipment/ShippedOrdersHistoryCard';
import OrderShipmentDialog from './shipment/OrderShipmentDialog';
import FreeShipmentDialog from './shipment/FreeShipmentDialog';
import { useShippedOrdersData } from './hooks/useShippedOrdersData';
import { useShipmentActions } from './hooks/useShipmentActions';
import { filterShippedByDate, getSectionName, getMaterialName, getColorName, getColorHex } from './utils/shipmentUtils';
import type { Order, Material, Section, Color } from './hooks/useShippedOrdersData';

interface ShipItem {
  material_id: number;
  color_id: number | null;
  quantity: number;
  is_defective: boolean;
  available_colors?: Color[];
  auto_deduct?: boolean;
}

interface ShippedOrdersProps {
  orders: Order[];
  materials: Material[];
  sections: Section[];
  colors: Color[];
  userId: number;
  onRefresh: () => void;
}

export default function ShippedOrders({ orders, materials, sections, colors, userId, onRefresh }: ShippedOrdersProps) {
  const { freeShipments, loadFreeShipments } = useShippedOrdersData();
  const { handleShip, deleteFreeShipment } = useShipmentActions({ onRefresh, loadFreeShipments });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shipItems, setShipItems] = useState<ShipItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFreeShipmentDialog, setIsFreeShipmentDialog] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [shipmentComment, setShipmentComment] = useState('');
  const [shipmentMode, setShipmentMode] = useState<'order' | 'free'>('order');

  const completedOrders = orders.filter(o => o.status === 'completed');
  const shippedOrders = filterShippedByDate(orders.filter(o => o.status === 'shipped'), dateFilter);

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

  const updateShipItem = (index: number, field: string, value: any) => {
    const newItems = [...shipItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setShipItems(newItems);
  };

  const onShip = () => handleShip(
    shipItems,
    shipmentMode,
    selectedOrder,
    userId,
    shipmentComment,
    setIsDialogOpen,
    setIsFreeShipmentDialog,
    setSelectedOrder
  );

  return (
    <TabsContent value="shipped">
      <div className="space-y-6">
        <CompletedOrdersCard
          completedOrders={completedOrders}
          sections={sections}
          materials={materials}
          colors={colors}
          getSectionName={(id) => getSectionName(id, sections)}
          getMaterialName={(id) => getMaterialName(id, materials)}
          getColorName={(id) => getColorName(id, colors)}
          getColorHex={(id) => getColorHex(id, colors)}
          openShipDialog={openShipDialog}
          openFreeShipmentDialog={openFreeShipmentDialog}
        />

        <ShippedOrdersHistoryCard
          shippedOrders={shippedOrders}
          freeShipments={freeShipments}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          sections={sections}
          materials={materials}
          colors={colors}
          getSectionName={(id) => getSectionName(id, sections)}
          getMaterialName={(id) => getMaterialName(id, materials)}
          getColorName={(id) => getColorName(id, colors)}
          getColorHex={(id) => getColorHex(id, colors)}
          deleteFreeShipment={deleteFreeShipment}
        />

        <OrderShipmentDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          selectedOrder={selectedOrder}
          shipItems={shipItems}
          materials={materials}
          colors={colors}
          getMaterialName={(id) => getMaterialName(id, materials)}
          getColorName={(id) => getColorName(id, colors)}
          updateShipItem={updateShipItem}
          handleShip={onShip}
        />

        <FreeShipmentDialog
          isOpen={isFreeShipmentDialog}
          onClose={() => setIsFreeShipmentDialog(false)}
          shipItems={shipItems}
          materials={materials}
          colors={colors}
          shipmentComment={shipmentComment}
          setShipmentComment={setShipmentComment}
          getMaterialName={(id) => getMaterialName(id, materials)}
          updateFreeShipmentItem={updateFreeShipmentItem}
          addFreeShipmentItem={addFreeShipmentItem}
          removeFreeShipmentItem={removeFreeShipmentItem}
          handleShip={onShip}
        />
      </div>
    </TabsContent>
  );
}
