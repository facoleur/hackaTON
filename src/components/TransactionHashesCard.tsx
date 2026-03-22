interface Props {
  upfrontHash: string | null;
  finalHash: string | null;
}

export function TransactionHashesCard({ upfrontHash, finalHash }: Props) {
  if (!upfrontHash) return null;

  return (
    <div>
      <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
        Transaction Hashes
      </p>
      <div className="bg-card divide-border mx-4 divide-y overflow-hidden rounded-xl">
        <TxRow label="Upfront TX" hash={upfrontHash} />
        {finalHash && <TxRow label="Final TX" hash={finalHash} />}
      </div>
    </div>
  );
}

function TxRow({ label, hash }: { label: string; hash: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-foreground mb-1 text-sm font-medium">{label}</p>
      <p className="text-muted-foreground text-xs break-all">{hash}</p>
    </div>
  );
}
