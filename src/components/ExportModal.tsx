import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Download,
  FileText,
  FileSpreadsheet,
  X,
  Loader2,
  Settings,
  Filter,
  Calendar,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { exportMembersData, ExportOptions } from '@/utils/exportUtils';
import { format as formatDate } from 'date-fns';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: any[];
  balances: Record<string, any>;
  contributions: Record<string, any>;
  coordinatorName: string;
  assignedArea: string;
  availableAreas: string[];
  filteredArea?: string;
}

export const ExportModal = ({
  open,
  onOpenChange,
  members,
  balances,
  contributions,
  coordinatorName,
  assignedArea,
  availableAreas,
  filteredArea
}: ExportModalProps) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [includeFinancialData, setIncludeFinancialData] = useState(true);
  const [includeContributions, setIncludeContributions] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [filterByArea, setFilterByArea] = useState(filteredArea || 'all');
  const [customFileName, setCustomFileName] = useState('');
  const [reportTitle, setReportTitle] = useState('Team No Struggle - Members Report');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!members.length) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);

    try {
      // Filter members based on selected area
      let membersToExport = members;
      if (filterByArea && filterByArea !== 'all') {
        membersToExport = members.filter(m => 
          `${m.city}, ${m.state}` === filterByArea
        );
      }

      if (!membersToExport.length) {
        toast.error('No members found with the selected filters');
        setIsExporting(false);
        return;
      }

      // Prepare export options
      const exportOptions: ExportOptions = {
        format: exportFormat,
        includeFinancialData,
        includeContributions,
        includeSummary,
        filterByArea,
        customFileName: customFileName.trim() || undefined,
        reportTitle: reportTitle.trim() || undefined
      };

      // Filter balances and contributions for selected members
      const memberIds = membersToExport.map(m => m.id);
      const filteredBalances = Object.fromEntries(
        Object.entries(balances).filter(([memberId]) => memberIds.includes(memberId))
      );
      const filteredContributions = Object.fromEntries(
        Object.entries(contributions).filter(([memberId]) => memberIds.includes(memberId))
      );

      // Start export
      exportMembersData(
        membersToExport,
        filteredBalances,
        filteredContributions,
        coordinatorName,
        assignedArea,
        exportOptions
      );

      toast.success(
        `${exportFormat.toUpperCase()} report generated successfully! ` +
        `${membersToExport.length} members exported.`
      );

      // Close modal after successful export
      onOpenChange(false);

    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to generate ${exportFormat.toUpperCase()} report. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate statistics for preview
  const filteredMembers = filterByArea && filterByArea !== 'all' 
    ? members.filter(m => `${m.city}, ${m.state}` === filterByArea)
    : members;
  
  const stats = {
    totalMembers: filteredMembers.length,
    approvedMembers: filteredMembers.filter(m => m.registration_status === 'approved').length,
    matureMembers: filteredMembers.filter(m => m.maturity_status === 'mature').length,
    paidMembers: filteredMembers.filter(m => m.payment_status === 'paid').length,
    totalContributions: filteredMembers.reduce((sum, member) => 
      sum + (balances[member.id]?.total_contributions || 0), 0
    )
  };

  // Generate default filename
  const defaultFileName = `TNS_${exportFormat === 'pdf' ? 'Report' : 'Data'}_${
    filterByArea && filterByArea !== 'all' 
      ? filterByArea.replace(/[^a-zA-Z0-9]/g, '_')
      : 'All_Areas'
  }_${formatDate(new Date(), 'yyyy-MM-dd')}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Members Data
          </DialogTitle>
          <DialogDescription>
            Configure your export settings and generate a comprehensive report
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Export Format
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${
                  exportFormat === 'pdf' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setExportFormat('pdf')}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <FileText className={`h-8 w-8 ${exportFormat === 'pdf' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium">PDF Report</div>
                    <div className="text-sm text-gray-600">Professional formatted report</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all ${
                  exportFormat === 'excel' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setExportFormat('excel')}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <FileSpreadsheet className={`h-8 w-8 ${exportFormat === 'excel' ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium">Excel Workbook</div>
                    <div className="text-sm text-gray-600">Multiple sheets with detailed data</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Content Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Content Options
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                />
                <Label htmlFor="includeSummary" className="text-sm font-medium">
                  Summary Statistics
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeFinancialData"
                  checked={includeFinancialData}
                  onCheckedChange={(checked) => setIncludeFinancialData(checked === true)}
                />
                <Label htmlFor="includeFinancialData" className="text-sm font-medium">
                  Financial Data
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeContributions"
                  checked={includeContributions}
                  onCheckedChange={(checked) => setIncludeContributions(checked === true)}
                />
                <Label htmlFor="includeContributions" className="text-sm font-medium">
                  Contribution History
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Filter Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter Options
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filterArea" className="text-sm font-medium">
                  Filter by Area
                </Label>
                <Select value={filterByArea} onValueChange={setFilterByArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select area to filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌍 All Areas</SelectItem>
                    {availableAreas.map(area => (
                      <SelectItem key={area} value={area}>
                        📍 {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Customization Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Customization
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reportTitle" className="text-sm font-medium">
                  Report Title
                </Label>
                <Input
                  id="reportTitle"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Custom report title"
                />
              </div>
              
              <div>
                <Label htmlFor="customFileName" className="text-sm font-medium">
                  Custom Filename (optional)
                </Label>
                <Input
                  id="customFileName"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder={defaultFileName}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Leave blank for auto-generated name
                </div>
              </div>
            </div>
          </div>

          {/* Preview Statistics */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Export Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-lg text-blue-600">{stats.totalMembers}</div>
                  <div className="text-gray-600">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-green-600">{stats.approvedMembers}</div>
                  <div className="text-gray-600">Approved</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-purple-600">{stats.matureMembers}</div>
                  <div className="text-gray-600">Mature</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-amber-600">
                    {new Intl.NumberFormat('en-KE', {
                      style: 'currency',
                      currency: 'KES',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(stats.totalContributions)}
                  </div>
                  <div className="text-gray-600">Total Contributions</div>
                </div>
              </div>
              
              {filterByArea && filterByArea !== 'all' && (
                <div className="mt-3 p-2 bg-blue-100 rounded-md">
                  <div className="text-sm text-blue-800">
                    <strong>Filtered by:</strong> {filterByArea}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button 
            onClick={handleExport}
            disabled={isExporting || !stats.totalMembers}
            className="min-w-[120px]"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};