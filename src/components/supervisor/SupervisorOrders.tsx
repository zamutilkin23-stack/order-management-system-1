import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface SupervisorOrdersProps {
  orders: Order[];
  materials: Material[];
  sections: Section[];
  colors: Color[];
  onRefresh: () => void;
}

export default function SupervisorOrders({
  orders,
  materials,
  sections,
  colors,
  onRefresh
}: SupervisorOrdersProps) {
  const [statusFilter, setStatusFilter] = useState('all');

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

  const getSectionName = (id: number) => sections.find(s => s.id === id)?.name || '—';
  const getMaterialName = (id: number) => materials.find(m => m.id === id)?.name || '—';
  const getColorName = (id: number) => colors.find(c => c.id === id)?.name || '—';

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Заявка ${order.order_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .comment { margin-top: 20px; padding: 10px; background: #f9f9f9; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Производственная заявка № ${order.order_number}</h1>
        <p><strong>Раздел:</strong> ${getSectionName(order.section_id)}</p>
        <p><strong>Статус:</strong> ${getStatusText(order.status)}</p>
        <p><strong>Дата создания:</strong> ${new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
        
        <table>
          <thead>
            <tr>
              <th>Материал</th>
              <th>Цвет</th>
              <th>Требуется</th>
              <th>Выполнено</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${getMaterialName(item.material_id)}</td>
                <td>${getColorName(item.color_id)}</td>
                <td>${item.quantity_required}</td>
                <td>${item.quantity_completed}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${order.comment ? `<div class="comment"><strong>Комментарий:</strong> ${order.comment}</div>` : ''}
        
        <script>window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <TabsContent value="orders" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Производственные заявки</CardTitle>
              <CardDescription>Просмотр заявок (только чтение)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <Icon name="RefreshCw" size={14} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Все ({orders.length})
            </Button>
            <Button
              variant={statusFilter === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('new')}
            >
              Новые ({orders.filter(o => o.status === 'new').length})
            </Button>
            <Button
              variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('in_progress')}
            >
              В работе ({orders.filter(o => o.status === 'in_progress').length})
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              Завершено ({orders.filter(o => o.status === 'completed').length})
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Раздел</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Материалы</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Нет заявок
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{getSectionName(order.section_id)}</TableCell>
                    <TableCell>
                      <Badge className={cn(getStatusColor(order.status), 'text-white')}>
                        {getStatusText(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            {getMaterialName(item.material_id)} ({item.quantity_completed}/{item.quantity_required})
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => printOrder(order)}
                      >
                        <Icon name="Printer" size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
