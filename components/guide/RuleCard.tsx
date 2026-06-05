import type { SignsDesignRule } from "@/types";
import Card from "@/components/ui/Card";

type CardAccent = "orange" | "red" | "yellow" | null;

const ruleAccent: Record<string, CardAccent> = {
  shape_circle:      "orange",
  shape_triangle:    "yellow",
  shape_rectangle:   null,
  shape_diamond:     "yellow",
  colour_blue:       null,
  colour_red_border: "red",
  colour_red_bar:    "red",
  sash_red:          "red",
  sash_grey:         null,
  sub_signs:         null,
};

interface RuleCardProps {
  rule: SignsDesignRule;
}

export default function RuleCard({ rule }: RuleCardProps) {
  const accent = ruleAccent[rule.id] ?? null;

  return (
    <Card accent={accent}>
      <h3 className="font-display font-bold text-stone-900 text-sm mb-1.5">
        {rule.title}
      </h3>
      <p className="text-xs text-stone-600 leading-relaxed">{rule.body}</p>
    </Card>
  );
}
