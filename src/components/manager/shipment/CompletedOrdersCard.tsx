import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

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

interface CompletedOrdersCardProps {
  completedOrders: Order[];
  getSectionName: (id: number) => string;
  getMaterialName: (id: number) => string;
  getColorName: (id: number) => string;
  onOpenShipDialog: (order: Order) => void;
  onOpenFreeShipmentDialog: () => void;
}

export default function CompletedOrdersCard({
  completedOrders,
  getSectionName,
  getMaterialName,
  getColorName,
  onOpenShipDialog,
  onOpenFreeShipmentDialog
}: CompletedOrdersCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="PackageCheck" size={20} />
              Готово к отправке
            </CardTitle>
            <CardDescription>
              Исполненные заявки готовые к отправке
            </CardDescription>
          </div>
          <Button onClick={onOpenFreeShipmentDialog} size="sm" variant="outline">
            <Icon name="PackagePlus" size={16} className="mr-2" />
            Отправить из остатков
          </Button>
        </div>
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
                  <Button onClick={() => onOpenShipDialog(order)} size="sm">
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
  );
}
