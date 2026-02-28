import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Export members function called');
    
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'csv';
    
    // Initialize MySQL client
    const mysql = createClient(
      Deno.env.get('MYSQL_URL') ?? '',
      Deno.env.get('MYSQL_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all member registrations
    const { data: members, error } = await mysql
      .from('membership_registrations')
      .select(`
        id,
        tns_number,
        first_name,
        last_name,
        email,
        phone,
        alternative_phone,
        address,
        city,
        state,
        zip_code,
        id_number,
        sex,
        marital_status,
        emergency_contact_name,
        emergency_contact_phone,
        membership_type,
        registration_status,
        payment_status,
        maturity_status,
        days_to_maturity,
        registration_date,
        probation_end_date,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
      throw error;
    }

    console.log(`Exporting ${members?.length || 0} members in ${format} format`);

    if (format === 'csv') {
      return exportCSV(members);
    } else if (format === 'excel') {
      return exportExcel(members);
    } else if (format === 'pdf') {
      return exportPDF(members);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid format. Supported formats: csv, excel, pdf' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error in export-members function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function exportCSV(members: any[]) {
  const headers = [
    'TNS Number',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Alternative Phone',
    'Address',
    'City',
    'State',
    'ZIP Code',
    'ID Number',
    'Sex',
    'Marital Status',
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Membership Type',
    'Registration Status',
    'Payment Status',
    'Maturity Status',
    'Days to Maturity',
    'Registration Date',
    'Probation End Date'
  ];

  const csvRows = [headers.join(',')];
  
  members?.forEach(member => {
    const row = [
      member.tns_number || '',
      member.first_name || '',
      member.last_name || '',
      member.email || '',
      member.phone || '',
      member.alternative_phone || '',
      `"${member.address || ''}"`,
      member.city || '',
      member.state || '',
      member.zip_code || '',
      member.id_number || '',
      member.sex || '',
      member.marital_status || '',
      `"${member.emergency_contact_name || ''}"`,
      member.emergency_contact_phone || '',
      member.membership_type || '',
      member.registration_status || '',
      member.payment_status || '',
      member.maturity_status || '',
      member.days_to_maturity || '',
      member.registration_date || '',
      member.probation_end_date || ''
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = csvRows.join('\n');
  const filename = `members_export_${new Date().toISOString().split('T')[0]}.csv`;

  return new Response(csvContent, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function exportExcel(members: any[]) {
  // Simple Excel XML format
  const excelXML = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Members">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">TNS Number</Data></Cell>
    <Cell><Data ss:Type="String">First Name</Data></Cell>
    <Cell><Data ss:Type="String">Last Name</Data></Cell>
    <Cell><Data ss:Type="String">Email</Data></Cell>
    <Cell><Data ss:Type="String">Phone</Data></Cell>
    <Cell><Data ss:Type="String">Alternative Phone</Data></Cell>
    <Cell><Data ss:Type="String">Address</Data></Cell>
    <Cell><Data ss:Type="String">City</Data></Cell>
    <Cell><Data ss:Type="String">State</Data></Cell>
    <Cell><Data ss:Type="String">ZIP Code</Data></Cell>
    <Cell><Data ss:Type="String">ID Number</Data></Cell>
    <Cell><Data ss:Type="String">Sex</Data></Cell>
    <Cell><Data ss:Type="String">Marital Status</Data></Cell>
    <Cell><Data ss:Type="String">Emergency Contact Name</Data></Cell>
    <Cell><Data ss:Type="String">Emergency Contact Phone</Data></Cell>
    <Cell><Data ss:Type="String">Membership Type</Data></Cell>
    <Cell><Data ss:Type="String">Registration Status</Data></Cell>
    <Cell><Data ss:Type="String">Payment Status</Data></Cell>
    <Cell><Data ss:Type="String">Maturity Status</Data></Cell>
    <Cell><Data ss:Type="String">Days to Maturity</Data></Cell>
    <Cell><Data ss:Type="String">Registration Date</Data></Cell>
    <Cell><Data ss:Type="String">Probation End Date</Data></Cell>
   </Row>
   ${members?.map(member => `
   <Row>
    <Cell><Data ss:Type="String">${member.tns_number || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.first_name || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.last_name || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.email || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.phone || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.alternative_phone || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.address || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.city || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.state || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.zip_code || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.id_number || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.sex || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.marital_status || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.emergency_contact_name || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.emergency_contact_phone || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.membership_type || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.registration_status || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.payment_status || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.maturity_status || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.days_to_maturity || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.registration_date || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${member.probation_end_date || ''}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  const filename = `members_export_${new Date().toISOString().split('T')[0]}.xls`;

  return new Response(excelXML, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function exportPDF(members: any[]) {
  // Simple HTML that can be converted to PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Members Export</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .header { text-align: center; margin-bottom: 20px; }
        .export-date { text-align: right; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Members Export Report</h1>
      </div>
      <div class="export-date">
        Export Date: ${new Date().toLocaleDateString()}
      </div>
      <table>
        <thead>
          <tr>
            <th>TNS Number</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Location</th>
            <th>Emergency Contact</th>
            <th>Membership Type</th>
            <th>Status</th>
            <th>Registration Date</th>
          </tr>
        </thead>
        <tbody>
          ${members?.map(member => `
            <tr>
              <td>${member.tns_number || 'N/A'}</td>
              <td>${member.first_name} ${member.last_name}</td>
              <td>${member.email}</td>
              <td>${member.phone}${member.alternative_phone ? '<br>Alt: ' + member.alternative_phone : ''}</td>
              <td>${member.address}<br>${member.city}, ${member.state} ${member.zip_code}</td>
              <td>${member.emergency_contact_name}<br>${member.emergency_contact_phone}</td>
              <td>${member.membership_type}</td>
              <td>${member.registration_status}<br>Payment: ${member.payment_status}</td>
              <td>${new Date(member.registration_date).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #666;">
        Total Members: ${members?.length || 0}
      </div>
    </body>
    </html>
  `;

  const filename = `members_export_${new Date().toISOString().split('T')[0]}.html`;

  return new Response(htmlContent, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}