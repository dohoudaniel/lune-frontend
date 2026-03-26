import React, { useEffect, useState } from 'react';
import { ArrowLeft, Download, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

interface CVData {
  download_url: string;
  name: string;
  title: string;
}

interface Props {
  userId: string;
  onBack: () => void;
}

export const CVViewerPage: React.FC<Props> = ({ userId, onBack }) => {
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setError('Invalid CV link.');
      setLoading(false);
      return;
    }

    api.get(`/profiles/${userId}/cv/`)
      .then((res: any) => setCvData(res))
      .catch((err: any) => {
        if (err?.response?.status === 404) {
          setError('This candidate has not uploaded a CV yet.');
        } else {
          setError('Failed to load CV. You may not have permission to view this.');
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // The viewer URL — stream through our backend so the PDF renders in the iframe
  // without exposing the storage URL. We use the download endpoint without the
  // Content-Disposition override by passing ?inline=1.
  const viewerUrl = cvData ? `${cvData.download_url}?inline=1` : '';
  const isPdf = cvData?.download_url?.includes('/cv/download/');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-teal transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        {cvData && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-800 truncate">{cvData.name}</span>
              {cvData.title && (
                <span className="text-xs text-gray-400 ml-2 truncate">{cvData.title}</span>
              )}
            </div>
            <a
              href={cvData.download_url}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-teal px-3 py-1.5 rounded-lg hover:opacity-90 transition flex-shrink-0"
            >
              <Download size={14} />
              Download
            </a>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center p-4">
        {loading && (
          <div className="flex flex-col items-center gap-4 text-gray-400">
            <FileText className="w-12 h-12 animate-pulse" />
            <p className="text-sm">Loading CV…</p>
          </div>
        )}

        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 text-center max-w-sm"
          >
            <AlertCircle className="w-12 h-12 text-gray-300" />
            <p className="text-gray-500 text-sm">{error}</p>
            <button onClick={onBack} className="text-sm font-semibold text-teal hover:underline">
              Go back
            </button>
          </motion.div>
        )}

        {!loading && cvData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full"
            style={{ maxWidth: 900 }}
          >
            {isPdf ? (
              <iframe
                src={viewerUrl}
                title={`${cvData.name}'s CV`}
                className="w-full rounded-xl shadow-md border border-gray-100 bg-white"
                style={{ height: 'calc(100vh - 120px)', minHeight: 500 }}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-4">
                <FileText className="w-14 h-14 text-teal" />
                <p className="font-bold text-gray-900 text-lg">{cvData.name}</p>
                {cvData.title && <p className="text-gray-400 text-sm">{cvData.title}</p>}
                <p className="text-sm text-gray-500 text-center mt-1">
                  This CV is in a format that can't be previewed in the browser.
                </p>
                <a
                  href={cvData.download_url}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white font-semibold rounded-xl hover:opacity-90 transition"
                >
                  <Download size={16} />
                  Download CV
                </a>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
