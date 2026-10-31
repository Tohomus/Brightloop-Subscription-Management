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
      <div className="inline-flex items-center gap-2 rounded-lg bg-[#0A0A0B] text-white px-3 py-1 border border-[#27272A] font-mono text-xs">
        <span className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
          <Calendar className="h-3.5 w-3.5 text-zinc-300" />
          <span>SIMULATED:</span>
          <strong className="text-zinc-100 font-semibold tabular-nums">{currentDate}</strong>
        </span>
        <div className="h-3 w-[1px] bg-[#27272A] mx-0.5" />
        <button
          onClick={() => handleAdvance(1)}
          disabled={isProcessing}
          className="rounded px-2 py-0.5 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-[#1E1E22] transition-colors disabled:opacity-50 cursor-pointer"
        >
          +1d
        </button>
        <button
          onClick={() => handleAdvance(7)}
          disabled={isProcessing}
          className="rounded px-2 py-0.5 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-[#1E1E22] transition-colors disabled:opacity-50 cursor-pointer"
        >
          +7d
        </button>
        <button
          onClick={() => handleAdvance(30)}
          disabled={isProcessing}
          className="rounded bg-[#2563EB] hover:bg-[#1D4ED8] px-2.5 py-0.5 text-[11px] font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
        >
          +30d
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl bg-[#0A0A0B] text-white p-4 border border-[#27272A] shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Engine Status & Current Date Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141416] border border-[#27272A] text-zinc-300">
            <Clock className="h-4 w-4 text-zinc-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-medium tracking-wider text-zinc-400 uppercase">
                Chrono-Simulator
              </span>
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                IDEMPOTENT RUNNER
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-zinc-500 text-xs">Simulated System Clock:</span>
              <span className="font-mono text-base font-semibold text-zinc-100 tracking-tight tabular-nums">
                {currentDate}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleRunToday}
            disabled={isProcessing}
            title="Execute billing runner for the current date without advancing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#141416] hover:bg-[#1E1E22] px-3 py-1.5 text-xs font-mono font-medium text-zinc-300 border border-[#27272A] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Run Today</span>
          </button>

          <button
            onClick={() => handleAdvance(1)}
            disabled={isProcessing}
            className="inline-flex items-center rounded-lg bg-[#141416] hover:bg-[#1E1E22] px-3 py-1.5 text-xs font-mono font-medium text-zinc-200 border border-[#27272A] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span>+1 Day</span>
          </button>

          <button
            onClick={() => handleAdvance(7)}
            disabled={isProcessing}
            className="inline-flex items-center rounded-lg bg-[#141416] hover:bg-[#1E1E22] px-3 py-1.5 text-xs font-mono font-medium text-zinc-200 border border-[#27272A] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span>+7 Days</span>
          </button>

          <button
            onClick={() => handleAdvance(30)}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-1.5 text-xs font-mono font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FastForward className="h-3.5 w-3.5" />
            <span>+30 Days (Cycle)</span>
          </button>
        </div>
      </div>

      {/* Real-time Feedback & Audit Strip */}
      {feedback && (
        <div className="mt-3 pt-3 border-t border-[#27272A] flex flex-wrap items-center justify-between text-xs text-zinc-400 font-mono gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium text-zinc-200">{feedback.message}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span>Evaluated: <strong className="text-zinc-200 tabular-nums">{feedback.evaluated ?? 0}</strong></span>
            <span>Generated: <strong className="text-emerald-400 tabular-nums">{feedback.generated ?? 0}</strong></span>
            <span>Skipped: <strong className="text-zinc-400 tabular-nums">{feedback.skipped ?? 0}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

