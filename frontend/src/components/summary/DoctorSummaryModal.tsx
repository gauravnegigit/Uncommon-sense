import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Sparkles, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ClinicalSummaryResponse, TriageMessage } from '../../types';
import { summaryService } from '../../services/summaryService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ReferralSlipPrint } from './ReferralSlipPrint';

interface DoctorSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  messages: TriageMessage[];
  dangerSigns: string[];
  locationName: string;
}

export const DoctorSummaryModal: React.FC<DoctorSummaryModalProps> = ({
  isOpen,
  onClose,
  chatId,
  messages,
  dangerSigns,
  locationName,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { t, isHindi } = useLanguage();

  const [summary, setSummary] = useState<ClinicalSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch AI SBAR summary from backend /api/summary/generate?chat_id=...
  const fetchSummary = async () => {
    if (!chatId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await summaryService.generateSummary(chatId);
      setSummary(data);
    } catch (err: any) {
      console.warn('Backend summary generate error, using active session preview:', err);
      setErrorMsg(err.message || 'Could not fetch summary from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && chatId) {
      fetchSummary();
    }
  }, [isOpen, chatId]);

  if (!isOpen) return null;

  // Handle PDF Export using html2canvas & jspdf
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const element = document.getElementById('printable-referral-slip');
      if (!element) {
        window.print();
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `GraminHealth_ReferralSlip_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
    } catch (e) {
      console.error('PDF generation error, falling back to print dialog:', e);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center p-1 bg-slate-900 rounded-lg border border-slate-800">
              <img src="/logo.png" alt="Gramin Health" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>{t('referralSlipTitle')} (SBAR)</span>
                {summary && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 text-[10px] font-mono">
                    AI Verified
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                MoHFW & ICMR Primary Care Clinical Handover Note for Medical Officer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-900 transition-colors"
              title="Regenerate Summary from Backend"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-bold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 flex-1 custom-scrollbar space-y-4">
          {loading && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>{isHindi ? 'AI क्लिनिकल SBAR सारांश तैयार हो रहा है (/api/summary/generate)...' : 'Synthesizing multi-turn clinical history via /api/summary/generate...'}</span>
            </div>
          )}

          {errorMsg && !summary && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium">
              ℹ️ {isHindi ? 'वर्तमान सक्रिय चैट से क्लिनिकल रेफरल पर्ची पूर्वावलोकन:' : 'Displaying active consultation clinical handover preview:'}
            </div>
          )}

          {/* Printable Slip Component */}
          <ReferralSlipPrint
            summary={summary}
            messages={messages}
            patientName={user?.name || 'Patient'}
            locationName={locationName}
            dangerSigns={dangerSigns}
          />
        </div>

        {/* Footer Actions */}
        <div className="bg-white px-5 sm:px-6 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            {t('close')}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{t('printReferral')}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingPdf ? (isHindi ? 'PDF तैयार हो रहा है...' : 'Generating PDF...') : t('downloadPdf')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
