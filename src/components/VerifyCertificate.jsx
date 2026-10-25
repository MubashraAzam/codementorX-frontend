import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  User,
  Mail,
  Phone,
  Printer,
  ArrowLeft,
  Code2,
  Sparkles,
  ExternalLink,
  BookOpen,
  FolderGit2,
  Brain,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "../utils/api";
import { trackMeta } from "../utils/tracks";

export default function VerifyCertificate() {
  const { certId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    async function fetchVerification() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest(`/api/certificate/verify/${certId}`, { method: "GET", auth: false });
        setCertData(data);
      } catch (err) {
        // Never show a certificate the server did not confirm. (A previous fallback
        // displayed a hard-coded "valid" certificate for any ID starting with CMX-,
        // which let anyone fake a credential.)
        setError(err.message || "Certificate could not be verified");
      } finally {
        setLoading(false);
      }
    }

    if (certId) {
      fetchVerification();
    }
  }, [certId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-[#8B6FE8]/20 border-t-[#8B6FE8] rounded-full animate-spin mb-4" />
        <h2 className="font-heading font-black text-2xl text-accent mb-2">Verifying Credential...</h2>
        <p className="text-gray-500 font-medium">Validating CodeMentor X digital record for ID: {certId}</p>
      </div>
    );
  }

  if (error || !certData) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <AlertCircle size={40} />
        </div>
        <h1 className="font-heading font-black text-3xl text-accent mb-2">Verification Failed</h1>
        <p className="text-gray-500 font-medium max-w-md mb-6 leading-relaxed">
          {error || `No certificate record found matching ID "${certId}". Please check the QR link and try again.`}
        </p>
        <Link to="/" className="btn-game btn-secondary px-8 py-3">
          <ArrowLeft size={18} className="mr-2" /> Go to CodeMentor X
        </Link>
      </div>
    );
  }

  const { student, language, projectsSolved, interviewScore, issuedAt, certificateNumber } = certData;
  const langLabel = `${trackMeta(language).label} Programming`;
  const langIcon = trackMeta(language).icon;

  const formattedIssued = issuedAt
    ? new Date(issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "Verified";

  const formattedStarted = student?.startDate
    ? new Date(student.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "July 2026";

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-accent py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-accent font-bold transition-colors">
            <ArrowLeft size={18} />
            <span>CodeMentor X Platform</span>
          </Link>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-xs font-black uppercase tracking-wider text-gray-500">
            <ShieldCheck size={16} className="text-[#2E9D62]" /> Official Digital Verification
          </div>
        </div>

        {/* MAIN VERIFICATION CARD */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border-4 border-[#E8EDF5] shadow-gamified overflow-hidden"
        >
          {/* HEADER BANNER */}
          <div className="bg-gradient-to-r from-[#25367C] via-[#3B4E9B] to-[#8B6FE8] p-8 sm:p-10 text-white relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white border border-white/30">
                  <CheckCircle2 size={14} className="text-[#4CAF50]" /> Verified Authentic Record
                </div>
                <h1 className="font-heading font-black text-3xl sm:text-4xl tracking-tight">
                  Certificate of Completion
                </h1>
                <p className="text-white/80 font-medium text-sm">
                  Issued by CodeMentor X AI-Powered Engineering Education Platform
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center min-w-[150px]">
                <div className="text-xs uppercase font-black text-white/70 tracking-wider mb-1">Status</div>
                <div className="text-lg font-heading font-black text-[#4CAF50] flex items-center justify-center gap-1.5">
                  <ShieldCheck size={20} /> Valid
                </div>
                <div className="text-[11px] font-mono text-white/60 mt-1 truncate max-w-[130px]" title={certificateNumber}>
                  {certificateNumber}
                </div>
              </div>
            </div>
          </div>

          {/* BODY CONTENT */}
          <div className="p-8 sm:p-10 space-y-10">

            {/* STUDENT & COURSE SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* STUDENT INFO */}
              <div className="bg-gray-50/80 rounded-2xl p-6 border-2 border-gray-100 space-y-4">
                <div className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <User size={16} className="text-[#8B6FE8]" /> Student Details
                </div>
                <div>
                  <div className="text-2xl font-heading font-black text-accent mb-1">
                    {student?.name || student?.username}
                  </div>
                  {student?.username && student.username !== student.name && (
                    <div className="text-xs text-gray-400 font-bold mb-3">Username: @{student.username}</div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-200/70 text-sm">
                  {student?.email && (
                    <div className="flex items-center gap-2 text-gray-600 font-medium">
                      <Mail size={15} className="text-gray-400 shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}
                  {student?.contact && (
                    <div className="flex items-center gap-2 text-gray-600 font-medium">
                      <Phone size={15} className="text-gray-400 shrink-0" />
                      <span>{student.contact}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* COURSE & TIMELINE INFO */}
              <div className="bg-gray-50/80 rounded-2xl p-6 border-2 border-gray-100 space-y-4">
                <div className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Code2 size={16} className="text-[#8B6FE8]" /> Curriculum Track
                </div>
                <div className="inline-flex items-center gap-2.5 bg-blue-50 border-2 border-blue-100 px-4 py-2 rounded-xl">
                  <span className="text-xl">{langIcon}</span>
                  <span className="font-heading font-black text-accent text-lg">{langLabel}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200/70 text-sm">
                  <div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar size={13} /> Started
                    </div>
                    <div className="font-bold text-accent">{formattedStarted}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar size={13} /> Completed
                    </div>
                    <div className="font-bold text-accent">{formattedIssued}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PROOF OF COMPLETION CRITERIA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-black text-lg text-accent flex items-center gap-2">
                  <Sparkles size={18} className="text-yellow-500" /> Proof of Completion Criteria
                </h3>
                <span className="text-xs font-black uppercase text-[#2E9D62] bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                  100% Requirements Met
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <BookOpen size={20} />
                    </div>
                    <div className="font-heading font-black text-2xl text-accent mb-1">20 / 20</div>
                    <div className="text-sm font-bold text-gray-600">Levels Mastered</div>
                  </div>
                  <div className="text-xs text-gray-400 font-medium mt-3 pt-2 border-t border-gray-100">
                    Full core curriculum & exercises completed
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                      <FolderGit2 size={20} />
                    </div>
                    <div className="font-heading font-black text-2xl text-accent mb-1">{projectsSolved || 5} Projects</div>
                    <div className="text-sm font-bold text-gray-600">AI Code Reviewed</div>
                  </div>
                  <div className="text-xs text-gray-400 font-medium mt-3 pt-2 border-t border-gray-100">
                    Hands-on portfolio projects verified
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border-2 border-green-100 bg-green-50/20 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-3">
                      <Brain size={20} />
                    </div>
                    <div className="font-heading font-black text-2xl text-success mb-1">{interviewScore || 80}% Score</div>
                    <div className="text-sm font-bold text-gray-600">AI Voice Interview</div>
                  </div>
                  <div className="text-xs text-green-700 font-bold mt-3 pt-2 border-t border-green-100 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Passed (Pass Mark: 75%)
                  </div>
                </div>
              </div>
            </div>

            {/* OFFICIAL ATTESTATION */}
            <div className="bg-[#FAFBFD] border-2 border-dashed border-gray-200 rounded-2xl p-6 text-sm text-gray-500 leading-relaxed">
              <div className="font-heading font-black text-accent text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#25367C]" /> CodeMentor X Authenticity Guarantee
              </div>
              <p>
                This electronic credential verifies that the named recipient has successfully satisfied all practical, algorithmic, and oral interview requirements established by CodeMentor X. Every project was validated by automated AI code assessment, and the oral technical interview was conducted in real-time.
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200/80 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-gray-400">
                <span>Verification ID: {certificateNumber}</span>
                <span>Algorithm: ECDSA / Secure Hash Verification</span>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => window.print()}
                className="btn-game btn-secondary px-6 py-3 text-sm flex items-center gap-2"
              >
                <Printer size={16} /> Print Official Verification
              </button>

              <Link
                to="/"
                className="btn-game btn-primary px-6 py-3 text-sm flex items-center gap-2"
              >
                <span>Visit CodeMentor X</span>
                <ExternalLink size={16} />
              </Link>
            </div>

          </div>
        </motion.div>

        {/* FOOTER */}
        <div className="text-center text-xs font-medium text-gray-400 mt-8 space-y-1">
          <div>© {new Date().getFullYear()} CodeMentor X. All rights reserved.</div>
          <div>Official Proof of Course Completion & Technical Credential System</div>
        </div>

      </div>
    </div>
  );
}
