import { ApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';

const client = new ApiClient(API_ENDPOINTS.SCHEDULE);

export interface TimesheetEmployee {
  id: number;
  full_name: string;
}

export interface DayRecord {
  hours: number;
  record_id: number | null;
}

export interface UserTimesheet {
  employee_id: number;
  full_name: string;
  days: Record<string, DayRecord>;
}

export interface UpdateHoursData {
  employee_id: number;
  work_date: string;
  hours: number;
}

export const scheduleService = {
  getEmployees: () => 
    client.get<TimesheetEmployee[]>('', { type: 'employees' }),

  getTimesheet: (month: number, year: number, employeeIds: string) => 
    client.get<UserTimesheet[]>('', { month, year, employee_ids: employeeIds }),

  addEmployee: (fullName: string) => 
    client.post('', { type: 'employee', full_name: fullName }),

  deleteEmployee: (id: number) => 
    client.delete('', { type: 'employee', id }),

  updateHours: (data: UpdateHoursData) => 
    client.put('', data),
};
