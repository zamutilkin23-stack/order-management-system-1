import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { useInventoryActions } from './hooks/useInventoryActions';
import { getSectionName, filterMaterials, printInventory } from './utils/inventoryUtils';

interface Material {
  id: number;
  name: string;
  section_id: number;
  quantity: number;
  colors: Color[];
  color_inventory?: Array<{
    color_id: number;
    quantity: number;
    color_name: string;
    hex_code: string;
  }>;
  auto_deduct?: boolean;
}

interface Section {
  id: number;
  name: string;
}

interface Color {
  id: number;
  name: string;
  hex_code: string;
}

interface MaterialsInventoryProps {
  materials: Material[];
  sections: Section[];
  onUpdateQuantity: (materialId: number, change: number, comment: string) => void;
  onRefresh: () => void;
}

export default function MaterialsInventory({
  materials,
  sections,
  onUpdateQuantity,
  onRefresh
}: MaterialsInventoryProps) {
  const { handleManualDeduct, handleShipSubmit } = useInventoryActions({ onRefresh });

  const [sectionFilter, setSectionFilter] = useState('all');
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [shipFormData, setShipFormData] = useState({
    color_id: '',
    quantity: 0,
    recipient: '',
    comment: ''
  });

  const [manualDeductDialog, setManualDeductDialog] = useState(false);
  const [deductMaterial, setDeductMaterial] = useState<Material | null>(null);
  const [deductFormData, setDeductFormData] = useState({
    color_id: '',
    quantity: 0,
    comment: ''
  });

  const handleQuantityChange = (materialId: number) => {
    const amount = prompt('Введите количество для добавления (отрицательное для списания):');
    if (amount) {
      const change = Number(amount);
      const comment = prompt('Комментарий (необязательно):') || '';
      onUpdateQuantity(materialId, change, comment);
    }
  };

  const openManualDeductDialog = (material: Material) => {
    setDeductMaterial(material);
    setDeductFormData({
      color_id: '',
      quantity: 0,
      comment: ''
    });
    setManualDeductDialog(true);
  };

  const openShipDialog = (material: Material) => {
    setSelectedMaterial(material);
    setShipFormData({
      color_id: '',
      quantity: 0,
      recipient: '',
      comment: ''
    });
    setShipDialogOpen(true);
  };

  const onManualDeduct = () => handleManualDeduct(deductMaterial, deductFormData, setManualDeductDialog);
  const onShipSubmit = () => handleShipSubmit(selectedMaterial, shipFormData, setShipDialogOpen);

  const filteredMaterials = filterMaterials(materials, sectionFilter);

  return (
    <TabsContent value="inventory" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Остатки материалов</CardTitle>
              <CardDescription>Учет складских остатков (материалы с количеством &lt; 10 подсвечены красным)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <Icon name="RefreshCw" size={14} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => printInventory(filteredMaterials, sections)}>
                <Icon name="Printer" size={16} className="mr-1" />
                Печать
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Раздел:</span>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все разделы</SelectItem>
                {sections.map(section => (
                  <SelectItem key={section.id} value={String(section.id)}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Материал</TableHead>
                <TableHead>Раздел</TableHead>
                <TableHead>Количество</TableHead>
                <TableHead>Цвета на складе</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map(material => (
                <TableRow key={material.id} className={cn(material.quantity < 10 && 'bg-red-50')}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{getSectionName(material.section_id, sections)}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'font-mono font-semibold',
                      material.quantity < 10 ? 'text-red-600' : material.quantity < 50 ? 'text-orange-600' : 'text-green-600'
                    )}>
                      {material.quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    {material.color_inventory && material.color_inventory.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {material.color_inventory.map(ci => (
                          <div key={ci.color_id} className="flex items-center gap-1 text-xs border rounded px-2 py-1">
                            <div 
                              className="w-3 h-3 rounded-full border border-gray-300" 
                              style={{ backgroundColor: ci.hex_code }}
                            />
                            <span>{ci.color_name}: {ci.quantity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleQuantityChange(material.id)}>
                        <Icon name="Plus" size={14} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openManualDeductDialog(material)}>
                        <Icon name="Minus" size={14} />
                      </Button>
                      <Button size="sm" variant="default" onClick={() => openShipDialog(material)}>
                        <Icon name="Send" size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={manualDeductDialog} onOpenChange={setManualDeductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ручное списание материала</DialogTitle>
            <DialogDescription>
              {deductMaterial?.name} (на складе: {deductMaterial?.quantity})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deductMaterial && deductMaterial.colors.length > 0 && (
              <div>
                <Label>Цвет</Label>
                <Select value={deductFormData.color_id} onValueChange={(v) => setDeductFormData({...deductFormData, color_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите цвет" />
                  </SelectTrigger>
                  <SelectContent>
                    {deductMaterial.colors.map(color => (
                      <SelectItem key={color.id} value={String(color.id)}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.hex_code }} />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>Количество</Label>
              <Input
                type="number"
                value={deductFormData.quantity}
                onChange={(e) => setDeductFormData({...deductFormData, quantity: Number(e.target.value)})}
              />
            </div>
            
            <div>
              <Label>Причина списания</Label>
              <Input
                value={deductFormData.comment}
                onChange={(e) => setDeductFormData({...deductFormData, comment: e.target.value})}
                placeholder="Брак, повреждение, и т.д."
              />
            </div>
            
            <Button onClick={onManualDeduct} className="w-full">Списать</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправка материала</DialogTitle>
            <DialogDescription>
              {selectedMaterial?.name} (на складе: {selectedMaterial?.quantity})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMaterial && selectedMaterial.colors.length > 0 && (
              <div>
                <Label>Цвет *</Label>
                <Select value={shipFormData.color_id} onValueChange={(v) => setShipFormData({...shipFormData, color_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите цвет" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedMaterial.colors.map(color => (
                      <SelectItem key={color.id} value={String(color.id)}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.hex_code }} />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>Количество *</Label>
              <Input
                type="number"
                value={shipFormData.quantity}
                onChange={(e) => setShipFormData({...shipFormData, quantity: Number(e.target.value)})}
              />
            </div>
            
            <div>
              <Label>Получатель</Label>
              <Input
                value={shipFormData.recipient}
                onChange={(e) => setShipFormData({...shipFormData, recipient: e.target.value})}
                placeholder="Имя получателя или отдел"
              />
            </div>
            
            <div>
              <Label>Комментарий</Label>
              <Input
                value={shipFormData.comment}
                onChange={(e) => setShipFormData({...shipFormData, comment: e.target.value})}
                placeholder="Дополнительная информация"
              />
            </div>
            
            <Button onClick={onShipSubmit} className="w-full">
              <Icon name="Send" size={16} className="mr-2" />
              Отправить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
