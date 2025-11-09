import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

interface OrdersSectionProps {
  orders: Order[];
  materials: Material[];
  sections: Section[];
  colors: Color[];
  loading: boolean;
  onCreateOrder: (orderData: any) => Promise<boolean>;
  onDeleteOrder: (orderId: number) => void;
  onRefresh: () => void;
}

export default function OrdersSection({
  orders,
  materials,
  sections,
  colors,
  loading,
  onCreateOrder,
  onDeleteOrder,
  onRefresh
}: OrdersSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    order_number: '',
    section_id: '',
    comment: '',
    items: [{ material_id: '', color_id: '', quantity_required: 0 }]
  });

  const handleSubmit = async () => {
    if (!formData.order_number || !formData.section_id || formData.items.length === 0) {
      return;
    }

    const success = await onCreateOrder({
      order_number: formData.order_number,
      section_id: Number(formData.section_id),
      comment: formData.comment,
      items: formData.items.map(item => ({
        material_id: Number(item.material_id),
        color_id: Number(item.color_id) || null,
        quantity_required: Number(item.quantity_required)
      }))
    });

    if (success) {
      setDialogOpen(false);
      setFormData({
        order_number: '',
        section_id: '',
        comment: '',
        items: [{ material_id: '', color_id: '', quantity_required: 0 }]
      });
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { material_id: '', color_id: '', quantity_required: 0 }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

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

  const sectionMaterials = materials.filter(m => m.section_id === Number(formData.section_id));

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
              <CardTitle>Управление заявками</CardTitle>
              <CardDescription>Создание и отслеживание производственных заявок</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <Icon name="RefreshCw" size={14} />
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Icon name="Plus" size={16} className="mr-2" />
                    Создать заявку
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Новая заявка</DialogTitle>
                    <DialogDescription>Создайте заявку на производство</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Номер заявки</Label>
                        <Input
                          value={formData.order_number}
                          onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                          placeholder="2024-001"
                        />
                      </div>
                      <div>
                        <Label>Раздел</Label>
                        <Select value={formData.section_id} onValueChange={(value) => setFormData({ ...formData, section_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите раздел" />
                          </SelectTrigger>
                          <SelectContent>
                            {sections.map(s => (
                              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Комментарий</Label>
                      <Textarea
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        placeholder="Дополнительная информация"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base">Материалы</Label>
                        <Button size="sm" variant="outline" onClick={addItem}>
                          <Icon name="Plus" size={14} className="mr-1" />
                          Добавить
                        </Button>
                      </div>

                      {formData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-3 items-end">
                          <div className="col-span-5">
                            <Label className="text-xs">Материал</Label>
                            <Select value={item.material_id} onValueChange={(value) => updateItem(index, 'material_id', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите" />
                              </SelectTrigger>
                              <SelectContent>
                                {sectionMaterials.map(m => (
                                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Label className="text-xs">Цвет</Label>
                            <Select value={item.color_id} onValueChange={(value) => updateItem(index, 'color_id', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Цвет" />
                              </SelectTrigger>
                              <SelectContent>
                                {colors.map(c => (
                                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Label className="text-xs">Количество</Label>
                            <Input
                              type="number"
                              value={item.quantity_required}
                              onChange={(e) => updateItem(index, 'quantity_required', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(index)}
                              disabled={formData.items.length === 1}
                            >
                              <Icon name="X" size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button onClick={handleSubmit} className="w-full" disabled={loading}>
                      {loading ? 'Создание...' : 'Создать заявку'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Все
            </Button>
            <Button
              variant={statusFilter === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('new')}
            >
              Новые
            </Button>
            <Button
              variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('in_progress')}
            >
              Выполняются
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              Исполнены
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Статус</TableHead>
                <TableHead>Номер</TableHead>
                <TableHead>Раздел</TableHead>
                <TableHead>Материалов</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Badge className={cn('text-white', getStatusColor(order.status))}>
                      {getStatusText(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{getSectionName(order.section_id)}</TableCell>
                  <TableCell>{order.items?.length || 0}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printOrder(order)}
                    >
                      <Icon name="Printer" size={14} className="mr-1" />
                      Печать
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteOrder(order.id)}
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
