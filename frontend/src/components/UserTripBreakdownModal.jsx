import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function UserTripBreakdownModal({ memberBalance, clusterName = 'Trip Cluster', onClose }) {
  const { user: currentUser } = useAuth();

  if (!memberBalance) return null;

  const { user, balance = 0, totalPaid = 0, totalShare = 0, totalSettledPaid = 0, totalSettledReceived = 0, trips = [] } = memberBalance;

  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
  const memberId = (user?._id || user?.id)?.toString();
  const isCurrentUser = Boolean(currentUserId && memberId === currentUserId);

  const isPositive = balance > 0;
  const isNegative = balance < 0;

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#fbf9f4] border border-[#ded5c5] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 pb-3 border-b border-[#ece4d6] flex items-center justify-between bg-[#f8f2e7]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-stone-800 text-[#fbf9f4] flex items-center justify-center font-bold text-sm uppercase shadow-xs">
              {user?.name?.charAt(0) || '👤'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif-quote font-bold text-lg text-stone-900">
                  {user?.name}
                </h2>
                {isCurrentUser && (
                  <span className="text-[10px] bg-stone-800 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg text-lg transition hover:bg-[#ede5d6]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Net Balance Master Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs ${
              isPositive
                ? 'bg-[#eef6f0] border-[#c5decb]'
                : isNegative
                ? 'bg-[#fdf3f0] border-[#edd0c8]'
                : 'bg-[#f4efe5] border-[#dfd4c3]'
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold tracking-wide uppercase text-stone-500 block">
                Overall Consolidated Net Balance
              </span>
              <p className="text-xs text-stone-600 mt-0.5">
                {isPositive
                  ? `${user?.name || 'Traveler'} is owed back from the group across all trips.`
                  : isNegative
                  ? `${user?.name || 'Traveler'} owes money back towards shared expenses across all trips.`
                  : `${user?.name || 'Traveler'} is fully squared up with no remaining balance.`}
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  isPositive ? 'text-[#245233]' : isNegative ? 'text-[#943425]' : 'text-stone-700'
                }`}
              >
                {isPositive ? `+₹${balance.toFixed(2)}` : isNegative ? `-₹${Math.abs(balance).toFixed(2)}` : '₹0.00'}
              </span>
              <span className="block text-[10px] font-medium text-stone-500">
                {isPositive ? 'Net to Receive' : isNegative ? 'Net to Pay' : 'Settled ✨'}
              </span>
            </div>
          </div>

          {/* Aggregate Stats Bar */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#f6efe3] border border-[#e2d7c5] p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-stone-500 block">Total Paid</span>
              <span className="font-mono font-bold text-stone-800 text-xs sm:text-sm">
                ₹{totalPaid.toFixed(2)}
              </span>
            </div>
            <div className="bg-[#f6efe3] border border-[#e2d7c5] p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-stone-500 block">Total Share</span>
              <span className="font-mono font-bold text-stone-800 text-xs sm:text-sm">
                ₹{totalShare.toFixed(2)}
              </span>
            </div>
            <div className="bg-[#f6efe3] border border-[#e2d7c5] p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-stone-500 block">Trips Involved</span>
              <span className="font-mono font-bold text-stone-800 text-xs sm:text-sm">
                {trips.length} {trips.length === 1 ? 'Trip' : 'Trips'}
              </span>
            </div>
          </div>

          {/* Section: All Trips Breakdown */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-quote font-bold text-stone-900 text-sm flex items-center space-x-1.5">
                <span>🎒</span>
                <span>Breakdown of Trips Towards this Balance</span>
              </h3>
              <span className="text-[11px] text-stone-500 font-mono">
                {clusterName}
              </span>
            </div>

            <p className="text-[11px] text-stone-500">
              Each daily circle / trip leg below details what {user?.name} paid versus their shared consumption:
            </p>

            {trips.length === 0 ? (
              <div className="p-4 bg-[#f6efe3] border border-[#e2d7c5] rounded-xl text-center text-stone-500 text-xs">
                No individual trip breakdown data found for this cluster.
              </div>
            ) : (
              <div className="space-y-2.5">
                {trips.map((trip) => {
                  const tripIsPositive = trip.netBalance > 0;
                  const tripIsNegative = trip.netBalance < 0;

                  return (
                    <div
                      key={trip.groupId}
                      className="bg-[#faf5eb] border border-[#dfd4c2] hover:border-[#cfc1ac] rounded-xl p-3.5 transition shadow-3xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-base">📍</span>
                            <h4 className="font-semibold text-stone-900 text-xs sm:text-sm">
                              {trip.groupName}
                            </h4>
                          </div>
                          <p className="text-[10px] text-stone-500 mt-0.5 ml-6">
                            📅 {new Date(trip.groupDate).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Trip Net Balance Badge */}
                        <div className="text-right shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                              tripIsPositive
                                ? 'bg-[#dceade] text-[#245233]'
                                : tripIsNegative
                                ? 'bg-[#f8ded8] text-[#943425]'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {tripIsPositive
                              ? `+₹${trip.netBalance.toFixed(2)}`
                              : tripIsNegative
                              ? `-₹${Math.abs(trip.netBalance).toFixed(2)}`
                              : '₹0.00'}
                          </span>
                          <span className="block text-[9px] text-stone-500 mt-0.5 font-medium">
                            {tripIsPositive ? 'Receives' : tripIsNegative ? 'Owes' : 'Balanced'}
                          </span>
                        </div>
                      </div>

                      {/* Mini Ledger breakdown line items */}
                      <div className="mt-3 pt-2.5 border-t border-[#ede2d1] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-stone-500 block text-[10px]">Paid for Trip</span>
                          <span className="font-mono font-semibold text-stone-800">
                            ₹{trip.paid.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[10px]">Shared Split</span>
                          <span className="font-mono font-semibold text-stone-800">
                            ₹{trip.share.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[10px]">Settlements</span>
                          <span className="font-mono font-semibold text-stone-800">
                            {trip.settledPaid - trip.settledReceived !== 0
                              ? `₹${(trip.settledPaid - trip.settledReceived).toFixed(2)}`
                              : '₹0.00'}
                          </span>
                        </div>
                        <div className="flex items-end justify-start sm:justify-end">
                          <Link
                            to={`/group/${trip.groupId}`}
                            onClick={onClose}
                            className="text-[11px] font-semibold text-stone-800 hover:text-stone-950 underline hover:no-underline"
                          >
                            Open Ledger →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mathematical Reconciliation Equation */}
          {trips.length > 1 && (
            <div className="p-3 bg-[#f3ecde] border border-[#ded2bd] rounded-xl text-[11px] text-stone-600 space-y-1">
              <span className="font-semibold text-stone-800 block">🧮 Balance Reconciliation:</span>
              <p className="font-mono text-[10px] sm:text-[11px] leading-relaxed break-words">
                {trips.map((t, idx) => (
                  <span key={t.groupId}>
                    {idx > 0 && ' + '}
                    <span>
                      ({t.groupName}: {t.netBalance >= 0 ? `+₹${t.netBalance.toFixed(2)}` : `-₹${Math.abs(t.netBalance).toFixed(2)}`})
                    </span>
                  </span>
                ))}
                {' = '}
                <strong className={isPositive ? 'text-[#245233]' : isNegative ? 'text-[#943425]' : 'text-stone-900'}>
                  {isPositive ? `+₹${balance.toFixed(2)}` : isNegative ? `-₹${Math.abs(balance).toFixed(2)}` : '₹0.00'}
                </strong>
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#ece4d6] bg-[#f8f2e7] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] font-medium rounded-xl text-xs transition"
          >
            Close Breakdown
          </button>
        </div>

      </div>
    </div>
  );
}
