import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { format, startOfWeek, addDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

type AttendanceStatus = 'on_time' | 'late' | 'early' | 'absent' | 'leave';

interface AttendanceEvent {
  id: string;
  date: string; // yyyy-MM-dd
  shiftName: string;
  start: string; // HH:mm
  end: string; // HH:mm
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  note?: string;
  employee?: string;
}

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(today, 'yyyy-MM'));
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | AttendanceStatus>('all');

  const baseDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }, [selectedMonth]);

  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const demoEvents: AttendanceEvent[] = useMemo(() => {
    const d = (index: number) => format(weekDays[index], 'yyyy-MM-dd');
    return [
      {
        id: 'e1',
        date: d(0),
        shiftName: 'Ca hành chính',
        start: '08:00',
        end: '17:00',
        checkIn: '08:02',
        checkOut: '17:05',
        status: 'on_time',
      },
      {
        id: 'e2',
        date: d(1),
        shiftName: 'Ca hành chính',
        start: '08:00',
        end: '17:00',
        checkIn: '08:15',
        checkOut: '17:00',
        status: 'late',
        note: 'Muộn 15p',
      },
      {
        id: 'e3',
        date: d(2),
        shiftName: 'Ca hành chính',
        start: '08:00',
        end: '17:00',
        checkIn: '08:00',
        checkOut: '16:30',
        status: 'early',
        note: 'Về sớm 30p',
      },
      {
        id: 'e4',
        date: d(3),
        shiftName: 'Ca hành chính',
        start: '08:00',
        end: '17:00',
        status: 'absent',
        note: 'Vắng mặt',
      },
      {
        id: 'e5',
        date: d(4),
        shiftName: 'Ca hành chính',
        start: '08:00',
        end: '17:00',
        status: 'leave',
        note: 'Nghỉ phép',
      },
      {
        id: 'e6',
        date: d(5),
        shiftName: 'Ca sáng',
        start: '08:00',
        end: '12:00',
        checkIn: '07:58',
        checkOut: '12:01',
        status: 'on_time',
      },
      {
        id: 'e7',
        date: d(6),
        shiftName: 'Ca chiều',
        start: '13:00',
        end: '17:00',
        checkIn: '13:05',
        checkOut: '17:00',
        status: 'late',
        note: 'Muộn 5p',
      },
    ];
  }, [weekDays]);

  const startDateParam = format(weekDays[0], 'yyyy-MM-dd');
  const endDateParam = format(weekDays[6], 'yyyy-MM-dd');

  const { data: attendanceData } = useQuery({
    queryKey: [
      'attendance',
      startDateParam,
      endDateParam,
      selectedEmployeeId,
      selectedStatus,
      selectedDepartment,
    ],
    queryFn: async () => {
      const response = await api.get('/attendance', {
        params: {
          start: startDateParam,
          end: endDateParam,
          ...(isAdmin && selectedEmployeeId !== 'all'
            ? { employeeId: selectedEmployeeId }
            : {}),
          ...(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
          ...(isAdmin && selectedDepartment !== 'all' && selectedEmployeeId === 'all'
            ? { departmentId: selectedDepartment }
            : {}),
        },
      });
      const rawItems = (response.data.data || []) as Array<{
        _id?: string;
        id?: string;
        date: string;
        shiftName: string;
        startTime?: string;
        endTime?: string;
        start?: string;
        end?: string;
        checkIn?: string;
        checkOut?: string;
        status: AttendanceStatus;
        note?: string;
        employee?: string;
      }>;
      return rawItems.map((item) => ({
        id: item._id || item.id || `${item.date}-${item.shiftName}`,
        date: item.date,
        shiftName: item.shiftName,
        start: item.startTime || item.start || '00:00',
        end: item.endTime || item.end || '00:00',
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        status: item.status,
        note: item.note,
        employee: item.employee,
      }));
    },
    enabled: !!startDateParam && !!endDateParam,
  });

  const events = attendanceData && attendanceData.length > 0 ? attendanceData : demoEvents;

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return (response.data.data || []) as Array<{
        _id: string;
        name: string;
      }>;
    },
    enabled: isAdmin,
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees');
      return (response.data.data || []) as Array<{
        _id: string;
        firstName: string;
        lastName: string;
        department?: { _id: string; name: string } | string;
      }>;
    },
    enabled: isAdmin,
  });

  const departments = departmentsData || [];
  const employees = employeesData || [];

  const filteredEmployees = useMemo(() => {
    if (!isAdmin || selectedDepartment === 'all') {
      return employees;
    }
    return employees.filter((emp) => {
      if (!emp.department) return false;
      const deptId =
        typeof emp.department === 'string' ? emp.department : emp.department._id;
      return deptId === selectedDepartment;
    });
  }, [employees, isAdmin, selectedDepartment]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (isAdmin && selectedDepartment !== 'all') {
      const allowedEmployees = new Set(filteredEmployees.map((emp) => emp._id));
      result = result.filter((ev) => ev.employee && allowedEmployees.has(ev.employee));
    }
    if (selectedStatus !== 'all') {
      result = result.filter((ev) => ev.status === selectedStatus);
    }
    return result;
  }, [events, filteredEmployees, isAdmin, selectedDepartment, selectedStatus]);

  const statusStyles: Record<AttendanceStatus, string> = {
    on_time: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    late: 'bg-amber-100 text-amber-800 border-amber-200',
    early: 'bg-orange-100 text-orange-800 border-orange-200',
    absent: 'bg-rose-100 text-rose-800 border-rose-200',
    leave: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const statusLabel: Record<AttendanceStatus, string> = {
    on_time: 'Đúng giờ',
    late: 'Đi muộn',
    early: 'Về sớm',
    absent: 'Vắng mặt',
    leave: 'Nghỉ phép',
  };

  const hours = Array.from({ length: 15 }, (_, i) => 6 + i);
  const hourHeight = 48;
  const gridHeight = hours.length * hourHeight;

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Chấm công</h1>
        {!isAdmin && (
          <div className="flex space-x-3">
            <button className="btn btn-secondary">Check-in</button>
            <button className="btn btn-primary">Check-out</button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="card-premium p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
              <input
                type="month"
                className="input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
              <select
                className="input"
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setSelectedEmployeeId('all');
                }}
              >
                <option value="all">Tất cả</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
              <select
                className="input"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                <option value="all">Tất cả</option>
                {filteredEmployees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.lastName} {emp.firstName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                className="input"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'all' | AttendanceStatus)}
              >
                <option value="all">Tất cả</option>
                <option value="on_time">Đúng giờ</option>
                <option value="late">Đi muộn</option>
                <option value="early">Về sớm</option>
                <option value="absent">Vắng mặt</option>
                <option value="leave">Nghỉ phép</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 mb-5">
        <div className="card-premium p-0 overflow-hidden">
          <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] bg-gray-50 border-b">
            <div className="p-3 text-sm text-gray-500">GMT+7</div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="p-3 text-center">
                <div className="text-sm font-semibold text-gray-800">
                  {format(day, 'dd/MM/yyyy')}
                </div>
                <div className="text-xs text-gray-500">{format(day, 'EEE')}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
            <div className="border-r bg-white">
              {hours.map((h) => (
                <div key={h} className="h-12 border-t text-xs text-gray-500 px-2 flex items-start pt-1">
                  {h}:00
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayEvents = filteredEvents.filter(
                (e) => format(new Date(e.date), 'yyyy-MM-dd') === dayKey
              );
              return (
                <div key={dayKey} className="relative border-r" style={{ height: gridHeight }}>
                  {hours.map((h) => (
                    <div key={h} className="h-16 border-t" />
                  ))}

                  {dayEvents.map((ev) => {
                    const top =
                      ((toMinutes(ev.start) - 6 * 60) / 60) * hourHeight;
                    const height =
                      ((toMinutes(ev.end) - toMinutes(ev.start)) / 60) * hourHeight;
                    const blockHeight = Math.max(18, height - 12);
                    const blockTop = top + (height - blockHeight) / 2;

                    return (
                      <div
                        key={ev.id}
                        className={`absolute left-2 right-2 px-2 py-1 rounded-md border text-[11px] shadow-sm ${statusStyles[ev.status]}`}
                        style={{ top: blockTop, height: blockHeight }}
                      >
                        <div className="font-semibold">{ev.shiftName}</div>
                        <div>{ev.start}–{ev.end}</div>
                        <div className="font-medium">{statusLabel[ev.status]}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-premium p-3">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Tháng {format(baseDate, 'MM-yyyy')}</span>
            <div className="space-x-2">
              <button className="btn btn-secondary">‹</button>
              <button className="btn btn-secondary">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500 mb-2">
            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {Array.from({ length: 35 }, (_, i) => (
              <div
                key={i}
                className={`py-1.5 rounded-lg ${
                  i === 8 ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700'
                }`}
              >
                {i + 1 <= 31 ? i + 1 : ''}
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-400"></span>
              <span>Đúng giờ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-400"></span>
              <span>Đi muộn</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-orange-400"></span>
              <span>Về sớm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-rose-400"></span>
              <span>Vắng mặt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-400"></span>
              <span>Nghỉ phép</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ca</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ chuẩn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {filteredEvents.map((ev) => (
                <tr key={ev.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {format(new Date(ev.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{ev.shiftName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{ev.start}–{ev.end}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{ev.checkIn || '--'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{ev.checkOut || '--'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusStyles[ev.status]}`}>
                      {statusLabel[ev.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{ev.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;

