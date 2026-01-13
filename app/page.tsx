"use client"; 
 
import { useState } from "react"; 
import Papa from "papaparse"; 
import { Upload, Download, CheckCircle, XCircle, AlertTriangle } from "lucide-react"; 
 
/* ================= TYPES ================= */ 
type Row = { 
  name: string; 
  domain: string; 
  email?: string; 
  verified?: "verified" | "invalid" | "unknown"; 
}; 
 
type ApiResult = { 
  email: string; 
  score: number; 
  status: string; 
}; 
 
type ApiResponse = { 
  results: ApiResult[]; 
}; 
/* ========================================= */ 
 
export default function Home() { 
  const [rows, setRows] = useState<Row[]>([]); 
  const [csvOut, setCsvOut] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [progress, setProgress] = useState(0); 
 
  /* -------- Email Prediction -------- */ 
  const predictEmail = (name: string, domain: string): string => { 
    if (!name || !domain) return ""; 
    const clean = name.trim().toLowerCase().split(/\s+/).join("."); 
    return ${clean}@${domain.toLowerCase()}; 
  }; 
 
  /* -------- CSV Upload Handler -------- */ 
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (!file) return; 
 
    Papa.parse<Row>(file, { 
      header: true, 
      skipEmptyLines: true, 
      complete: async (res: Papa.ParseResult<Row>) => { 
        const predicted: Row[] = res.data.map((r) => ({ 
          ...r, 
          email: r.email || predictEmail(r.name, r.domain), 
        })); 
 
        const emailsToVerify = predicted 
          .map((r) => r.email) 
          .filter(Boolean) as string[]; 
 
        setLoading(true); 
        setProgress(30); 
 
        let apiData: ApiResponse = { results: [] }; 
        try { 
          const response = await fetch("/api/verify", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ emails: emailsToVerify }), 
          }); 
          setProgress(70); 
          apiData = await response.json(); 
        } catch { 
          apiData = { results: [] }; 
        } 
 
        const finalRows: Row[] = predicted.map((r, i) => { 
          const result = apiData.results[i]; 
          let verified: Row["verified"] = "unknown"; 
          if (result && result.score > 50 && result.status === "VALID") { 
            verified = "verified"; 
          } else if (result) { 
            verified = "invalid"; 
          } 
          return { ...r, verified }; 
        }); 
 
        setRows(finalRows); 
        setCsvOut(Papa.unparse(finalRows)); 
        setProgress(100); 
        setLoading(false); 
      }, 
    }); 
  }; 
 
  /* -------- CSV Download -------- */ 
  const downloadCSV = (onlyVerified = false) => { 
    const data = onlyVerified 
      ? rows.filter((r) => r.verified === "verified") 
      : rows; 
 
    const csv = Papa.unparse(data); 
    const blob = new Blob([csv], { type: "text/csv" }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = onlyVerified 
      ? "verified_emails.csv" 
      : "all_predicted_emails.csv"; 
    a.click(); 
    URL.revokeObjectURL(url); 
  }; 
 
  const verifiedCount = rows.filter((r) => r.verified === "verified").length; 
  const invalidCount = rows.filter((r) => r.verified === "invalid").length; 
  const unknownCount = rows.filter((r) => r.verified === "unknown").length; 
 
  return ( 
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8"> 
      <div className="max-w-6xl mx-auto space-y-8"> 
        {/* Header */} 
        <div className="flex justify-between items-center"> 
          <h1 className="text-4xl font-bold">Email Prediction & Verification</h1> 
        </div> 
 
        {/* Upload Card */} 
        <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-8 text-center"> 
          <label className="flex flex-col items-center gap-4 cursor-pointer"> 
            <Upload size={40} className="text-blue-400" /> 
            <p className="text-lg font-semibold">Upload CSV</p> 
            <p className="text-slate-400 text-sm">name, domain, email(optional)</p> 
            <input type="file" accept=".csv" onChange={handleFile} className="hidden" /> 
          </label> 
        </div> 
 
        {/* Progress */} 
        {loading && ( 
          <div className="w-full bg-slate-700 rounded-full h-3"> 
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all" 
              style={{ width: ${progress}% }} 
            /> 
          </div> 
        )} 
 
        {/* Stats */} 
        {rows.length > 0 && ( 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
            <div className="bg-green-600/20 border border-green-600 rounded-xl p-4 flex items-center gap-3"> 
              <CheckCircle /> Verified: {verifiedCount} 
            </div> 
            <div className="bg-red-600/20 border border-red-600 rounded-xl p-4 flex items-center gap-3"> 
              <XCircle /> Invalid: {invalidCount} 
            </div> 
            <div className="bg-yellow-600/20 border border-yellow-600 rounded-xl p-4 flex items-center gap-3"> 
              <AlertTriangle /> Unknown: {unknownCount} 
            </div> 
          </div> 
        )} 
 
        {/* Table */} 
        {rows.length > 0 && ( 
          <div className="bg-slate-900/60 border border-slate-700 rounded-2xl overflow-hidden"> 
            <table className="w-full text-sm"> 
              <thead className="bg-slate-800 text-slate-300"> 
                <tr> 
                  <th className="p-3 text-left">Name</th> 
                  <th className="p-3 text-left">Domain</th> 
                  <th className="p-3 text-left">Email</th> 
                  <th className="p-3 text-left">Status</th> 
                </tr> 
              </thead> 
              <tbody> 
                {rows.map((r, i) => ( 
                  <tr key={i} className="border-t border-slate-700 hover:bg-slate-800/60"> 
                    <td className="p-3">{r.name}</td> 
                    <td className="p-3">{r.domain}</td> 
                    <td className="p-3">{r.email}</td> 
                    <td className="p-3"> 
                      {r.verified === "verified" && <span className="text-green-400">Verified</span>} 
                      {r.verified === "invalid" && <span className="text-red-400">Invalid</span>} 
                      {r.verified === "unknown" && <span className="text-yellow-400">Unknown</span>} 
                    </td> 
                  </tr> 
                ))} 
              </tbody> 
            </table> 
          </div> 
        )} 
 
        {/* Download */} 
        {rows.length > 0 && ( 
          <div className="flex flex-col md:flex-row gap-4"> 
            <button 
              onClick={() => downloadCSV(false)} 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center gap-2" 
            > 
              <Download /> Export All 
            </button> 
 
            <button 
              onClick={() => downloadCSV(true)} 
              className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl flex items-center gap-2" 
            > 
              <Download /> Export Verified Only 
            </button> 
          </div> 
        )} 
      </div> 
    </main> 
  );
}
