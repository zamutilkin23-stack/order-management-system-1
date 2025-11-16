import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

const REQUESTS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';

interface Request {
  id: number;
  request_number: string;
  section_id: number;
  section_name: string;
  status: 'new' | 'in_progress' | 'completed' | 'sent';
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

export default function RequestsWork() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');

  useEffect(() => {
    loadRequests();
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
          <div class="info-row"><div class="info-label">Дата:</div><div>${new Date(request.created_at).toLocaleDateString('ru-RU')}</div></div>
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
      ['Дата', new Date(request.created_at).toLocaleDateString('ru-RU')],
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

  const deleteRequest = async (id: number) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Новая</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Выполняется</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Готово</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Отправлено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(r => {
    // Исключаем отправленные заявки
    if (r.status === 'sent') return false;
    
    // Фильтр по статусу
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    
    // Фильтр по дате от
    if (dateFrom) {
      const requestDate = new Date(r.created_at);
      const fromDate = new Date(dateFrom);
      if (requestDate < fromDate) return false;
    }
    
    // Фильтр по дате до
    if (dateTo) {
      const requestDate = new Date(r.created_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (requestDate > toDate) return false;
    }
    
    // Поиск по тексту
    if (searchText) {
      const search = searchText.toLowerCase();
      const matchNumber = r.request_number.toLowerCase().includes(search);
      const matchSection = r.section_name.toLowerCase().includes(search);
      const matchComment = r.comment?.toLowerCase().includes(search);
      const matchMaterial = r.items.some(item => 
        item.material_name.toLowerCase().includes(search)
      );
      if (!matchNumber && !matchSection && !matchComment && !matchMaterial) return false;
    }
    
    return true;
  });

  return (
    <TabsContent value="requests">
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Заявки</CardTitle>
                <CardDescription>Производственные заявки для выполнения</CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-2 items-center flex-1">
                <Icon name="Search" size={16} className="text-gray-500" />
                <Input
                  placeholder="Поиск по номеру, разделу, материалу..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <div className="flex gap-2 items-center">
                <Label className="text-sm font-medium">Дата от:</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />
              </div>

              <div className="flex gap-2 items-center">
                <Label className="text-sm font-medium">до:</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />
              </div>

              {(searchText || dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchText('');
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  <Icon name="X" size={14} className="mr-1" />
                  Сбросить
                </Button>
              )}
            </div>

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
                В работе
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                Готово
              </Button>
              <Button
                variant={statusFilter === 'sent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('sent')}
              >
                Отправлено
              </Button>
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
                  request.status === 'completed' && 'border-l-green-500',
                  request.status === 'sent' && 'border-l-purple-500'
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
                          onClick={() => deleteRequest(request.id)}
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
                                <Icon name="Edit" size={14} className="mr-1" />
                                Изменить
                              </Button>
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