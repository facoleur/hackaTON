interface Props {
  txHash: string | null;
}

export function TransactionHashesCard({ txHash }: Props) {
  if (!txHash) return null;

  return (
    <div>
      <p className="text-muted-foreground mb-1 px-4 text-xs font-medium tracking-wide">
        Transaction
      </p>
      <div className="bg-card mx-4 overflow-hidden rounded-xl">
        <TxRow label="TX" hash={txHash} />
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
