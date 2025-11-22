import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MedicalCenter, RESOURCE_NAMES } from '@/types/medical';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';

interface TableViewProps {
  centers: MedicalCenter[];
}

type SortField = 'name' | 'capacity' | 'status' | keyof MedicalCenter['resources'];
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
      } else {
        aVal = a.resources[sortField];
        bVal = b.resources[sortField];
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
            <SelectItem value="all">All Resources</SelectItem>
            {Object.entries(RESOURCE_NAMES).map(([key, name]) => (
              <SelectItem key={key} value={key}>{name}</SelectItem>
            ))}
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
                ? Object.entries(RESOURCE_NAMES).map(([key, name]) => (
                    <TableHead key={key} className="cursor-pointer" onClick={() => toggleSort(key as SortField)}>
                      <div className="flex items-center gap-2">
                        {name}
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  ))
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
                onClick={() => navigate(`/hospital/${center.id}`)}
              >
                <TableCell className="font-medium">{center.name}</TableCell>
                <TableCell>{center.currentPatients}/{center.maxPatientsCapacity}</TableCell>
                <TableCell>
                  <Badge variant={statusColors[center.status]}>
                    {center.status}
                  </Badge>
                </TableCell>
                {resourceFilter === 'all'
                  ? Object.entries(center.resources).map(([key, value]) => (
                      <TableCell key={key}>{value}</TableCell>
                    ))
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
