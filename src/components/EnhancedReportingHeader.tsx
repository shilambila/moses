import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter,
  Calendar,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EnhancedReportingHeaderProps {
  title: string;
  description: string;
  onExportExcel: () => Promise<void>;
  onExportPDF: () => Promise<void>;
  onExportCSV?: () => Promise<void>;
  dateRange?: {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
  };
  additionalFilters?: React.ReactNode;
  summary?: {
    totalRecords: number;
    totalAmount?: number;
    additionalMetrics?: Array<{
      label: string;
      value: string | number;
      color?: string;
    }>;
  };
}

export const EnhancedReportingHeader = ({
  title,
  description,
  onExportExcel,
  onExportPDF,
  onExportCSV,
  dateRange,
  additionalFilters,
  summary
}: EnhancedReportingHeaderProps) => {
  const [exportLoading, setExportLoading] = useState<string>('');

  const handleExportExcel = async () => {
    try {
      setExportLoading('excel');
      await onExportExcel();
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error('Failed to export Excel report');
    } finally {
      setExportLoading('');
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportLoading('pdf');
      await onExportPDF();
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF report');
    } finally {
      setExportLoading('');
    }
  };

  const handleExportCSV = async () => {
    if (!onExportCSV) return;
    
    try {
      setExportLoading('csv');
      await onExportCSV();
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Failed to export CSV report');
    } finally {
      setExportLoading('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="flex items-center gap-2"
            disabled={exportLoading !== ''}
          >
            {exportLoading === 'excel' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
            )}
            Export Excel
          </Button>
          
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="flex items-center gap-2"
            disabled={exportLoading !== ''}
          >
            {exportLoading === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 text-red-600" />
            )}
            Export PDF
          </Button>
          
          {onExportCSV && (
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="flex items-center gap-2"
              disabled={exportLoading !== ''}
            >
              {exportLoading === 'csv' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4 text-blue-600" />
              )}
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-800">
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {summary.totalRecords.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600">
                {format(new Date(), 'PP')}
              </p>
            </CardContent>
          </Card>

          {summary.totalAmount !== undefined && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-800">
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  KES {summary.totalAmount.toLocaleString()}
                </div>
                <p className="text-xs text-green-600">
                  All transactions
                </p>
              </CardContent>
            </Card>
          )}

          {summary.additionalMetrics?.map((metric, index) => (
            <Card 
              key={index}
              className={`bg-gradient-to-br ${
                metric.color || 'from-purple-50 to-violet-50 border-purple-200'
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-800">
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {typeof metric.value === 'number' 
                    ? metric.value.toLocaleString() 
                    : metric.value
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      {(dateRange || additionalFilters) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {dateRange && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => dateRange.onStartDateChange(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => dateRange.onEndDateChange(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              {additionalFilters}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
