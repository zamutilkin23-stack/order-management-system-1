import { useState } from 'react';
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

  const handleQuantityChange = (materialId: number) => {
    const amount = prompt('Введите количество для добавления (отрицательное для списания):');
    if (amount) {
      const change = Number(amount);
      const comment = prompt('Комментарий (необязательно):') || '';
      onUpdateQuantity(materialId, change, comment);
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

  const filteredMaterials = materials.filter(m => {
    if (sectionFilter === 'all') return true;
    return m.section_id === Number(sectionFilter);
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
              {filteredMaterials.map((material) => (
                <TableRow key={material.id} className={cn(material.quantity < 10 && 'bg-red-50')}>
                  <TableCell className="font-medium">{material.name}</TableCell>
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
                      variant="default"
                      onClick={() => openShipDialog(material)}
                    >
                      <Icon name="Send" size={14} className="mr-1" />
                      Отправить
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
    </TabsContent>
  );
}