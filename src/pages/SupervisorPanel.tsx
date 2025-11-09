import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import WorkSchedule from '@/components/manager/WorkSchedule';

const SCHEDULE_API = 'https://functions.poehali.dev/f617714b-d72a-41e1-87ec-519f6dff2f28';

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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Calendar" size={20} />
              График работы сотрудников
            </CardTitle>
            <CardDescription>
              Просмотр табеля учета рабочего времени (только чтение)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkSchedule scheduleApi={SCHEDULE_API} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
