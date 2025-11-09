import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

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

interface WorkerOrdersProps {
  orders: Order[];
  materials: Material[];
  sections: Section[];
  colors: Color[];
  onUpdateItem: (orderId: number, itemId: number, quantityCompleted: number) => void;
  onRefresh: () => void;
}

export default function WorkerOrders({
  orders,
  materials,
  sections,
  colors,
  onUpdateItem,
  onRefresh
}: WorkerOrdersProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');

  const getSectionName = (id: number) => sections.find(s => s.id === id)?.name || '—';
  const getMaterialName = (id: number) => materials.find(m => m.id === id)?.name || '—';
  const getColorName = (id: number) => colors.find(c => c.id === id)?.name || '—';
  const getColorHex = (id: number) => colors.find(c => c.id === id)?.hex_code || '#000000';

  const getStatusColor = (status: string) => {
    if (status === 'new') return 'bg-red-500';
    if (status === 'in_progress') return 'bg-orange-500';
    if (status === 'completed') return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    if (status === 'new') return 'Новая';
    if (status === 'in_progress') return 'Выполняется';
    if (status === 'completed') return 'Исполнена';
    return status;
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'active') return order.status !== 'completed';
    if (statusFilter === 'completed') return order.status === 'completed';
    return true;
  });

  const handleUpdateQuantity = (itemId: number, currentValue: number) => {
    const newValue = prompt(`Введите выполненное количество (текущее: ${currentValue}):`, String(currentValue));
    if (newValue !== null && selectedOrder) {
      onUpdateItem(selectedOrder.id, itemId, Number(newValue));
      setDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  return (
    <TabsContent value="orders" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Заявки на производство</CardTitle>
              <CardDescription>Просмотр заявок и внесение выполненного объема</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <Icon name="RefreshCw" size={14} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Активные
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              Исполнены
            </Button>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Все
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => openOrderDetails(order)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.order_number}</CardTitle>
                    <Badge className={cn('text-white', getStatusColor(order.status))}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <CardDescription>{getSectionName(order.section_id)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Позиций:</span>
                      <span className="font-medium">{order.items?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Прогресс:</span>
                      <span className="font-medium">
                        {order.items?.reduce((sum, item) => sum + (item.quantity_completed || 0), 0)} / {order.items?.reduce((sum, item) => sum + item.quantity_required, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Заявка № {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              {getSectionName(selectedOrder?.section_id || 0)} • {getStatusText(selectedOrder?.status || '')}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {selectedOrder.comment && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Комментарий:</p>
                  <p className="text-sm text-gray-600">{selectedOrder.comment}</p>
                </div>
              )}

              <div className="space-y-3">
                <p className="font-medium">Материалы:</p>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{getMaterialName(item.material_id)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: getColorHex(item.color_id) }}
                          />
                          <span className="text-sm text-gray-600">{getColorName(item.color_id)}</span>
                        </div>
                      </div>
                      <Badge variant={item.quantity_completed >= item.quantity_required ? 'default' : 'outline'}>
                        {item.quantity_completed} / {item.quantity_required}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all',
                            item.quantity_completed >= item.quantity_required ? 'bg-green-500' : 'bg-orange-500'
                          )}
                          style={{
                            width: `${Math.min((item.quantity_completed / item.quantity_required) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity_completed)}
                        disabled={selectedOrder.status === 'completed'}
                      >
                        <Icon name="Edit" size={14} className="mr-1" />
                        Внести
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
