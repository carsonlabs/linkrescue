'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Info, FileText, CheckCircle } from 'lucide-react';

export default function ImportOffersPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.trim().split('\n').map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')));
      setPreview(lines.slice(0, 6)); // header + 5 rows
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setError('CSV must have a header row and at least one data row');
        setLoading(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
      const titleIdx = headers.findIndex((h) => h === 'title' || h === 'name');
      const urlIdx = headers.findIndex((h) => h === 'url' || h === 'link');
      const topicIdx = headers.findIndex((h) => h === 'topic' || h === 'category');

      if (titleIdx === -1 || urlIdx === -1) {
        setError('CSV must have "title" (or "name") and "url" (or "link") columns');
        setLoading(false);
        return;
      }

      const rows = lines.slice(1).map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')));

      // Bulk API call
      const offers = rows
        .filter((row) => row[titleIdx] && row[urlIdx])
        .map((row) => ({
          title: row[titleIdx],
          url: row[urlIdx],
          topic: topicIdx >= 0 ? row[topicIdx] || '' : '',
          tags: [],
          estimated_value_cents: 0,
        }));

      if (offers.length === 0) {
        setError('No valid rows found in CSV');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/offers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offers }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Import failed');
        setLoading(false);
        return;
      }

      setImported(data.created ?? offers.length);
      setLoading(false);
    };
    reader.readAsText(file);
  };

  if (imported > 0) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="border bg-card rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Import Complete</h1>
          <p className="text-muted-foreground mb-6">
            {imported} offer{imported !== 1 ? 's' : ''} imported successfully.
          </p>
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            View Offers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/offers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Offers
      </Link>

      <div className="border bg-card rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Import Offers from CSV</h1>
            <p className="text-sm text-muted-foreground">
              Bulk-import replacement links from a spreadsheet.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Format hint */}
          <div className="bg-accent/50 border rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Expected CSV columns
            </p>
            <code className="text-xs text-muted-foreground block">
              title, url, topic (optional)
            </code>
            <p className="text-xs text-muted-foreground">
              First row must be headers. &quot;name&quot; and &quot;link&quot; are also accepted.
            </p>
          </div>

          {/* File input */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload a .csv file</p>
              </>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted">
                    {preview[0].map((header, i) => (
                      <th key={i} className="px-3 py-2 text-left font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1).map((row, i) => (
                    <tr key={i} className="border-t">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading || !file}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
          >
            {loading ? 'Importing...' : `Import ${preview.length > 1 ? preview.length - 1 : ''} Offers`}
          </button>
        </div>
      </div>
    </div>
  );
}
