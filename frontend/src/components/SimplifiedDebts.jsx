import { useAuth } from '../context/AuthContext.jsx';

export default function SimplifiedDebts({ transactions = [], onQuickSettle }) {
  const { user } = useAuth();

  if (transactions.length === 0) {
    return (
      <div className="bg-[#edf5f0] border border-[#cce3d4] text-emerald-800 p-4 rounded-xl text-center text-xs sm:text-sm font-medium flex items-center justify-center space-x-2">
        <span>🎉</span>
        <span>All settled up! No outstanding balances in this circle.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {transactions.map((tx, idx) => {
        // Robust check for current logged-in user
        const currentUserId = (user?._id || user?.id)?.toString();
        const currentUserEmail = user?.email?.toLowerCase();

        const fromId = (tx.from?._id || tx.from?.id || (typeof tx.from === 'string' ? tx.from : ''))?.toString();
        const fromEmail = tx.from?.email?.toLowerCase();

        const toId = (tx.to?._id || tx.to?.id || (typeof tx.to === 'string' ? tx.to : ''))?.toString();
        const toEmail = tx.to?.email?.toLowerCase();

        const isUserDebtor = Boolean(
          (currentUserId && fromId === currentUserId) ||
          (currentUserEmail && fromEmail && currentUserEmail === fromEmail)
        );
        const isUserCreditor = Boolean(
          (currentUserId && toId === currentUserId) ||
          (currentUserEmail && toEmail && currentUserEmail === toEmail)
        );

        return (
          <div
            key={idx}
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition shadow-3xs gap-2.5 ${
              isUserDebtor
                ? 'bg-[#f7f1e7] border-[#d8c9b4] ring-1 ring-[#cfbea6]/70'
                : 'bg-[#fbf9f4] border-[#e2d7c5]'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-stone-800">
              {/* Who owes */}
              <span
                className={`font-semibold px-2.5 py-1 rounded-lg border inline-flex items-center space-x-1.5 ${
                  isUserDebtor
                    ? 'bg-[#ede2d1] text-stone-900 border-[#d5c3ac] font-bold'
                    : 'bg-[#f4ebe0] text-stone-800 border-[#e0d3c3]'
                }`}
              >
                <span>{tx.from?.name || 'Member'}</span>
                {isUserDebtor && (
                  <span className="text-[10px] bg-stone-800 text-[#fbf9f4] font-bold px-2 py-0.5 rounded-full shadow-3xs tracking-wider uppercase">
                    You
                  </span>
                )}
              </span>

              <span className="text-stone-400 font-mono text-xs">owes</span>

              {/* Who is owed */}
              <span
                className={`font-semibold px-2.5 py-1 rounded-lg border inline-flex items-center space-x-1.5 ${
                  isUserCreditor
                    ? 'bg-[#e7eee8] text-[#274630] border-[#c0d4c4] font-bold'
                    : 'bg-[#eef3ef] text-[#365740] border-[#ccded0]'
                }`}
              >
                <span>{tx.to?.name || 'Member'}</span>
                {isUserCreditor && (
                  <span className="text-[10px] bg-[#33533c] text-white font-bold px-2 py-0.5 rounded-full shadow-3xs tracking-wider uppercase">
                    You
                  </span>
                )}
              </span>

              {/* Amount */}
              <span className="font-mono font-bold text-stone-900 bg-[#ede4d4] px-2.5 py-1 rounded-md border border-[#dacbb7]">
                ₹{tx.amount.toFixed(2)}
              </span>

              {/* Subtle gentle indicator when you owe (without any hazard sign or red) */}
              {isUserDebtor && (
                <span className="text-[11px] text-stone-600 font-medium italic">
                  (You owe ₹{tx.amount.toFixed(2)})
                </span>
              )}
            </div>

            {onQuickSettle && (
              <button
                onClick={() => onQuickSettle(tx)}
                className="text-xs font-semibold px-3.5 py-2 rounded-xl transition self-start sm:self-auto shadow-xs flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-900 text-[#fbf9f4]"
              >
                <span>🤝</span>
                <span>{isUserDebtor ? 'Pay / Settle Up' : 'Settle Now'}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
