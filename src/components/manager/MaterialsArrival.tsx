import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

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
  parent_id: number | null;
}

interface Color {
  id: number;
  name: string;
  hex_code: string;
}

interface ArrivalItem {
  material_id: string;
  quantity: string;
}

export default function MaterialsArrival({ userId }: { userId: number }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [arrivalItems, setArrivalItems] = useState<ArrivalItem[]>([
    { material_id: '', quantity: '' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [materialsRes, sectionsRes] = await Promise.all([
        fetch(API),
        fetch(`${API}?type=section`)
      ]);
      
      const materialsData = await materialsRes.json();
      const sectionsData = await sectionsRes.json();
      
      setMaterials(materialsData);
      setSections(sectionsData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const getSectionName = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return 'Неизвестно';
    
    if (section.parent_id) {
      const parent = sections.find(s => s.id === section.parent_id);
      return `${parent?.name || ''} → ${section.name}`;
    }
    
    return section.name;
  };

  const addArrivalItem = () => {
    setArrivalItems([...arrivalItems, { material_id: '', quantity: '' }]);
  };

  const removeArrivalItem = (index: number) => {
    setArrivalItems(arrivalItems.filter((_, i) => i !== index));
  };

  const updateArrivalItem = (index: number, field: keyof ArrivalItem, value: string) => {
    const newItems = [...arrivalItems];
    newItems[index][field] = value;
    setArrivalItems(newItems);
  };

  const handleArrival = async () => {
    const validItems = arrivalItems.filter(item => item.material_id && item.quantity);
    
    if (validItems.length === 0) {
      toast.error('Добавьте хотя бы один материал');
      return;
    }

    try {
      setLoading(true);
      
      const promises = validItems.map(item =>
        fetch(API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'material',
            id: parseInt(item.material_id),
            quantity_change: parseInt(item.quantity),
            updated_by: userId,
            comment: comment || 'Приход материалов'
          })
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r.ok);

      if (allSuccess) {
        toast.success('Приход материалов оформлен');
        setIsDialogOpen(false);
        setArrivalItems([{ material_id: '', quantity: '' }]);
        setComment('');
        loadData();
      } else {
        toast.error('Ошибка при оформлении прихода');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TabsContent value="arrival">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="arrival">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="PackagePlus" size={20} className="text-green-600" />
                Приход материалов
              </CardTitle>
              <CardDescription>
                Оформление прихода материалов на склад
              </CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Оформить приход
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Оформление прихода материалов</DialogTitle>
                  <DialogDescription>
                    Выберите материалы и укажите количество для пополнения
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {arrivalItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label className="text-xs mb-1">Материал *</Label>
                            <Select 
                              value={item.material_id} 
                              onValueChange={(v) => updateArrivalItem(index, 'material_id', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите материал" />
                              </SelectTrigger>
                              <SelectContent>
                                {materials.map(material => (
                                  <SelectItem key={material.id} value={material.id.toString()}>
                                    <div className="flex items-center justify-between w-full gap-4">
                                      <span>{material.name}</span>
                                      <span className="text-xs text-gray-500">
                                        {getSectionName(material.section_id)} · На складе: {material.quantity}
                                      </span>
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
                              placeholder="0"
                              value={item.quantity}
                              onChange={(e) => updateArrivalItem(index, 'quantity', e.target.value)}
                            />
                          </div>
                        </div>

                        {arrivalItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeArrivalItem(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button 
                    variant="outline" 
                    onClick={addArrivalItem}
                    className="w-full border-dashed"
                  >
                    <Icon name="Plus" size={16} className="mr-2" />
                    Добавить материал
                  </Button>

                  <div>
                    <Label className="text-xs mb-1">Комментарий (опционально)</Label>
                    <Textarea
                      placeholder="Например: Поставщик ООО 'Строймаркет', накладная №123"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <p className="flex items-center gap-2 text-blue-900">
                    <Icon name="Info" size={16} />
                    <span>
                      Материалы будут автоматически добавлены к текущим остаткам на складе
                    </span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleArrival} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    <Icon name="PackageCheck" size={16} className="mr-2" />
                    Оформить приход
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)} 
                    className="flex-1"
                    disabled={loading}
                  >
                    Отмена
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map(material => (
              <div 
                key={material.id} 
                className="border rounded-lg p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{material.name}</h3>
                    <p className="text-xs text-gray-600">{getSectionName(material.section_id)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon name="Package" size={16} className="text-blue-600" />
                    <span className="text-sm text-gray-600">На складе:</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{material.quantity}</span>
                </div>

                {material.colors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {material.colors.map(color => (
                      <div
                        key={color.id}
                        className="flex items-center gap-1 text-xs bg-white border rounded px-2 py-1"
                      >
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: color.hex_code }}
                        />
                        <span>{color.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {materials.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Icon name="PackageOpen" size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg">Материалы не добавлены</p>
              <p className="text-sm mt-1">Добавьте материалы в разделе "Материалы"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
