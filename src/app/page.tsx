import Link from "next/link";
import {
  Network,
  ArrowRight,
  FileText,
  Cpu,
  Code2,
  Share2,
  Shield,
  Layers,
  ChevronRight,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 px-6 sm:px-12 flex items-center justify-between bg-slate-950/40 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Network className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            CINDER BOUND
          </span>
        </div>

        <Link
          href="/workspace"
          className="text-xs font-mono font-medium px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
        >
          <span>Enter Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24 text-center max-w-5xl mx-auto">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono mb-6">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI-POWERED CRIMINAL NETWORK ANALYSIS</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
          Evidence <span className="text-slate-600 font-light">to</span> Intelligence.
        </h1>

        {/* Short explanation */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Cinder Bound ingests unorganized police FIRs, Call Detail Records (CDRs), and bank statements, extracts suspects, accounts, and transactions with AI, and renders a fully interactive connected graph linked back to original evidence.
        </p>

        {/* CTA Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/workspace"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition-all hover:scale-105"
          >
            <span>Enter Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Core Visual Pipeline: Evidence -> Intelligence */}
        <div className="mt-20 w-full">
          <div className="text-left mb-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
              SYSTEM PIPELINE ARCHITECTURE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {/* Step 1 */}
            <div className="p-5 rounded-xl border border-slate-800/90 bg-slate-950/60 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono text-slate-500 mb-1">01 / INPUT</div>
              <h3 className="text-sm font-semibold text-slate-200">Raw Evidence</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                FIR documents, telecom CDR dumps, bank statements, and intelligence memos.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-xl border border-slate-800/90 bg-slate-950/60 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono text-slate-500 mb-1">02 / EXTRACT</div>
              <h3 className="text-sm font-semibold text-slate-200">Gemma AI Engine</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Detects document type and applies schema prompts to extract entities and relations.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-xl border border-slate-800/90 bg-slate-950/60 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono text-slate-500 mb-1">03 / STRUCTURE</div>
              <h3 className="text-sm font-semibold text-slate-200">Structured JSON</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Normalized entities, events, and relationships with exact textual provenance quotes.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-xl border border-slate-800/90 bg-slate-950/60 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono text-slate-500 mb-1">04 / GRAPH</div>
              <h3 className="text-sm font-semibold text-slate-200">Connected Graph</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Interactive canvas with node inspection and direct links back to original evidence.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="h-12 border-t border-slate-900/80 px-6 sm:px-12 flex items-center justify-between text-[11px] font-mono text-slate-600 bg-slate-950/80">
        <span>Cinder Bound — Smart India Hackathon Prototype</span>
        <span>Local Client Architecture • Zero Backend Required</span>
      </footer>
    </div>
  );
}
