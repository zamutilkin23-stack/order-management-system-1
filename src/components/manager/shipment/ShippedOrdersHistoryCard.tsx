import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import ShipmentDetailsDialog from './ShipmentDetailsDialog';

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

interface ShippedOrdersHistoryCardProps {
  shippedOrders: Order[];
  freeShipments: FreeShipment[];
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  getSectionName: (id: number) => string;
  getMaterialName: (id: number) => string;
  getColorName: (id: number) => string;
  getColorHex: (id: number) => string;
  onRefresh: () => void;
}

export default function ShippedOrdersHistoryCard({
  shippedOrders,
  freeShipments,
  dateFilter,
  setDateFilter,
  getSectionName,
  getMaterialName,
  getColorName,
  getColorHex,
  onRefresh
}: ShippedOrdersHistoryCardProps) {
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    type: 'order' | 'free' | null;
    orderData?: Order;
    freeData?: FreeShipment;
  }>({ open: false, type: null });

  const openOrderDetails = (order: Order) => {
    setDetailsDialog({ open: true, type: 'order', orderData: order });
  };

  const openFreeDetails = (shipment: FreeShipment) => {
    setDetailsDialog({ open: true, type: 'free', freeData: shipment });
  };

  const closeDetails = () => {
    setDetailsDialog({ open: false, type: null });
  };

  const handleDelete = async (type: 'order' | 'free', id: number) => {
    try {
      const response = await fetch(`${ORDERS_API}?shipment_id=${id}&type=${type}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Отправка удалена');
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
      console.error('Delete error:', error);
    }
  };
  const filterByDate = (date: string) => {
    const now = new Date();
    const itemDate = new Date(date);
    
    switch (dateFilter) {
      case 'today':
        return itemDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return itemDate >= monthAgo;
      default:
        return true;
    }
  };

  const filteredFreeShipments = freeShipments.filter(s => filterByDate(s.shipped_at));
  
  const allShipments = [
    ...shippedOrders.map(order => ({
      type: 'order' as const,
      id: `order-${order.id}`,
      shipped_at: order.shipped_at || '',
      data: order
    })),
    ...filteredFreeShipments.map(shipment => ({
      type: 'free' as const,
      id: `free-${shipment.id}`,
      shipped_at: shipment.shipped_at,
      data: shipment
    }))
  ].sort((a, b) => new Date(b.shipped_at).getTime() - new Date(a.shipped_at).getTime());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="PackageCheck" size={20} className="text-blue-600" />
              Отправленные
            </CardTitle>
            <CardDescription>
              История отправок
            </CardDescription>
          </div>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">За всё время</SelectItem>
              <SelectItem value="today">За сегодня</SelectItem>
              <SelectItem value="week">За неделю</SelectItem>
              <SelectItem value="month">За месяц</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allShipments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Archive" size={48} className="mx-auto mb-3 opacity-50" />
              <p>Нет отправок</p>
              {dateFilter !== 'all' && (
                <p className="text-xs mt-2">за выбранный период</p>
              )}
            </div>
          ) : (
            allShipments.map(shipment => {
              if (shipment.type === 'order') {
                const order = shipment.data as Order;
                return (
                  <div 
                    key={shipment.id} 
                    className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openOrderDetails(order)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">№ {order.order_number}</h3>
                        <p className="text-xs text-gray-600">{getSectionName(order.section_id)}</p>
                        {order.shipped_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.shipped_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Заявка
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-gray-700">
                          <span>{getMaterialName(item.material_id)}</span>
                          <span>{item.quantity_completed} шт</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else {
                const free = shipment.data as FreeShipment;
                return (
                  <div 
                    key={shipment.id} 
                    className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openFreeDetails(free)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{getMaterialName(free.material_id)}</h3>
                        <p className="text-xs text-gray-600">{getColorName(free.color_id)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(free.shipped_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {free.comment && (
                          <p className="text-xs text-gray-600 mt-1 italic">{free.comment}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          Свободная
                        </span>
                        <span className="text-sm font-medium">{free.quantity} шт</span>
                      </div>
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      </CardContent>

      <ShipmentDetailsDialog
        isOpen={detailsDialog.open}
        onOpenChange={(open) => !open && closeDetails()}
        shipmentType={detailsDialog.type}
        orderData={detailsDialog.orderData}
        freeShipmentData={detailsDialog.freeData}
        getSectionName={getSectionName}
        getMaterialName={getMaterialName}
        getColorName={getColorName}
        getColorHex={getColorHex}
        onDelete={handleDelete}
      />
    </Card>
  );
}