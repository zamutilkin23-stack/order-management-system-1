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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [sectionFilter, setSectionFilter] = useState('all');
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [shipFormData, setShipFormData] = useState({
    color_id: '',
    quantity: 0,
    recipient: '',
    comment: ''
  });

  const SHIPMENTS_API = '/api/materials';

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

  const handleManualDeduct = async () => {
    if (!deductMaterial || deductFormData.quantity <= 0) {
      toast.error('Укажите количество');
      return;
    }

    if (deductFormData.quantity > deductMaterial.quantity) {
      toast.error('Недостаточно материала на складе');
      return;
    }

    try {
      const response = await fetch(SHIPMENTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deductMaterial.id,
          quantity_change: -deductFormData.quantity,
          comment: `Ручное списание: ${deductFormData.comment}`,
          color_id: deductFormData.color_id ? Number(deductFormData.color_id) : null
        })
      });

      if (response.ok) {
        toast.success('Материал списан');
        setManualDeductDialog(false);
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка списания');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
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

  const handleShipSubmit = async () => {
    if (!selectedMaterial || !shipFormData.color_id || shipFormData.quantity <= 0) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (shipFormData.quantity > selectedMaterial.quantity) {
      toast.error('Недостаточно материала на складе');
      return;
    }

    try {
      const response = await fetch(SHIPMENTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedMaterial.id,
          quantity_change: -shipFormData.quantity,
          comment: `Отправка: ${shipFormData.recipient || 'без получателя'}. ${shipFormData.comment}`,
          ship_material: true,
          color_id: Number(shipFormData.color_id),
          recipient: shipFormData.recipient
        })
      });

      if (response.ok) {
        toast.success('Материал отправлен');
        setShipDialogOpen(false);
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка отправки');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const getSectionName = (id: number) => sections.find(s => s.id === id)?.name || '—';

  const filteredMaterials = materials
    .filter(m => {
      if (sectionFilter === 'all') return true;
      return m.section_id === Number(sectionFilter);
    })
    .sort((a, b) => {
      const sectionCompare = a.section_id - b.section_id;
      if (sectionCompare !== 0) return sectionCompare;
      return a.name.localeCompare(b.name);
    });

  const printInventory = () => {
    const printContent = `
      <html>
        <head>
          <title>Остатки материалов</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 12px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .low { background-color: #fee; color: #c00; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Остатки материалов</h1>
          <table>
            <thead>
              <tr>
                <th>Материал</th>
                <th>Раздел</th>
                <th>Количество</th>
              </tr>
            </thead>
            <tbody>
              ${filteredMaterials.map(m => `
                <tr${m.quantity < 10 ? ' class="low"' : ''}>
                  <td>${m.name}</td>
                  <td>${getSectionName(m.section_id)}</td>
                  <td>${m.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const win = window.open('', '', 'height=800,width=800');
    win?.document.write(printContent);
    win?.document.close();
    win?.print();
  };

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
              <Button variant="outline" size="sm" onClick={printInventory}>
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
                {sections.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Материал</TableHead>
                <TableHead>Раздел</TableHead>
                <TableHead className="text-right">Количество</TableHead>
                <TableHead className="text-right" colSpan={2}>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((material) => {
                const hasColorInventory = material.color_inventory && material.color_inventory.length > 0;
                
                return (
                  <React.Fragment key={material.id}>
                    <TableRow className={cn(material.quantity < 10 && 'bg-red-50')}>
                      <TableCell className="font-medium">
                        {material.name}
                        {material.auto_deduct && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Автосписание
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getSectionName(material.section_id)}</TableCell>
                      <TableCell className={cn('text-right font-mono text-lg', material.quantity < 10 && 'text-red-600 font-bold')}>
                        {material.quantity}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(material.id)}
                        >
                          <Icon name="Edit" size={14} className="mr-1" />
                          Изменить
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openManualDeductDialog(material)}
                        >
                          <Icon name="Minus" size={14} className="mr-1" />
                          Списать
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openShipDialog(material)}
                        >
                          <Icon name="Send" size={14} className="mr-1" />
                          Отправить
                        </Button>
                      </TableCell>
                    </TableRow>
                    {hasColorInventory && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-gray-50 py-2">
                          <div className="flex items-center gap-3 pl-8 text-sm">
                            <span className="text-gray-600">По цветам:</span>
                            {material.color_inventory.map((ci: any) => (
                              <div key={ci.color_id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border">
                                <div
                                  className="w-3 h-3 rounded border"
                                  style={{ backgroundColor: ci.hex_code }}
                                />
                                <span className="text-gray-700">{ci.color_name}:</span>
                                <span className="font-medium">{ci.quantity} шт</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправить материал</DialogTitle>
            <DialogDescription>
              {selectedMaterial?.name} (доступно: {selectedMaterial?.quantity} шт)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Цвет *</Label>
              <Select
                value={shipFormData.color_id}
                onValueChange={(value) => setShipFormData({ ...shipFormData, color_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите цвет" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMaterial?.colors?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
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
              <Label>Количество *</Label>
              <Input
                type="number"
                min="1"
                max={selectedMaterial?.quantity}
                value={shipFormData.quantity}
                onChange={(e) => setShipFormData({ ...shipFormData, quantity: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Получатель</Label>
              <Input
                value={shipFormData.recipient}
                onChange={(e) => setShipFormData({ ...shipFormData, recipient: e.target.value })}
                placeholder="ООО 'Компания'"
              />
            </div>

            <div>
              <Label>Комментарий</Label>
              <Input
                value={shipFormData.comment}
                onChange={(e) => setShipFormData({ ...shipFormData, comment: e.target.value })}
                placeholder="Примечание"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleShipSubmit} className="flex-1">
                Отправить
              </Button>
              <Button variant="outline" onClick={() => setShipDialogOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={manualDeductDialog} onOpenChange={setManualDeductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ручное списание материала</DialogTitle>
            <DialogDescription>
              {deductMaterial?.name} (доступно: {deductMaterial?.quantity} шт)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deductMaterial?.colors && deductMaterial.colors.length > 0 && (
              <div>
                <Label>Цвет (необязательно)</Label>
                <Select
                  value={deductFormData.color_id}
                  onValueChange={(value) => setDeductFormData({ ...deductFormData, color_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Не указан" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Не указан</SelectItem>
                    {deductMaterial.colors.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: c.hex_code }}
                          />
                          {c.name}
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
                value={deductFormData.quantity || ''}
                onChange={(e) => setDeductFormData({ ...deductFormData, quantity: Number(e.target.value) })}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <Label>Комментарий</Label>
              <Input
                value={deductFormData.comment}
                onChange={(e) => setDeductFormData({ ...deductFormData, comment: e.target.value })}
                placeholder="Причина списания"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleManualDeduct} className="flex-1" variant="destructive">
                Списать
              </Button>
              <Button variant="outline" onClick={() => setManualDeductDialog(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}