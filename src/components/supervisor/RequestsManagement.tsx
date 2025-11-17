import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import RequestsFilters from './RequestsFilters';
import CreateRequestDialog from './CreateRequestDialog';
import RequestCard from './RequestCard';
import { useRequestsData } from './hooks/useRequestsData';
import { useRequestsActions } from './hooks/useRequestsActions';
import { useRequestsSelection } from './hooks/useRequestsSelection';
import { printRequest, exportToExcel, exportAllToExcel } from './utils/requestsExportUtils';

interface RequestsManagementProps {
  userId: number;
}

export default function RequestsManagement({ userId }: RequestsManagementProps) {
  const { requests, sections, materials, loadRequests } = useRequestsData();
  const { handleSubmit, handleDelete, handleSendRequest, updateItemQuantity } = useRequestsActions({ loadRequests });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [formData, setFormData] = useState({
    request_number: '',
    section_id: '',
    comment: '',
    items: [{ material_name: '', quantity_required: '', color: '', size: '', comment: '' }]
  });

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

  const { selectedRequests, handleBulkDelete, toggleSelectRequest, toggleSelectAll } = useRequestsSelection({
    requests,
    filteredRequests,
    loadRequests
  });

  const onSubmit = () => handleSubmit(formData, userId, setDialogOpen, setFormData);

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
              onExportAll={() => exportAllToExcel(filteredRequests)}
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
                onSubmit={onSubmit}
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
