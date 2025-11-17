import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import RequestCard from './RequestCard';

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

export default function SentArchive() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await fetch(REQUESTS_API + '?type=requests');
      const data = await response.json();
      setRequests(data || []);
    } catch (error) {
      toast.error('Ошибка загрузки архива');
    }
  };

  const handleDelete = async (id: number, requestNumber: string) => {
    if (!confirm(`Удалить заявку "${requestNumber}" из архива?\n\nЗаявка будет удалена безвозвратно.`)) return;

    try {
      const response = await fetch(`${REQUESTS_API}?type=requests&id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success(`Заявка "${requestNumber}" удалена`);
        loadRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRequests.length === 0) return;

    const requestsToDelete = sentRequests.filter(r => selectedRequests.includes(r.id));
    const requestNumbers = requestsToDelete.map(r => r.request_number).join(', ');

    if (!confirm(`Удалить выбранные заявки из архива (${selectedRequests.length} шт.)?\n\nНомера: ${requestNumbers}\n\nЗаявки будут удалены безвозвратно.`)) return;

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
    if (selectedRequests.length === sentRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(sentRequests.map(r => r.id));
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

  const sentRequests = requests.filter(r => r.status === 'sent');

  return (
    <TabsContent value="sent-archive">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Архив отправленных заявок</CardTitle>
              <CardDescription>Заявки, которые были отправлены заказчику</CardDescription>
            </div>
            {sentRequests.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  <Icon name={selectedRequests.length === sentRequests.length ? 'CheckSquare' : 'Square'} size={16} className="mr-1" />
                  {selectedRequests.length === sentRequests.length ? 'Снять всё' : 'Выбрать всё'}
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
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sentRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Архив пуст
              </div>
            ) : (
              sentRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onDelete={handleDelete}
                  onUpdateQuantity={updateItemQuantity}
                  allowEdit
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