import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const ORDERS_API = 'https://functions.poehali.dev/0ffd935b-d2ee-48e1-a9e4-2b8fe0ffb3dd';
const MATERIALS_API = 'https://functions.poehali.dev/74905bf8-26b1-4b87-9a75-660316d4ba77';

interface ShippedItem {
  id: number;
  order_id: number;
  material_id: number;
  color_id: number | null;
  quantity: number;
  is_defective: boolean;
  shipped_at: string;
  order_number: string;
  section_id: number;
}

interface Material {
  id: number;
  name: string;
  section_id: number;
  quantity: number;
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

interface DefectiveStats {
  material_id: number;
  material_name: string;
  color_id: number | null;
  color_name: string;
  total_defective: number;
  total_shipped: number;
  defect_rate: number;
}

export default function DefectiveReport() {
  const [shippedItems, setShippedItems] = useState<ShippedItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, materialsRes, sectionsRes, colorsRes] = await Promise.all([
        fetch(`${ORDERS_API}?get_shipped=true`),
        fetch(MATERIALS_API),
        fetch(`${MATERIALS_API}?type=section`),
        fetch(`${MATERIALS_API}?type=color`)
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setShippedItems(itemsData);
      }

      const materialsData = await materialsRes.json();
      const sectionsData = await sectionsRes.json();
      const colorsData = await colorsRes.json();

      setMaterials(materialsData);
      setSections(sectionsData);
      setColors(colorsData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const getMaterialName = (id: number) => materials.find(m => m.id === id)?.name || '—';
  const getColorName = (id: number | null) => {
    if (!id) return '—';
    return colors.find(c => c.id === id)?.name || '—';
  };
  const getSectionName = (id: number) => sections.find(s => s.id === id)?.name || '—';

  const filterByPeriod = (items: ShippedItem[]) => {
    const now = new Date();
    const filtered = items.filter(item => {
      const shippedDate = new Date(item.shipped_at);
      
      switch (periodFilter) {
        case 'today':
          return shippedDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return shippedDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return shippedDate >= monthAgo;
        default:
          return true;
      }
    });
    
    return filtered;
  };

  const calculateStats = (): DefectiveStats[] => {
    const filtered = filterByPeriod(shippedItems);
    const statsMap = new Map<string, DefectiveStats>();

    filtered.forEach(item => {
      const key = `${item.material_id}-${item.color_id || 0}`;
      
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          material_id: item.material_id,
          material_name: getMaterialName(item.material_id),
          color_id: item.color_id,
          color_name: getColorName(item.color_id),
          total_defective: 0,
          total_shipped: 0,
          defect_rate: 0
        });
      }

      const stats = statsMap.get(key)!;
      stats.total_shipped += item.quantity;
      
      if (item.is_defective) {
        stats.total_defective += item.quantity;
      }
    });

    const result = Array.from(statsMap.values()).map(stats => ({
      ...stats,
      defect_rate: stats.total_shipped > 0 
        ? Math.round((stats.total_defective / stats.total_shipped) * 100) 
        : 0
    }));

    return result.sort((a, b) => b.defect_rate - a.defect_rate);
  };

  const defectiveItems = filterByPeriod(shippedItems).filter(item => item.is_defective);
  const stats = calculateStats();
  const totalDefective = defectiveItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalShipped = filterByPeriod(shippedItems).reduce((sum, item) => sum + item.quantity, 0);
  const overallDefectRate = totalShipped > 0 ? Math.round((totalDefective / totalShipped) * 100) : 0;

  if (loading) {
    return (
      <TabsContent value="defective">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="defective">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="AlertTriangle" size={20} className="text-red-600" />
                  Отчёт по браку
                </CardTitle>
                <CardDescription>
                  Статистика бракованных материалов при отправке
                </CardDescription>
              </div>
              
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">За всё время</SelectItem>
                  <SelectItem value="today">За сегодня</SelectItem>
                  <SelectItem value="week">За неделю</SelectItem>
                  <SelectItem value="month">За месяц</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border rounded-lg p-4 bg-gradient-to-br from-red-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Всего брака</p>
                    <p className="text-3xl font-bold text-red-600">{totalDefective}</p>
                  </div>
                  <Icon name="XCircle" size={40} className="text-red-300" />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Всего отправлено</p>
                    <p className="text-3xl font-bold text-blue-600">{totalShipped}</p>
                  </div>
                  <Icon name="Package" size={40} className="text-blue-300" />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gradient-to-br from-orange-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">% брака</p>
                    <p className="text-3xl font-bold text-orange-600">{overallDefectRate}%</p>
                  </div>
                  <Icon name="Percent" size={40} className="text-orange-300" />
                </div>
              </div>
            </div>

            {stats.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Icon name="CheckCircle" size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-lg">Брака не обнаружено</p>
                <p className="text-sm mt-1">За выбранный период нет бракованных материалов</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Статистика по материалам</h3>
                
                <div className="space-y-3">
                  {stats.map((stat, index) => (
                    <div 
                      key={`${stat.material_id}-${stat.color_id}`}
                      className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{stat.material_name}</h4>
                          <p className="text-sm text-gray-600">{stat.color_name}</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Брак</p>
                            <p className="text-lg font-bold text-red-600">{stat.total_defective}</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Всего</p>
                            <p className="text-lg font-bold text-gray-700">{stat.total_shipped}</p>
                          </div>
                          
                          <div className="text-center min-w-[60px]">
                            <p className="text-xs text-gray-500 mb-1">% брака</p>
                            <p className={`text-xl font-bold ${
                              stat.defect_rate > 10 ? 'text-red-600' : 
                              stat.defect_rate > 5 ? 'text-orange-600' : 
                              'text-green-600'
                            }`}>
                              {stat.defect_rate}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            stat.defect_rate > 10 ? 'bg-red-500' : 
                            stat.defect_rate > 5 ? 'bg-orange-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${stat.defect_rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {defectiveItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="List" size={20} />
                История брака
              </CardTitle>
              <CardDescription>
                Подробный список всех бракованных отправок
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {defectiveItems.map(item => (
                  <div key={item.id} className="border rounded-lg p-3 bg-red-50 border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon name="AlertTriangle" size={16} className="text-red-600" />
                          <span className="font-semibold">Заявка № {item.order_number}</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {getMaterialName(item.material_id)} · {getColorName(item.color_id)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.shipped_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">{item.quantity}</p>
                        <p className="text-xs text-red-600">шт брака</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TabsContent>
  );
}
