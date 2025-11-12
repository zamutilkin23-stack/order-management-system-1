import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface OrderShipmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: Order | null;
  shipItems: ShipItem[];
  materials: Material[];
  getMaterialName: (id: number) => string;
  getColorName: (id: number) => string;
  getColorHex: (id: number) => string;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onToggleDefective: (index: number) => void;
  onShip: () => void;
  onUpdateColor: (index: number, colorId: number | null) => void;
}

export default function OrderShipmentDialog({
  isOpen,
  onOpenChange,
  selectedOrder,
  shipItems,
  materials,
  getMaterialName,
  getColorName,
  getColorHex,
  onUpdateQuantity,
  onToggleDefective,
  onShip,
  onUpdateColor
}: OrderShipmentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Отправка заявки № {selectedOrder?.order_number}</DialogTitle>
          <DialogDescription>
            Проверьте количество и отметьте бракованные материалы
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {shipItems.map((item, index) => {
            const material = materials.find(m => m.id === item.material_id);
            const needsColor = !item.color_id || item.color_id === 0;
            
            return (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">
                        {getMaterialName(item.material_id)}
                      </p>
                      {needsColor && (
                        <p className="text-xs text-orange-600 flex items-center gap-1">
                          <Icon name="AlertCircle" size={12} />
                          Требуется указать цвет
                        </p>
                      )}
                    </div>
                    {material?.auto_deduct && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Автосписание
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs mb-1">Цвет *</Label>
                      <Select
                        value={String(item.color_id || '')}
                        onValueChange={(value) => onUpdateColor(index, value ? Number(value) : null)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Выберите цвет" />
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
                      <Label className="text-xs mb-1">Количество</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <Checkbox
                        checked={item.is_defective}
                        onCheckedChange={() => onToggleDefective(index)}
                        id={`defective-${index}`}
                      />
                      <Label 
                        htmlFor={`defective-${index}`}
                        className="text-sm cursor-pointer"
                      >
                        {item.is_defective ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <Icon name="AlertTriangle" size={14} />
                            Брак
                          </span>
                        ) : (
                          <span className="text-gray-600">Годный</span>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
          <p className="flex items-center gap-2 text-blue-900">
            <Icon name="Info" size={16} />
            <span>
              Годные материалы будут автоматически списаны со склада. 
              Бракованные материалы списываться не будут.
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={onShip} className="flex-1">
            <Icon name="Send" size={16} className="mr-2" />
            Отправить и списать
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
