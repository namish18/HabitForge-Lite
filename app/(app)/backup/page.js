'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function BackupPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function exportBackup() {
    try {
      setLoading(true);

      const res = await fetch('/api/backup/export');

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to export backup.');
        return;
      }

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `habitforge-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      toast.success('Backup exported successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong while exporting.');
    } finally {
      setLoading(false);
    }
  }

  async function importBackup() {
    if (!file) {
      toast.error('Please select a backup file.');
      return;
    }

    const confirmed = window.confirm(
      'Importing this backup will overwrite all existing data. Continue?'
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const text = await file.text();

      let backup;

      try {
        backup = JSON.parse(text);
      } catch {
        toast.error('Invalid JSON backup file.');
        return;
      }

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backup),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Backup imported successfully!');
        setFile(null);
      } else {
        toast.error(data.error || 'Import failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong while importing.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Backup & Restore</h1>
          <p className="page-subtitle">
            Export your productivity data or restore it from a previous backup.
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 650 }}>
        <h2 style={{ marginBottom: 20 }}>Backup Management</h2>

        <button
          className="btn btn-primary"
          onClick={exportBackup}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Export Backup'}
        </button>

        <div style={{ margin: '24px 0' }}>
          <input
            type="file"
            accept=".json"
            disabled={loading}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button
          className="btn btn-secondary"
          onClick={importBackup}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Import Backup'}
        </button>

        {file && (
          <p
            style={{
              marginTop: 16,
              color: '#888',
              fontSize: '0.9rem',
            }}
          >
            Selected: <strong>{file.name}</strong>
          </p>
        )}
      </div>
    </div>
  );
}