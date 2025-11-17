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

export default function ReadyToSendRequests() {
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
      toast.error('Ошибка загрузки заявок');
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

  const handleBulkSend = async () => {
    if (selectedRequests.length === 0) return;

    const requestsToSend = readyRequests.filter(r => selectedRequests.includes(r.id));
    const requestNumbers = requestsToSend.map(r => r.request_number).join(', ');

    if (!confirm(`Отправить выбранные заявки (${selectedRequests.length} шт.)?

Номера: ${requestNumbers}`)) return;

    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedRequests) {
      try {
        const response = await fetch(`${REQUESTS_API}?type=requests&id=${id}&action=send`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'sent' })
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
      toast.success(`Отправлено заявок: ${successCount}`);
    }
    if (errorCount > 0) {
      toast.error(`Ошибок при отправке: ${errorCount}`);
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
    if (selectedRequests.length === readyRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(readyRequests.map(r => r.id));
    }
  };

  const readyRequests = requests.filter(r => r.status === 'completed');

  return (
    <TabsContent value="ready-to-send">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Готово к отправлению</CardTitle>
              <CardDescription>Заявки готовые к отправке заказчику</CardDescription>
            </div>
            {readyRequests.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  <Icon name={selectedRequests.length === readyRequests.length ? 'CheckSquare' : 'Square'} size={16} className="mr-1" />
                  {selectedRequests.length === readyRequests.length ? 'Снять всё' : 'Выбрать всё'}
                </Button>
                {selectedRequests.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkSend}
                  >
                    <Icon name="Send" size={16} className="mr-1" />
                    Отправить ({selectedRequests.length})
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {readyRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Нет готовых заявок
              </div>
            ) : (
              readyRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onSend={handleSendRequest}
                  showOnlySend
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