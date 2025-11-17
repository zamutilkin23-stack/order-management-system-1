import { useState } from 'react';
import { toast } from 'sonner';
import { Request } from './useRequestsData';

const REQUESTS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';

interface UseRequestsSelectionProps {
  requests: Request[];
  filteredRequests: Request[];
  loadRequests: () => void;
}

export function useRequestsSelection({ requests, filteredRequests, loadRequests }: UseRequestsSelectionProps) {
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);

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

  return {
    selectedRequests,
    handleBulkDelete,
    toggleSelectRequest,
    toggleSelectAll,
  };
}
