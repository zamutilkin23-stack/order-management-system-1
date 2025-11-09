import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
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
}

interface Color {
  id: number;
  name: string;
  hex_code: string;
}

export default function SectionsView() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getMaterialsBySection = (sectionId: number) => {
    return materials.filter(m => m.section_id === sectionId);
  };

  if (loading) {
    return (
      <TabsContent value="sections">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="sections">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="FolderTree" size={20} />
            Разделы и материалы
          </CardTitle>
          <CardDescription>
            Просмотр материалов по разделам
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sections.map(section => {
              const sectionMaterials = getMaterialsBySection(section.id);
              
              return (
                <div key={section.id} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Icon name="Folder" size={18} className="text-blue-600" />
                    {section.name}
                  </h3>
                  
                  {sectionMaterials.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Нет материалов в этом разделе</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sectionMaterials.map(material => (
                        <div key={material.id} className="border rounded p-3 bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{material.name}</h4>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {material.quantity} шт
                            </span>
                          </div>
                          
                          {material.colors.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
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
                  )}
                </div>
              );
            })}
            
            {sections.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Icon name="FolderOpen" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Разделы не найдены</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
