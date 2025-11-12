import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import TimeTracking from '@/components/admin/TimeTracking';
import SectionsManagement from '@/components/admin/SectionsManagement';
import ColorsManagement from '@/components/admin/ColorsManagement';
import MaterialsManagement from '@/components/admin/MaterialsManagement';
import OrdersSection from '@/components/manager/OrdersSection';
import OrderStatusManager from '@/components/manager/OrderStatusManager';
import MaterialsInventory from '@/components/manager/MaterialsInventory';
import ShippedOrders from '@/components/manager/ShippedOrders';
import DefectiveReport from '@/components/admin/DefectiveReport';
import MaterialsArrival from '@/components/manager/MaterialsArrival';
import EmployeeManagement from '@/components/supervisor/EmployeeManagement';

interface User {
  id: number;
  login: string;
  full_name: string;
  role: string;
}

interface SupervisorPanelProps {
  user: User;
  onLogout: () => void;
}

export default function SupervisorPanel({ user, onLogout }: SupervisorPanelProps) {
  const ORDERS_API = '/api/orders';
  const MATERIALS_API = '/api/materials';
  const SECTIONS_API = '/api/sections';
  const COLORS_API = '/api/colors';

  const [orders, setOrders] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = () => {
    loadOrders();
    loadMaterials();
    loadSections();
    loadColors();
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(ORDERS_API);
      const data = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await fetch(MATERIALS_API);
      const data = await response.json();
      setMaterials(data || []);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const loadSections = async () => {
    try {
      const response = await fetch(SECTIONS_API);
      const data = await response.json();
      setSections(data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const loadColors = async () => {
    try {
      const response = await fetch(COLORS_API);
      const data = await response.json();
      setColors(data || []);
    } catch (error) {
      console.error('Error loading colors:', error);
    }
  };

  const createOrder = async (orderData: any) => {
    setLoading(true);
    try {
      const response = await fetch(ORDERS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orderData, created_by: user.id })
      });

      if (response.ok) {
        toast.success('Заявка создана');
        loadOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка создания заявки');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId: number) => {
    try {
      const response = await fetch(ORDERS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId })
      });

      if (response.ok) {
        toast.success('Заявка удалена');
        loadOrders();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const updateOrderItem = async (orderId: number, itemId: number, quantityCompleted: number) => {
    try {
      const response = await fetch(ORDERS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          item_id: itemId,
          quantity_completed: quantityCompleted
        })
      });

      if (response.ok) {
        toast.success('Количество обновлено');
        loadOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const updateMaterialQuantity = async (materialId: number, change: number, comment: string = '') => {
    try {
      const response = await fetch(MATERIALS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: materialId,
          quantity_change: change,
          updated_by: user.id,
          comment
        })
      });

      if (response.ok) {
        toast.success('Остатки обновлены');
        loadMaterials();
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <Icon name="Users" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Панель начальника</h1>
              <p className="text-sm text-gray-600">{user.full_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <Icon name="LogOut" size={16} className="mr-2" />
            Выход
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full max-w-6xl grid-cols-11">
            <TabsTrigger value="orders">
              <Icon name="ClipboardList" size={16} className="mr-2" />
              Заявки
            </TabsTrigger>
            <TabsTrigger value="progress">
              <Icon name="TrendingUp" size={16} className="mr-2" />
              Выполнение
            </TabsTrigger>
            <TabsTrigger value="shipped">
              <Icon name="PackageCheck" size={16} className="mr-2" />
              Отправлено
            </TabsTrigger>
            <TabsTrigger value="defective">
              <Icon name="AlertTriangle" size={16} className="mr-2" />
              Брак
            </TabsTrigger>
            <TabsTrigger value="arrival">
              <Icon name="TruckIcon" size={16} className="mr-2" />
              Приход
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Icon name="Package" size={16} className="mr-2" />
              Остатки
            </TabsTrigger>
            <TabsTrigger value="employees">
              <Icon name="Users" size={16} className="mr-2" />
              Сотрудники
            </TabsTrigger>
            <TabsTrigger value="timetracking">
              <Icon name="Clock" size={16} className="mr-2" />
              Табель
            </TabsTrigger>
            <TabsTrigger value="sections">
              <Icon name="FolderTree" size={16} className="mr-2" />
              Разделы
            </TabsTrigger>
            <TabsTrigger value="colors">
              <Icon name="Palette" size={16} className="mr-2" />
              Цвета
            </TabsTrigger>
            <TabsTrigger value="materials">
              <Icon name="Package" size={16} className="mr-2" />
              Материалы
            </TabsTrigger>
          </TabsList>

          <OrdersSection
            orders={orders}
            materials={materials}
            sections={sections}
            colors={colors}
            loading={loading}
            onCreateOrder={createOrder}
            onDeleteOrder={deleteOrder}
            onRefresh={loadOrders}
          />

          <OrderStatusManager
            orders={orders}
            materials={materials}
            sections={sections}
            colors={colors}
            onUpdateItem={updateOrderItem}
            onRefresh={loadOrders}
          />

          <ShippedOrders
            orders={orders}
            materials={materials}
            sections={sections}
            colors={colors}
            userId={user.id}
            onRefresh={loadOrders}
          />

          <DefectiveReport />

          <MaterialsArrival userId={user.id} />

          <MaterialsInventory
            materials={materials}
            sections={sections}
            onUpdateQuantity={updateMaterialQuantity}
            onRefresh={loadMaterials}
          />

          <EmployeeManagement />

          <TimeTracking userRole={user.role} />
          <SectionsManagement userId={user.id} />
          <ColorsManagement userId={user.id} />
          <MaterialsManagement userId={user.id} />
        </Tabs>
      </div>
    </div>
  );
}