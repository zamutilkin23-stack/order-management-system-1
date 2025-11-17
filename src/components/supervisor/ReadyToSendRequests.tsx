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

export default function ReadyToSendRequests() {
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

  const readyRequests = requests.filter(r => r.status === 'completed');

  return (
    <TabsContent value="ready-to-send">
      <Card>
        <CardHeader>
          <CardTitle>Готово к отправлению</CardTitle>
          <CardDescription>Заявки готовые к отправке заказчику</CardDescription>
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
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
