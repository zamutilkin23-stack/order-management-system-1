import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import RequestsFilters from './RequestsFilters';
import CreateRequestDialog from './CreateRequestDialog';
import RequestCard from './RequestCard';

const REQUESTS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';
const MATERIALS_API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

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
  const [materials, setMaterials] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    request_number: '',
    section_id: '',
    comment: '',
    items: [{ material_name: '', quantity_required: '', color: '', size: '', comment: '' }]
  });

  useEffect(() => {
    loadRequests();
    loadSections();
    loadMaterials();
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

  const loadMaterials = async () => {
    try {
      const response = await fetch(`${MATERIALS_API}?type=material`);
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      toast.error('Ошибка загрузки материалов');
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

  const handleBulkDelete = async () => {
    if (selectedRequests.length === 0) return;

    const requestsToDelete = requests.filter(r => selectedRequests.includes(r.id));
    const requestNumbers = requestsToDelete.map(r => r.request_number).join(', ');

    if (!confirm(`Удалить выбранные заявки (${selectedRequests.length} шт.)?

Номера: ${requestNumbers}

Заявки будут удалены безвозвратно.`)) return;

    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedRequests) {
      try {
        const response = await fetch(`${REQUESTS_API}?type=requests&id=${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Удалено заявок: ${successCount}`);
    }
    if (errorCount > 0) {
      toast.error(`Ошибок при удалении: ${errorCount}`);
    }

    setSelectedRequests([]);
    loadRequests();
  };

  const toggleSelectRequest = (id: number) => {
    setSelectedRequests(prev => 
      prev.includes(id) ? prev.filter(reqId => reqId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map(r => r.id));
    }
  };

  const handleSendRequest = async (id: number) => {
    if (!confirm('Отправить заявку?')) return;

    try {
      const response = await fetch(`${REQUESTS_API}?type=requests&id=${id}&action=send`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' })
      });

      if (response.ok) {
        toast.success('Заявка отправлена');
        loadRequests();
      } else {
        toast.error('Ошибка отправки');
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

  const filteredRequests = requests.filter(r => {
    if (r.status === 'sent') return false;
    
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    
    if (sectionFilter !== 'all' && String(r.section_id) !== sectionFilter) return false;
    
    if (dateFrom) {
      const requestDate = new Date(r.created_at);
      const fromDate = new Date(dateFrom);
      if (requestDate < fromDate) return false;
    }
    
    if (dateTo) {
      const requestDate = new Date(r.created_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (requestDate > toDate) return false;
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
                <CardDescription>Управление производственными заявками</CardDescription>
              </div>
            </div>
            
            <RequestsFilters
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sectionFilter={sectionFilter}
              setSectionFilter={setSectionFilter}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              sections={sections}
              onExportAll={exportAllToExcel}
              exportDisabled={filteredRequests.length === 0}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {filteredRequests.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                    >
                      <Icon name={selectedRequests.length === filteredRequests.length ? 'CheckSquare' : 'Square'} size={16} className="mr-1" />
                      {selectedRequests.length === filteredRequests.length ? 'Снять всё' : 'Выбрать всё'}
                    </Button>
                    {selectedRequests.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                      >
                        <Icon name="Trash2" size={16} className="mr-1" />
                        Удалить ({selectedRequests.length})
                      </Button>
                    )}
                  </>
                )}
              </div>
              <CreateRequestDialog
                dialogOpen={dialogOpen}
                setDialogOpen={setDialogOpen}
                formData={formData}
                setFormData={setFormData}
                sections={sections}
                materials={materials}
                onSubmit={handleSubmit}
              />
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
                <RequestCard
                  key={request.id}
                  request={request}
                  onPrint={printRequest}
                  onExport={exportToExcel}
                  onDelete={handleDelete}
                  onSend={handleSendRequest}
                  onUpdateQuantity={updateItemQuantity}
                  isSelected={selectedRequests.includes(request.id)}
                  onSelect={toggleSelectRequest}
                  showCheckbox
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}