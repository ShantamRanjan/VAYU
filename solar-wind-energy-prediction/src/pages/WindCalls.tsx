import { useState } from "react";
import { callLog } from "@/data/mockData";
import { ChevronDown, ChevronRight, Phone, PhoneOff, ArrowUpRight } from "lucide-react";

export default function WindCalls() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-foreground">Call Log</h1>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground"></th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Recipient</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Phone</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Time</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Duration</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Escalation</th>
            </tr>
          </thead>
          <tbody>
            {callLog.map((call) => (
              <>
                <tr
                  key={call.id}
                  className="border-b border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                >
                  <td className="p-3">
                    {call.transcript ? (
                      expandedId === call.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : <span className="w-4 h-4 block" />}
                  </td>
                  <td className="p-3 text-foreground font-medium">{call.recipient}</td>
                  <td className="p-3 font-mono text-muted-foreground hidden md:table-cell">{call.phone}</td>
                  <td className="p-3 font-mono text-foreground">{call.time}</td>
                  <td className="p-3 font-mono text-foreground">{call.duration}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      call.status === "Answered" ? "status-green" : "status-red"
                    }`}>
                      {call.status === "Answered" ? <Phone className="w-3 h-3" /> : <PhoneOff className="w-3 h-3" />}
                      {call.status}
                    </span>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {call.escalated && (
                      <span className="inline-flex items-center gap-1 text-xs text-status-orange font-medium">
                        <ArrowUpRight className="w-3 h-3" />
                        Escalated
                      </span>
                    )}
                  </td>
                </tr>
                {expandedId === call.id && call.transcript && (
                  <tr key={`${call.id}-exp`} className="bg-secondary/20">
                    <td colSpan={7} className="p-4">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Call Transcript:</p>
                      <p className="text-sm text-foreground bg-secondary/50 p-3 rounded-lg">{call.transcript}</p>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Escalation chain visual */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Escalation Chain</h3>
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">Site Manager</div>
          <span className="text-muted-foreground">→</span>
          <div className="px-3 py-2 rounded-lg bg-status-orange/10 text-status-orange font-medium">Shift Lead</div>
          <span className="text-muted-foreground">→</span>
          <div className="px-3 py-2 rounded-lg bg-status-red/10 text-status-red font-medium">Regional Manager</div>
          <span className="text-muted-foreground">→</span>
          <div className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive font-medium">Emergency Services</div>
        </div>
      </div>
    </div>
  );
}
