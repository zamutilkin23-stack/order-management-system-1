import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface Order {
  id: number;
  order_number: string;
  section_id: number;
  status: string;
  comment: string;
  created_at: string;
  shipped_at?: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  material_id: number;
  color_id: number;
  quantity_required: number;
  quantity_completed: number;
}

interface FreeShipment {
  id: number;
  material_id: number;
  color_id: number;
  quantity: number;
  is_defective: boolean;
  shipped_by: number;
  comment: string;
  shipped_at: string;
}

interface ShipmentDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentType: 'order' | 'free' | null;
  orderData?: Order;
  freeShipmentData?: FreeShipment;
  getSectionName: (id: number) => string;
  getMaterialName: (id: number) => string;
  getColorName: (id: number) => string;
  getColorHex: (id: number) => string;
  onDelete?: (type: 'order' | 'free', id: number) => Promise<void>;
}

export default function ShipmentDetailsDialog({
  isOpen,
  onOpenChange,
  shipmentType,
  orderData,
  freeShipmentData,
  getSectionName,
  getMaterialName,
  getColorName,
  getColorHex,
  onDelete
}: ShipmentDetailsDialogProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!shipmentType) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      if (shipmentType === 'order' && orderData) {
        await onDelete('order', orderData.id);
      } else if (shipmentType === 'free' && freeShipmentData) {
        await onDelete('free', freeShipmentData.id);
      }
      setShowDeleteAlert(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name={shipmentType === 'order' ? 'Package' : 'PackagePlus'} size={20} />
            {shipmentType === 'order' ? 'Детали заявки' : 'Детали свободной отправки'}
          </DialogTitle>
          <DialogDescription>
            Информация об отправке
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {shipmentType === 'order' && orderData && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Номер заявки</p>
                  <p className="font-semibold text-lg">№ {orderData.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Раздел</p>
                  <p className="font-medium">{getSectionName(orderData.section_id)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Создана</p>
                  <p className="text-sm">{formatDate(orderData.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Отправлена</p>
                  <p className="text-sm">{orderData.shipped_at ? formatDate(orderData.shipped_at) : '—'}</p>
                </div>
              </div>

              {orderData.comment && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Комментарий</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{orderData.comment}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-3">Материалы</p>
                <div className="space-y-2">
                  {orderData.items.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{getMaterialName(item.material_id)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: getColorHex(item.color_id) }}
                            />
                            <span className="text-xs text-gray-600">{getColorName(item.color_id)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{item.quantity_completed} шт</p>
                        <p className="text-xs text-gray-500">из {item.quantity_required} шт</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {shipmentType === 'free' && freeShipmentData && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Материал</p>
                  <p className="font-semibold text-lg">{getMaterialName(freeShipmentData.material_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Количество</p>
                  <p className="font-semibold text-lg">{freeShipmentData.quantity} шт</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Цвет</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: getColorHex(freeShipmentData.color_id) }}
                    />
                    <p className="font-medium">{getColorName(freeShipmentData.color_id)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Статус</p>
                  <div className="flex items-center gap-2">
                    {freeShipmentData.is_defective ? (
                      <>
                        <Icon name="AlertTriangle" size={16} className="text-red-600" />
                        <span className="text-red-600 font-medium">Брак</span>
                      </>
                    ) : (
                      <>
                        <Icon name="CheckCircle2" size={16} className="text-green-600" />
                        <span className="text-green-600 font-medium">Годный</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Дата отправки</p>
                <p className="text-sm">{formatDate(freeShipmentData.shipped_at)}</p>
              </div>

              {freeShipmentData.comment && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Комментарий</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{freeShipmentData.comment}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-900 flex items-center gap-2">
            <Icon name="Info" size={16} />
            {shipmentType === 'order' 
              ? 'Годные материалы были автоматически списаны со склада'
              : freeShipmentData?.is_defective 
                ? 'Бракованный материал не был списан со склада'
                : 'Годный материал был автоматически списан со склада'
            }
          </p>
        </div>

        {onDelete && (
          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={handleDeleteClick}
              className="gap-2"
            >
              <Icon name="Trash2" size={16} />
              Удалить отправку
            </Button>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить отправку?</AlertDialogTitle>
            <AlertDialogDescription>
              {shipmentType === 'order' 
                ? 'Отправленная заявка будет удалена, заявка вернется в статус "Исполнена". Материалы НЕ будут возвращены на склад.'
                : 'Свободная отправка будет удалена. Материалы НЕ будут возвращены на склад.'
              }
              <br /><br />
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}