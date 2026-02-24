import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FileText, Download } from 'lucide-react';

const reports = [
  {
    title: 'Broken Links Report',
    description: 'All broken links detected across your scans, with affiliate flag and page location.',
    href: '/api/reports/broken-links',
    filename: 'broken-links.csv',
  },
  {
    title: 'Guardian Links Report',
    description: 'All guardian links with rescue count and estimated value saved.',
    href: '/api/reports/guardian',
    filename: 'guardian-links.csv',
  },
  {
    title: 'Redirect Rules Report',
    description: 'All redirect rules with status and version history.',
    href: '/api/reports/redirect-rules',
    filename: 'redirect-rules.csv',
  },
];

export default async function ReportsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Audit Reports</h1>
        <p className="text-muted-foreground mt-1">Download CSV reports for analysis and compliance</p>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <div key={report.href} className="border rounded-lg bg-background p-5 flex items-center justify-between">
            <div className="flex items-start gap-4">
              <FileText className="w-8 h-8 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">{report.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{report.description}</p>
              </div>
            </div>
            <a
              href={report.href}
              download={report.filename}
              className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors flex-shrink-0 ml-4"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
