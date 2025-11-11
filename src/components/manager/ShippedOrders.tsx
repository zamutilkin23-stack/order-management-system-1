import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const ORDERS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';

interface Order {
  id: number;
  order_number: string;
  section_id: number;
  status: string;
  comment: string;
  created_at: string;
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
}

export default function ShippedOrders({ orders, materials, sections, colors, userId, onRefresh }: ShippedOrdersProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shipItems, setShipItems] = useState<ShipItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const completedOrders = orders.filter(o => o.status === 'completed');
  const shippedOrders = orders.filter(o => o.status === 'shipped');

  const getSectionName = (id: number) => sections.find(s => s.id === id)?.name || '—';
  const getMaterialName = (id: number) => materials.find(m => m.id === id)?.name || '—';
  const getColorName = (id: number) => colors.find(c => c.id === id)?.name || '—';

  const openShipDialog = (order: Order) => {
    setSelectedOrder(order);
    setShipItems(order.items.map(item => ({
      material_id: item.material_id,
      color_id: item.color_id,
      quantity: item.quantity_completed,
      is_defective: false
    })));
    setIsDialogOpen(true);
  };

  const handleShip = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(ORDERS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrder.id,
          status: 'shipped',
          shipped_items: shipItems,
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

  return (
    <TabsContent value="shipped">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="PackageCheck" size={20} />
              Готово к отправке
            </CardTitle>
            <CardDescription>
              Исполненные заявки готовые к отправке
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon name="PackageOpen" size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Нет готовых заявок</p>
                </div>
              ) : (
                completedOrders.map(order => (
                  <div key={order.id} className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-white">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">№ {order.order_number}</h3>
                        <p className="text-sm text-gray-600">{getSectionName(order.section_id)}</p>
                      </div>
                      <Button onClick={() => openShipDialog(order)} size="sm">
                        <Icon name="Send" size={16} className="mr-2" />
                        Отправить
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                          <span>{getMaterialName(item.material_id)}</span>
                          <span className="text-gray-600">{getColorName(item.color_id)}</span>
                          <span className="font-medium">{item.quantity_completed} шт</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="PackageCheck" size={20} className="text-blue-600" />
              Отправленные
            </CardTitle>
            <CardDescription>
              История отправленных заявок
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shippedOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon name="Archive" size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Нет отправленных заявок</p>
                </div>
              ) : (
                shippedOrders.map(order => (
                  <div key={order.id} className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">№ {order.order_number}</h3>
                        <p className="text-xs text-gray-600">{getSectionName(order.section_id)}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Отправлено
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Отправка заявки № {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Проверьте количество и отметьте бракованные материалы
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {shipItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <p className="font-medium text-sm mb-1">
                      {getMaterialName(item.material_id)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {getColorName(item.color_id || 0)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs mb-1">Количество</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={item.is_defective}
                      onCheckedChange={() => toggleDefective(index)}
                      id={`defective-${index}`}
                    />
                    <Label 
                      htmlFor={`defective-${index}`}
                      className="text-sm cursor-pointer"
                    >
                      {item.is_defective ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <Icon name="AlertTriangle" size={14} />
                          Брак
                        </span>
                      ) : (
                        <span className="text-gray-600">Годный</span>
                      )}
                    </Label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <p className="flex items-center gap-2 text-blue-900">
              <Icon name="Info" size={16} />
              <span>
                Годные материалы будут автоматически списаны со склада. 
                Бракованные материалы списываться не будут.
              </span>
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleShip} className="flex-1">
              <Icon name="Send" size={16} className="mr-2" />
              Отправить и списать
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
