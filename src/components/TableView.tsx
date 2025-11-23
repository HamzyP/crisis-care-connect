import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MedicalCenter, RESOURCE_NAMES, Department } from '@/types/medical';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';

interface TableViewProps {
  centers: MedicalCenter[];
}

// Get all unique staff types (specialist titles) from all hospitals
const getAllStaffTypes = (centers: MedicalCenter[]): string[] => {
  const staffTypes = new Set<string>();
  centers.forEach(center => {
    center.departments?.forEach(dept => {
      staffTypes.add(dept.specialistTitle);
    });
  });
  return Array.from(staffTypes).sort();
};

// Get staff count for a specific specialist title in a hospital
const getStaffCount = (center: MedicalCenter, specialistTitle: string): number => {
  if (!center.departments) return 0;
  return center.departments
    .filter(dept => dept.specialistTitle === specialistTitle)
    .reduce((sum, dept) => sum + dept.specialistCount, 0);
};

type SortField = 'name' | 'capacity' | 'status' | keyof MedicalCenter['resources'] | string;
type SortOrder = 'asc' | 'desc';

const statusColors = {
  critical: 'destructive',
  warning: 'warning',
  good: 'success',
} as const;

const TableView = ({ centers }: TableViewProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  
  // Get all unique staff types
  const staffTypes = useMemo(() => getAllStaffTypes(centers), [centers]);

  const filteredAndSortedCenters = useMemo(() => {
    let result = [...centers];

    if (searchTerm) {
      result = result.filter(center =>
        center.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else if (sortField === 'capacity') {
        aVal = a.maxPatientsCapacity;
        bVal = b.maxPatientsCapacity;
      } else if (sortField === 'status') {
        const statusOrder = { critical: 0, warning: 1, good: 2 };
        aVal = statusOrder[a.status];
        bVal = statusOrder[b.status];
      } else if (sortField in a.resources) {
        // It's a resource field
        aVal = a.resources[sortField as keyof typeof a.resources];
        bVal = b.resources[sortField as keyof typeof b.resources];
      } else {
        // It's a staff type
        aVal = getStaffCount(a, sortField);
        bVal = getStaffCount(b, sortField);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [centers, searchTerm, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search hospitals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by resource" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources & Staff</SelectItem>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Medical Resources</div>
            {Object.entries(RESOURCE_NAMES).map(([key, name]) => (
              <SelectItem key={key} value={key}>{name}</SelectItem>
            ))}
            {staffTypes.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Staff</div>
                {staffTypes.map((staffType) => (
                  <SelectItem key={staffType} value={`staff:${staffType}`}>{staffType}</SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-2">
                  Hospital Name
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('capacity')}>
                <div className="flex items-center gap-2">
                  Capacity
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('status')}>
                <div className="flex items-center gap-2">
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              {resourceFilter === 'all' 
                ? (
                  <>
                    {/* Medical Resources */}
                    {Object.entries(RESOURCE_NAMES).map(([key, name]) => (
                      <TableHead key={key} className="cursor-pointer" onClick={() => toggleSort(key as SortField)}>
                        <div className="flex items-center gap-2">
                          {name}
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                    ))}
                    {/* Staff Columns */}
                    {staffTypes.map((staffType) => (
                      <TableHead key={staffType} className="cursor-pointer" onClick={() => toggleSort(staffType)}>
                        <div className="flex items-center gap-2">
                          {staffType}
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                    ))}
                  </>
                )
                : resourceFilter.startsWith('staff:') ? (
                  <TableHead className="cursor-pointer" onClick={() => toggleSort(resourceFilter.replace('staff:', ''))}>
                    <div className="flex items-center gap-2">
                      {resourceFilter.replace('staff:', '')}
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                )
                : resourceFilter in RESOURCE_NAMES && (
                    <TableHead className="cursor-pointer" onClick={() => toggleSort(resourceFilter as SortField)}>
                      <div className="flex items-center gap-2">
                        {RESOURCE_NAMES[resourceFilter as keyof typeof RESOURCE_NAMES]}
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )
              }
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedCenters.map((center) => (
              <TableRow
                key={center.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/ministryofhealth/hospital/${center.id}`)}
              >
                <TableCell className="font-medium">{center.name}</TableCell>
                <TableCell>{center.currentPatients}/{center.maxPatientsCapacity}</TableCell>
                <TableCell>
                  <Badge variant={statusColors[center.status]}>
                    {center.status}
                  </Badge>
                </TableCell>
                {resourceFilter === 'all'
                  ? (
                    <>
                      {/* Medical Resources */}
                      {Object.entries(center.resources).map(([key, value]) => (
                        <TableCell key={key}>{value}</TableCell>
                      ))}
                      {/* Staff Columns */}
                      {staffTypes.map((staffType) => (
                        <TableCell key={staffType}>
                          {getStaffCount(center, staffType) || '-'}
                        </TableCell>
                      ))}
                    </>
                  )
                  : resourceFilter.startsWith('staff:') ? (
                    <TableCell>
                      {getStaffCount(center, resourceFilter.replace('staff:', '')) || '-'}
                    </TableCell>
                  )
                  : resourceFilter in center.resources && (
                      <TableCell key={resourceFilter}>
                        {center.resources[resourceFilter as keyof typeof center.resources]}
                      </TableCell>
                    )
                }
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TableView;
