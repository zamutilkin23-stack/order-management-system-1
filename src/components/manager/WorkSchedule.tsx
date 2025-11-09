import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface WorkScheduleProps {
  userId: number;
  userRole: string;
  scheduleApi: string;
}

export default function WorkSchedule({ userId, userRole, scheduleApi }: WorkScheduleProps) {
  return (
    <TabsContent value="schedule" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>График работы</CardTitle>
          <CardDescription>Учет рабочего времени сотрудников</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-600 py-12">
            <Icon name="Calendar" size={48} className="mx-auto mb-4 text-gray-400" />
            <p>График работы в разработке</p>
            <p className="text-sm text-gray-500 mt-2">Скоро будет доступен учет часов и печать графика</p>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
