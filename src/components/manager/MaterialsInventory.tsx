import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
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

  const handleQuantityChange = (materialId: number) => {
    const amount = prompt('Введите количество для добавления (отрицательное для списания):');
    if (amount) {
      const change = Number(amount);
      const comment = prompt('Комментарий (необязательно):') || '';
      onUpdateQuantity(materialId, change, comment);
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
            <Label className="text-sm font-medium">Раздел:</Label>
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
                <TableHead className="text-right">Действия</TableHead>
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
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(material.id)}
                    >
                      <Icon name="Edit" size={14} className="mr-1" />
                      Изменить
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
