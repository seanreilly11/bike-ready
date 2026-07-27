import type { SignsSign } from "@/types";
import Card from "@/components/ui/Card";
import SignThumb, { signAlt } from "@/components/guide/SignThumb";

interface SignCardProps {
  sign: SignsSign;
}

export default function SignCard({ sign }: SignCardProps) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <SignThumb
          component={sign.component}
          alt={signAlt(sign.name, sign.code)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-display font-bold text-stone-900 text-sm">
                {sign.name}
              </h3>
              <p className="text-xs text-stone-500 italic">{sign.dutch_name}</p>
            </div>
            {sign.code && (
              <span className="font-mono text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded flex-shrink-0">
                {sign.code}
              </span>
            )}
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            {sign.description}
          </p>
          {sign.end_variant && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="text-xs text-stone-500 leading-relaxed">
                <span className="font-medium text-stone-900">
                  End-of variant:{" "}
                </span>
                {sign.end_variant}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
