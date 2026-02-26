import { Button } from '@tripslip/ui';

interface TripFiltersProps {
  dateRange: { start: string; end: string };
  selectedTeacher: string;
  selectedStatus: string;
  teachers: Array<{ id: string; name: string }>;
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onTeacherChange: (teacherId: string) => void;
  onStatusChange: (status: string) => void;
  onExport: () => void;
  onReset: () => void;
}

export default function TripFilters({
  dateRange,
  selectedTeacher,
  selectedStatus,
  teachers,
  onDateRangeChange,
  onTeacherChange,
  onStatusChange,
  onExport,
  onReset,
}: TripFiltersProps) {
  return (
    <div className="bg-white border-2 border-black rounded-md p-4 shadow-offset mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Date Range Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date Range
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, start: e.target.value })
              }
              className="flex-1 px-3 py-2 border-2 border-black rounded-md"
            />
            <span className="self-center">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, end: e.target.value })
              }
              className="flex-1 px-3 py-2 border-2 border-black rounded-md"
            />
          </div>
        </div>

        {/* Teacher Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Teacher
          </label>
          <select
            value={selectedTeacher}
            onChange={(e) => onTeacherChange(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black rounded-md"
          >
            <option value="">All Teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onReset}
            variant="outline"
            className="border-2 border-black"
          >
            Reset
          </Button>
          <Button onClick={onExport} className="shadow-offset">
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
