import React, { useState, useEffect } from 'react';
import { Calendar, FastForward, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';

interface TimeMachineProps {
  onSimulate?: (simulatedDate: string) => void;
  compact?: boolean;
}

export const TimeMachine: React.FC<TimeMachineProps> = ({ onSimulate, compact = false }) => {
  const [currentDate, setCurrentDate] = useState<string>(dashboardService.getSimulatedDate());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    evaluated?: number;
    generated?: number;
    skipped?: number;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = dashboardService.subscribe((_summary, newDate) => {
      setCurrentDate(newDate);
    });
    return unsubscribe;
  }, []);

  const handleAdvance = async (days: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setFeedback(null);

    try {
      const result = await dashboardService.timeTravel(days);
      setCurrentDate(result.simulated_date);
      if (onSimulate) onSimulate(result.simulated_date);

      const gen = result.billing_result?.generated ?? 0;
      const skip = result.billing_result?.skipped ?? 0;
      const evalCount = result.billing_result?.evaluated ?? 0;

      setFeedback({
        message: `Advanced +${days}d to ${result.simulated_date}`,
        evaluated: evalCount,
        generated: gen,
        skipped: skip,
      });

      setTimeout(() => {
        setFeedback(null);
      }, 5000);
    } catch (err) {
      console.error('Time travel error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunToday = async () => {
    await handleAdvance(0);
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-[#0B0F19] text-white px-3.5 py-1.5 border border-white/10 shadow-lg text-xs">
        <span className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
          <Calendar className="h-3.5 w-3.5 text-blue-400" />
          <span>Simulated:</span>
          <strong className="text-white font-semibold">{currentDate}</strong>
        </span>
        <div className="h-3 w-[1px] bg-white/20 mx-0.5" />
        <button
          onClick={() => handleAdvance(1)}
          disabled={isProcessing}
          className="rounded-full bg-white/10 hover:bg-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white transition-colors active:scale-[0.96] disabled:opacity-50 cursor-pointer"
        >
          +1d
        </button>
        <button
          onClick={() => handleAdvance(7)}
          disabled={isProcessing}
          className="rounded-full bg-white/10 hover:bg-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white transition-colors active:scale-[0.96] disabled:opacity-50 cursor-pointer"
        >
          +7d
        </button>
        <button
          onClick={() => handleAdvance(30)}
          disabled={isProcessing}
          className="rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-3 py-0.5 text-[11px] font-semibold text-white transition-colors active:scale-[0.96] disabled:opacity-50 shadow-sm cursor-pointer"
        >
          +30d
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-[#0B0F19] text-white p-4 sm:p-5 border border-white/10 shadow-xl transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Engine Status & Current Date Indicator */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B49DF] to-[#242DB8] text-white shadow-inner">
            <Clock className="h-5 w-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                Chrono-Simulator
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Idempotent Engine
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-slate-400 text-xs">Simulated System Clock:</span>
              <span className="font-mono text-lg font-bold text-white tracking-tight">
                {currentDate}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunToday}
            disabled={isProcessing}
            title="Execute billing runner for the current date without advancing"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-medium text-slate-200 border border-white/10 transition-colors active:scale-[0.96] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Run Today</span>
          </button>

          <button
            onClick={() => handleAdvance(1)}
            disabled={isProcessing}
            className="inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/15 px-3.5 py-2 text-xs font-semibold text-white border border-white/10 transition-colors active:scale-[0.96] disabled:opacity-50 cursor-pointer"
          >
            <span>+1 Day</span>
          </button>

          <button
            onClick={() => handleAdvance(7)}
            disabled={isProcessing}
            className="inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/15 px-3.5 py-2 text-xs font-semibold text-white border border-white/10 transition-colors active:scale-[0.96] disabled:opacity-50 cursor-pointer"
          >
            <span>+7 Days</span>
          </button>

          <button
            onClick={() => handleAdvance(30)}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3B49DF] hover:bg-[#313DE0] px-4 py-2 text-xs font-bold text-white shadow-md transition-colors active:scale-[0.96] disabled:opacity-50 cursor-pointer"
          >
            <FastForward className="h-3.5 w-3.5 text-blue-200" />
            <span>+30 Days (Cycle)</span>
          </button>
        </div>
      </div>

      {/* Real-time Feedback & Audit Strip */}
      {feedback && (
        <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-300 animate-fade-in gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="font-medium text-white">{feedback.message}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Evaluated: <strong className="text-slate-200">{feedback.evaluated ?? 0}</strong></span>
            <span>Generated: <strong className="text-emerald-400">{feedback.generated ?? 0}</strong></span>
            <span>Skipped (Idempotent): <strong className="text-blue-300">{feedback.skipped ?? 0}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
