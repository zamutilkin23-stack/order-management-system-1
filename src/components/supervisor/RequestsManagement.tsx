import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

const REQUESTS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';
const MATERIALS_API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

interface Request {
  id: number;
  request_number: string;
  section_id: number;
  section_name: string;
  status: 'new' | 'in_progress' | 'completed';
  comment: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  items: RequestItem[];
}

interface RequestItem {
  id: number;
  request_id: number;
  material_name: string;
  quantity_required: number | null;
  quantity_completed: number;
  color: string | null;
  size: string | null;
  comment: string;
}

interface Section {
  id: number;
  name: string;
}

interface RequestsManagementProps {
  userId: number;
}

export default function RequestsManagement({ userId }: RequestsManagementProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    request_number: '',
    section_id: '',
    comment: '',
    items: [{ material_name: '', quantity_required: '', color: '', size: '', comment: '' }]
  });

  useEffect(() => {
    loadRequests();
    loadSections();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await fetch(REQUESTS_API + '?type=requests');
      const data = await response.json();
      setRequests(data || []);
    } catch (error) {
      toast.error('Ошибка загрузки заявок');
    }
  };

  const loadSections = async () => {
    try {
      const response = await fetch(`${MATERIALS_API}?type=section`);
      const data = await response.json();
      setSections(data);
    } catch (error) {
      toast.error('Ошибка загрузки разделов');
    }
  };

  const handleSubmit = async () => {
    if (!formData.request_number.trim() || !formData.section_id) {
      toast.error('Заполните номер заявки и раздел');
      return;
    }

    const validItems = formData.items.filter(item => item.material_name.trim());
    if (validItems.length === 0) {
      toast.error('Добавьте хотя бы один материал');
      return;
    }

    try {
      const response = await fetch(REQUESTS_API + '?type=requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_number: formData.request_number,
          section_id: Number(formData.section_id),
          comment: formData.comment,
          created_by: userId,
          items: validItems.map(item => ({
            material_name: item.material_name,
            quantity_required: item.quantity_required ? Number(item.quantity_required) : null,
            color: item.color || null,
            size: item.size || null,
            comment: item.comment || ''
          }))
        })
      });

      if (response.ok) {
        toast.success('Заявка создана');
        setDialogOpen(false);
        setFormData({
          request_number: '',
          section_id: '',
          comment: '',
          items: [{ material_name: '', quantity_required: '', color: '', size: '', comment: '' }]
        });
        loadRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка создания');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить заявку?')) return;

    try {
      const response = await fetch(`${REQUESTS_API}?type=requests&id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Заявка удалена');
        loadRequests();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const updateItemQuantity = async (itemId: number, quantityCompleted: number) => {
    try {
      const response = await fetch(REQUESTS_API + '?type=requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          quantity_completed: quantityCompleted
        })
      });

      if (response.ok) {
        toast.success('Количество обновлено');
        loadRequests();
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { material_name: '', quantity_required: '', color: '', size: '', comment: '' }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const printRequest = (request: Request) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const statusText = request.status === 'new' ? 'Новая' : request.status === 'in_progress' ? 'Выполняется' : 'Готово';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Заявка ${request.request_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 10px; }
          .info-label { font-weight: bold; width: 150px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .footer { margin-top: 40px; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ЗАЯВКА № ${request.request_number}</h1>
        </div>
        <div class="info">
          <div class="info-row"><div class="info-label">Статус:</div><div>${statusText}</div></div>
          <div class="info-row"><div class="info-label">Раздел:</div><div>${request.section_name}</div></div>
          <div class="info-row"><div class="info-label">Создал:</div><div>${request.created_by_name}</div></div>
          <div class="info-row"><div class="info-label">Дата создания:</div><div>${new Date(request.created_at).toLocaleDateString('ru-RU')}</div></div>
          ${request.comment ? `<div class="info-row"><div class="info-label">Комментарий:</div><div>${request.comment}</div></div>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Материал</th>
              <th>Требуется</th>
              <th>Выполнено</th>
              <th>Цвет</th>
              <th>Размер</th>
              <th>Примечание</th>
            </tr>
          </thead>
          <tbody>
            ${request.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.material_name}</td>
                <td>${item.quantity_required ?? '—'}</td>
                <td>${item.quantity_completed}</td>
                <td>${item.color || '—'}</td>
                <td>${item.size || '—'}</td>
                <td>${item.comment || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Подпись: _______________________</p>
          <p>Дата: _______________________</p>
        </div>
        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer;">Печать</button>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportToExcel = (request: Request) => {
    const statusText = request.status === 'new' ? 'Новая' : request.status === 'in_progress' ? 'Выполняется' : 'Готово';

    const worksheetData = [
      ['ЗАЯВКА №', request.request_number],
      ['Статус', statusText],
      ['Раздел', request.section_name],
      ['Создал', request.created_by_name],
      ['Дата создания', new Date(request.created_at).toLocaleDateString('ru-RU')],
      ['Комментарий', request.comment || ''],
      [],
      ['№', 'Материал', 'Требуется', 'Выполнено', 'Цвет', 'Размер', 'Примечание'],
      ...request.items.map((item, index) => [
        index + 1,
        item.material_name,
        item.quantity_required ?? '',
        item.quantity_completed,
        item.color || '',
        item.size || '',
        item.comment || ''
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Заявка');
    XLSX.writeFile(workbook, `Заявка_${request.request_number}.xlsx`);
    toast.success('Экспорт в Excel выполнен');
  };

  const exportAllToExcel = () => {
    const worksheetData = [
      ['ВСЕ ЗАЯВКИ'],
      [],
      ['№', 'Номер', 'Статус', 'Раздел', 'Создал', 'Дата', 'Количество позиций'],
      ...filteredRequests.map((req, index) => {
        const statusText = req.status === 'new' ? 'Новая' : req.status === 'in_progress' ? 'Выполняется' : 'Готово';
        return [
          index + 1,
          req.request_number,
          statusText,
          req.section_name,
          req.created_by_name,
          new Date(req.created_at).toLocaleDateString('ru-RU'),
          req.items.length
        ];
      })
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Заявки');
    XLSX.writeFile(workbook, `Заявки_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
    toast.success('Экспорт всех заявок выполнен');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Новая</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Выполняется</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Готово</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(r => r.status === statusFilter);

  return (
    <TabsContent value="requests">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Заявки</CardTitle>
              <CardDescription>Управление производственными заявками</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
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
                  В работе
                </Button>
                <Button
                  variant={statusFilter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('completed')}
                >
                  Готово
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={exportAllToExcel}
                disabled={filteredRequests.length === 0}
              >
                <Icon name="Download" size={16} className="mr-2" />
                Экспорт в Excel
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Icon name="Plus" size={16} className="mr-2" />
                    Создать заявку
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Новая заявка</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Номер заявки</Label>
                        <Input
                          value={formData.request_number}
                          onChange={(e) => setFormData({ ...formData, request_number: e.target.value })}
                          placeholder="Например: ЗАВ-001"
                        />
                      </div>
                      <div>
                        <Label>Раздел</Label>
                        <Select
                          value={formData.section_id}
                          onValueChange={(value) => setFormData({ ...formData, section_id: value })}
                        >
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

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Материалы</Label>
                        <Button size="sm" variant="outline" onClick={addItem}>
                          <Icon name="Plus" size={14} className="mr-1" />
                          Добавить
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {formData.items.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                            <div className="col-span-3">
                              <Label className="text-xs">Название</Label>
                              <Input
                                value={item.material_name}
                                onChange={(e) => updateItem(index, 'material_name', e.target.value)}
                                placeholder="Материал"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Количество</Label>
                              <Input
                                type="number"
                                value={item.quantity_required}
                                onChange={(e) => updateItem(index, 'quantity_required', e.target.value)}
                                placeholder="необязательно"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Цвет</Label>
                              <Input
                                value={item.color}
                                onChange={(e) => updateItem(index, 'color', e.target.value)}
                                placeholder="необязательно"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Размер</Label>
                              <Input
                                value={item.size}
                                onChange={(e) => updateItem(index, 'size', e.target.value)}
                                placeholder="необязательно"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Примечание</Label>
                              <Input
                                value={item.comment}
                                onChange={(e) => updateItem(index, 'comment', e.target.value)}
                                placeholder="необязательно"
                              />
                            </div>
                            <div className="col-span-1 flex items-end">
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
                    </div>

                    <Button onClick={handleSubmit} className="w-full">
                      Создать заявку
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Заявки не найдены
              </div>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className={cn('border-l-4', 
                  request.status === 'new' && 'border-l-blue-500',
                  request.status === 'in_progress' && 'border-l-yellow-500',
                  request.status === 'completed' && 'border-l-green-500'
                )}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{request.request_number}</CardTitle>
                          {getStatusBadge(request.status)}
                        </div>
                        <CardDescription className="mt-1">
                          {request.section_name} • {request.created_by_name} • {new Date(request.created_at).toLocaleDateString('ru-RU')}
                        </CardDescription>
                        {request.comment && (
                          <p className="text-sm text-gray-600 mt-2">{request.comment}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printRequest(request)}
                        >
                          <Icon name="Printer" size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportToExcel(request)}
                        >
                          <Icon name="Download" size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(request.id)}
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Материал</TableHead>
                          <TableHead>Требуется</TableHead>
                          <TableHead>Выполнено</TableHead>
                          <TableHead>Цвет</TableHead>
                          <TableHead>Размер</TableHead>
                          <TableHead>Примечание</TableHead>
                          <TableHead>Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {request.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.material_name}</TableCell>
                            <TableCell>{item.quantity_required ?? '—'}</TableCell>
                            <TableCell className="font-mono">
                              <span className={cn(
                                item.quantity_required && item.quantity_completed >= item.quantity_required && 'text-green-600 font-bold'
                              )}>
                                {item.quantity_completed}
                              </span>
                            </TableCell>
                            <TableCell>{item.color || '—'}</TableCell>
                            <TableCell>{item.size || '—'}</TableCell>
                            <TableCell className="text-sm text-gray-600">{item.comment || '—'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newQty = prompt('Введите выполненное количество:', String(item.quantity_completed));
                                    if (newQty !== null) {
                                      updateItemQuantity(item.id, Number(newQty));
                                    }
                                  }}
                                >
                                  <Icon name="Edit" size={14} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}