import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchFirestoreStorageDiagnostics,
  FirestoreStorageDiagnostics,
  formatBytes,
} from '../../lib/firestoreDiagnostics';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HardDrive,
  Sliders,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const THRESHOLD_STORAGE_KEY = 'smpn1_firestore_storage_threshold_bytes';
const DEFAULT_THRESHOLD_BYTES = 10 * 1024 * 1024; // 10 MB default

const THRESHOLD_PRESETS = [
  { label: '1 MB', bytes: 1 * 1024 * 1024 },
  { label: '5 MB', bytes: 5 * 1024 * 1024 },
  { label: '10 MB (Standar)', bytes: 10 * 1024 * 1024 },
  { label: '25 MB', bytes: 25 * 1024 * 1024 },
  { label: '50 MB', bytes: 50 * 1024 * 1024 },
  { label: '100 MB', bytes: 100 * 1024 * 1024 },
  { label: '500 MB', bytes: 500 * 1024 * 1024 },
];

export const FirestoreDiagnosticPanel: React.FC = () => {
  const [thresholdBytes, setThresholdBytes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(THRESHOLD_STORAGE_KEY);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // ignore
    }
    return DEFAULT_THRESHOLD_BYTES;
  });

  const [customThresholdInput, setCustomThresholdInput] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [diagnostics, setDiagnostics] = useState<FirestoreStorageDiagnostics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({
    school_portal: true,
    news_articles: true,
  });

  const loadDiagnostics = useCallback(
    async (targetThreshold = thresholdBytes) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const result = await fetchFirestoreStorageDiagnostics(targetThreshold);
        setDiagnostics(result);
      } catch (err) {
        console.error('Error fetching Firestore storage diagnostics', err);
        setErrorMsg('Gagal memuat diagnostik: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    },
    [thresholdBytes]
  );

  useEffect(() => {
    loadDiagnostics(thresholdBytes);
  }, [loadDiagnostics, thresholdBytes]);

  const handleSelectThreshold = (newBytes: number) => {
    setThresholdBytes(newBytes);
    setShowCustomInput(false);
    try {
      localStorage.setItem(THRESHOLD_STORAGE_KEY, newBytes.toString());
    } catch {
      // ignore
    }
  };

  const handleApplyCustomThreshold = () => {
    const parsedMb = parseFloat(customThresholdInput);
    if (!isNaN(parsedMb) && parsedMb > 0) {
      const newBytes = Math.round(parsedMb * 1024 * 1024);
      setThresholdBytes(newBytes);
      try {
        localStorage.setItem(THRESHOLD_STORAGE_KEY, newBytes.toString());
      } catch {
        // ignore
      }
    }
  };

  const toggleCollection = (key: string) => {
    setExpandedCollections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopyReport = () => {
    if (!diagnostics) return;
    const lines = [
      '==============================================',
      '   LAPORAN DIAGNOSTIK PENYIMPANAN FIRESTORE   ',
      '==============================================',
      `Tanggal Cek      : ${new Date().toLocaleDateString('id-ID')} ${diagnostics.fetchedAt}`,
      `Status Database  : ${diagnostics.isLiveFromCloud ? 'Online Live Cloud' : 'Snapshot Lokal'}`,
      `Total Penggunaan : ${diagnostics.formattedTotalSize} (${diagnostics.totalBytes.toLocaleString('id-ID')} bytes)`,
      `Total Dokumen    : ${diagnostics.totalDocuments} dokumen`,
      `Ambang Batas     : ${diagnostics.formattedThreshold}`,
      `Status Peringatan: ${diagnostics.warningLevel.toUpperCase()}`,
      `Kapasitas Gratis : 1 GB (1.024 MB) - Terpakai ${diagnostics.percentOfTotalCapacity.toFixed(4)}%`,
      `Batas Dokumen 1MB: Dokumen terbesar "${diagnostics.largestDoc?.name || '-'}" = ${diagnostics.largestDoc?.formattedSize || '-'} (${diagnostics.largestDoc?.percentOfDocLimit.toFixed(1) || 0}%)`,
      '',
      '--- RINCIAN KOLEKSI ---',
      ...diagnostics.collections.map(
        (c) =>
          `• ${c.name}: ${c.docCount} dokumen, total ${c.formattedSize} (${c.totalBytes.toLocaleString('id-ID')} bytes)`
      ),
      '',
      `Catatan: ${diagnostics.warningMessage}`,
      '==============================================',
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Diagnostik Penyimpanan Firestore
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Realtime Quota
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pantau kapasitas database, ukuran dokumen 1 MB, dan ambang batas penyimpanan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleCopyReport}
            disabled={!diagnostics || loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            title="Salin teks ringkasan diagnostik"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Laporan</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => loadDiagnostics()}
            disabled={loading}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Memeriksa...' : 'Segarkan'}</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Threshold Selector Control */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Ambang Batas Peringatan Penyimpanan (Storage Warning Threshold):</span>
          </div>
          <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
            Aktif: {formatBytes(thresholdBytes)}
          </span>
        </div>

        {/* Presets buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {THRESHOLD_PRESETS.map((preset) => {
            const isSelected = thresholdBytes === preset.bytes && !showCustomInput;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectThreshold(preset.bytes)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              showCustomInput
                ? 'bg-slate-800 text-white font-bold'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Kustom (MB)...
          </button>
        </div>

        {/* Custom MB Input form */}
        {showCustomInput && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            <input
              type="number"
              min="0.1"
              step="0.5"
              value={customThresholdInput}
              onChange={(e) => setCustomThresholdInput(e.target.value)}
              placeholder="Masukkan angka dalam MB (cth: 15)..."
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none w-64"
            />
            <button
              type="button"
              onClick={handleApplyCustomThreshold}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        )}
      </div>

      {/* Main Status Warning Banner */}
      {diagnostics && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
            diagnostics.warningLevel === 'danger'
              ? 'bg-red-50 border-red-300 text-red-900'
              : diagnostics.warningLevel === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {diagnostics.warningLevel === 'danger' ? (
              <AlertOctagon className="w-5 h-5 text-red-600 animate-pulse" />
            ) : diagnostics.warningLevel === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-xs sm:text-sm uppercase tracking-wide">
                {diagnostics.warningLevel === 'danger'
                  ? 'Peringatan Kritis Firestore'
                  : diagnostics.warningLevel === 'warning'
                  ? 'Peringatan Ambang Batas / Ukuran Dokumen'
                  : 'Status Penyimpanan Normal & Aman'}
              </span>
              <span className="text-[11px] font-medium opacity-80">
                Pembaruan: {diagnostics.fetchedAt} (
                {diagnostics.isLiveFromCloud ? 'Cloud Live' : 'Snapshot Lokal'})
              </span>
            </div>
            <p className="text-xs leading-relaxed">{diagnostics.warningMessage}</p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      {diagnostics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Storage Used */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Penggunaan</span>
              <HardDrive className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {diagnostics.formattedTotalSize}
            </div>
            <div className="space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    diagnostics.isExceedingThreshold
                      ? 'bg-amber-500'
                      : diagnostics.totalBytes > diagnostics.thresholdBytes * 0.7
                      ? 'bg-blue-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(3, (diagnostics.totalBytes / diagnostics.thresholdBytes) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>Ambang Batas: {diagnostics.formattedThreshold}</span>
                <span>{((diagnostics.totalBytes / diagnostics.thresholdBytes) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Single Document Limit (1 MB) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Dokumen Terbesar</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {diagnostics.largestDoc ? diagnostics.largestDoc.formattedSize : '0 KB'}
            </div>
            <div className="space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (diagnostics.largestDoc?.percentOfDocLimit || 0) >= 80
                      ? 'bg-red-500'
                      : (diagnostics.largestDoc?.percentOfDocLimit || 0) >= 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(3, diagnostics.largestDoc?.percentOfDocLimit || 0)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>Maks Dokumen: 1.024 KB</span>
                <span>{(diagnostics.largestDoc?.percentOfDocLimit || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Free Tier Quota (1 GB) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Kuota Spark Free Tier</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">1.024 MB (1 GB)</div>
            <div className="space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(100, Math.max(1, diagnostics.percentOfTotalCapacity * 10))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>Tersedia: 99.9%</span>
                <span>{diagnostics.percentOfTotalCapacity.toFixed(4)}% terpakai</span>
              </div>
            </div>
          </div>

          {/* Card 4: Document Count */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Jumlah Dokumen</span>
              <Layers className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {diagnostics.totalDocuments} Dokumen
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Terbagi dalam {diagnostics.collections.length} koleksi aktif
            </div>
          </div>
        </div>
      )}

      {/* Collection Breakdown Tables */}
      {diagnostics && diagnostics.collections.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Rincian Dokumen &amp; Koleksi Firestore</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              Diurutkan berdasarkan ukuran data terbesar
            </span>
          </div>

          <div className="space-y-3">
            {diagnostics.collections.map((col) => {
              const isExpanded = expandedCollections[col.collectionKey] !== false;
              return (
                <div
                  key={col.collectionKey}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden"
                >
                  {/* Collection summary header toggle */}
                  <button
                    type="button"
                    onClick={() => toggleCollection(col.collectionKey)}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200/80 flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{col.name}</span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-300 font-semibold text-slate-600">
                        {col.docCount} dokumen
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {col.formattedSize}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {/* Documents List */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 bg-slate-50">
                            <th className="py-2.5 px-4">Nama Dokumen / Path</th>
                            <th className="py-2.5 px-3">Ukuran Data</th>
                            <th className="py-2.5 px-3">Beban Dokumen (1 MB Limit)</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {col.docs.map((docItem) => (
                            <tr key={docItem.path} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-4">
                                <div className="font-bold text-slate-800">{docItem.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {docItem.path}
                                </div>
                                {docItem.details && (
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {docItem.details}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                                <div>{docItem.formattedSize}</div>
                                <div className="text-[10px] text-slate-400">
                                  {docItem.bytes.toLocaleString('id-ID')} bytes
                                </div>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        docItem.warningLevel === 'danger'
                                          ? 'bg-red-500'
                                          : docItem.warningLevel === 'warning'
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Math.max(3, docItem.percentOfDocLimit)
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {docItem.percentOfDocLimit.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    docItem.warningLevel === 'danger'
                                      ? 'bg-red-100 text-red-700 border border-red-200'
                                      : docItem.warningLevel === 'warning'
                                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {docItem.warningLevel === 'danger' ? (
                                    <>
                                      <AlertOctagon className="w-3 h-3" />
                                      <span>Bahaya</span>
                                    </>
                                  ) : docItem.warningLevel === 'warning' ? (
                                    <>
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Waspada</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Aman</span>
                                    </>
                                  )}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations Box */}
      {diagnostics && diagnostics.recommendations.length > 0 && (
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Rekomendasi &amp; Optimalisasi Penyimpanan Firestore:</span>
          </div>
          <ul className="space-y-1 text-xs text-blue-800 pl-5 list-disc">
            {diagnostics.recommendations.map((rec, idx) => (
              <li key={idx} className="leading-relaxed">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
