import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface Material {
  id: number;
  name: string;
  section_id: number;
  quantity: number;
  colors: Color[];
  auto_deduct?: boolean;
}

interface Color {
  id: number;
  name: string;
  hex_code: string;
}

interface ShipItem {
  material_id: number;
  color_id: number | null;
  quantity: number;
  is_defective: boolean;
  available_colors?: Color[];
  auto_deduct?: boolean;
}

interface FreeShipmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shipItems: ShipItem[];
  materials: Material[];
  shipmentComment: string;
  onCommentChange: (comment: string) => void;
  onUpdateItem: (index: number, field: string, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onShip: () => void;
}

export default function FreeShipmentDialog({
  isOpen,
  onOpenChange,
  shipItems,
  materials,
  shipmentComment,
  onCommentChange,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onShip
}: FreeShipmentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Отправка из остатков</DialogTitle>
          <DialogDescription>
            Выберите материалы и укажите количество для отправки
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {shipItems.map((item, index) => {
            const material = materials.find(m => m.id === item.material_id);
            
            return (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Позиция #{index + 1}</span>
                    {shipItems.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveItem(index)}
                      >
                        <Icon name="X" size={16} />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs mb-1">Материал *</Label>
                      <Select
                        value={String(item.material_id || '')}
                        onValueChange={(value) => onUpdateItem(index, 'material_id', Number(value))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Выберите материал" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map(m => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.name} (остаток: {m.quantity})
                              {m.auto_deduct && ' 🔄'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-1">Цвет *</Label>
                      <Select
                        value={String(item.color_id || '')}
                        onValueChange={(value) => onUpdateItem(index, 'color_id', Number(value))}
                        disabled={!item.material_id}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Цвет" />
                        </SelectTrigger>
                        <SelectContent>
                          {item.available_colors?.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded border"
                                  style={{ backgroundColor: c.hex_code }}
                                />
                                {c.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-1">Количество *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) => onUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="h-9"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={item.is_defective}
                      onCheckedChange={(checked) => onUpdateItem(index, 'is_defective', checked)}
                      id={`free-defective-${index}`}
                    />
                    <Label htmlFor={`free-defective-${index}`} className="text-sm cursor-pointer">
                      {item.is_defective ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <Icon name="AlertTriangle" size={14} />
                          Брак
                        </span>
                      ) : (
                        <span className="text-gray-600">Годный материал</span>
                      )}
                    </Label>
                    
                    {item.auto_deduct && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded ml-auto">
                        Автосписание включено
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <Button onClick={onAddItem} variant="outline" className="w-full">
            <Icon name="Plus" size={16} className="mr-2" />
            Добавить материал
          </Button>

          <div>
            <Label className="text-sm mb-2">Комментарий</Label>
            <Input
              value={shipmentComment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Получатель, номер накладной и т.д."
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
          <p className="flex items-center gap-2 text-blue-900">
            <Icon name="Info" size={16} />
            <span>
              Материалы с автосписанием будут списаны со склада автоматически. 
              Бракованные материалы не списываются.
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={onShip} className="flex-1">
            <Icon name="Send" size={16} className="mr-2" />
            Отправить
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
