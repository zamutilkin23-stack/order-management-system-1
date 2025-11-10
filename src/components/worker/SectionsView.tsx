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
  parent_id: number | null;
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

  const getParentSections = () => {
    return sections.filter(s => !s.parent_id);
  };

  const getChildSections = (parentId: number) => {
    return sections.filter(s => s.parent_id === parentId);
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
            {getParentSections().map(parent => {
              const childSections = getChildSections(parent.id);
              const parentMaterials = getMaterialsBySection(parent.id);
              
              return (
                <div key={parent.id} className="border-2 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Icon name="Folder" size={20} className="text-blue-600" />
                    {parent.name}
                  </h3>
                  
                  {parentMaterials.length > 0 && (
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {parentMaterials.map(material => (
                        <div key={material.id} className="border rounded p-3 bg-white shadow-sm">
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
                                  className="flex items-center gap-1 text-xs bg-gray-50 border rounded px-2 py-1"
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
                  
                  {childSections.length > 0 && (
                    <div className="space-y-4 mt-4">
                      {childSections.map(child => {
                        const childMaterials = getMaterialsBySection(child.id);
                        
                        return (
                          <div key={child.id} className="border rounded-lg p-3 bg-white ml-4">
                            <h4 className="text-base font-semibold mb-2 flex items-center gap-2">
                              <Icon name="Folder" size={16} className="text-gray-600" />
                              <span className="text-gray-400">↳</span>
                              {child.name}
                            </h4>
                            
                            {childMaterials.length === 0 ? (
                              <p className="text-sm text-gray-500 italic ml-6">Нет материалов в подразделе</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-6">
                                {childMaterials.map(material => (
                                  <div key={material.id} className="border rounded p-3 bg-gray-50">
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-medium text-sm">{material.name}</h5>
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
                    </div>
                  )}
                  
                  {parentMaterials.length === 0 && childSections.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Нет материалов и подразделов</p>
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