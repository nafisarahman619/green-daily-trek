import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TreePine, Plus } from "lucide-react";

const KG_PER_TREE = 20;

export function TreesToPlantCard({
  userId,
  logs,
}: {
  userId: string;
  logs: { co2_kg: number; log_date: string }[];
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState<number>(1);

  const plantings = useQuery({
    queryKey: ["tree_plantings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tree_plantings")
        .select("count")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).reduce((s, r: any) => s + Number(r.count ?? 0), 0);
    },
  });

  const owed = useMemo(() => {
    const totalKg = logs.reduce((s, l) => s + Number(l.co2_kg), 0);
    return Math.max(0, Math.floor(totalKg / KG_PER_TREE));
  }, [logs]);

  const planted = plantings.data ?? 0;
  const remaining = Math.max(0, owed - planted);

  const addTrees = useMutation({
    mutationFn: async (count: number) => {
      const { error } = await supabase
        .from("tree_plantings")
        .insert({ user_id: userId, count });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tree_plantings", userId] }),
  });

  return (
    <div
      className="surface-card p-5"
      style={{
        background:
          "linear-gradient(160deg, color-mix(in oklab, var(--pistachio) 35%, var(--paper)), var(--paper))",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--ink-soft)" }}
          >
            Trees to Plant
          </p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="display text-3xl" style={{ color: "var(--fern-shade)" }}>
              🌳 {remaining}
            </span>
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--ink-soft)" }}>
            {owed} owed · {planted} planted · 1 tree / {KG_PER_TREE}kg CO₂
          </p>
        </div>
        <TreePine className="h-5 w-5" style={{ color: "var(--fern-shade)" }} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          className="w-20 rounded-lg border px-2 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--paper)" }}
        />
        <button
          onClick={() => addTrees.mutate(amount)}
          disabled={addTrees.isPending}
          className="btn-fern flex-1"
          style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}
        >
          <Plus className="h-4 w-4" /> I planted {amount === 1 ? "a tree" : `${amount} trees`}
        </button>
      </div>
    </div>
  );
}
