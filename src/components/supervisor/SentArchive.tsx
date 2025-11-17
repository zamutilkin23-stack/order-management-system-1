import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
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

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить заявку из архива?')) return;

    try {
      const response = await fetch(`${REQUESTS_API}?type=requests&id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Заявка удалена');
        loadRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка удаления');
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

  const sentRequests = requests.filter(r => r.status === 'sent');

  return (
    <TabsContent value="sent-archive">
      <Card>
        <CardHeader>
          <CardTitle>Архив отправленных заявок</CardTitle>
          <CardDescription>Заявки, которые были отправлены заказчику</CardDescription>
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
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}