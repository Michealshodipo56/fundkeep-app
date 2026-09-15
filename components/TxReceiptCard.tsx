"use client";

import { stellarExpertTxUrl, type TxReceipt } from "@/lib/tx";

export function TxReceiptCard({
  receipt,
}: {
  receipt: TxReceipt;
}) {
  if (!receipt.hash && receipt.ledger == null) {
    return null;
  }
  const href = receipt.hash ? stellarExpertTxUrl(receipt.hash) : null;

  return (
    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex flex-col gap-1.5">
      <p className="font-bold text-emerald-200">Confirmed on Stellar</p>
      {receipt.ledger != null && (
        <p>
          Ledger <span className="font-mono text-white">{receipt.ledger}</span>
        </p>
      )}
      {receipt.hash && (
        <p className="break-all">
          Tx{" "}
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="font-mono text-white underline underline-offset-2">
              {receipt.hash.slice(0, 8)}…{receipt.hash.slice(-8)}
            </a>
          ) : (
            <span className="font-mono text-white">{receipt.hash}</span>
          )}
        </p>
      )}
      {receipt.indexed === true && <p>Activity feed is in sync.</p>}
      {receipt.indexed === false && receipt.hash && (
        <p className="text-emerald-300/70">On-chain confirmed. The indexer may take a moment to catch up.</p>
      )}
    </div>
  );
}
