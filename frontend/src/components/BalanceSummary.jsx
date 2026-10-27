import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import UserTripBreakdownModal from './UserTripBreakdownModal.jsx';

export default function BalanceSummary({ memberBalances = [], clusterName = 'Trip Cluster', onSelectMember }) {
  const { user: currentUser } = useAuth();
  const [selectedMember, setSelectedMember] = useState(null);

  if (memberBalances.length === 0) {
    return <p className="text-stone-500 italic text-xs">No balance records available.</p>;
  }

  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
  const currentUserEmail = currentUser?.email?.toLowerCase();

  const handleCardClick = (item) => {
    if (onSelectMember) {
      onSelectMember(item);
    } else {
      setSelectedMember(item);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {memberBalances.map((item) => {
          const { user, balance, trips = [] } = item;
          const isPositive = balance > 0;
          const isNegative = balance < 0;
          const memberId = (user?._id || user?.id)?.toString();
          const memberEmail = user?.email?.toLowerCase();
          const isCurrentUser = Boolean(
            (currentUserId && memberId === currentUserId) ||
            (currentUserEmail && memberEmail && currentUserEmail === memberEmail)
          );

          return (
            <div
              key={user._id || memberId}
              onClick={() => handleCardClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(item);
                }
              }}
              title={`Click to view all trips and expenses involved towards ${user.name}'s net balance`}
              className={`group p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 shadow-3xs cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-left ${
                isCurrentUser
                  ? isNegative
                    ? 'bg-[#f7f1e7] border-[#d8c9b4] ring-1 ring-[#cfbea6]/80 hover:border-[#bda78d]'
                    : 'bg-[#f2f7f3] border-[#c8dacb] ring-1 ring-[#b8cebc]/80 hover:border-[#a0c2a5]'
                  : isPositive
                  ? 'bg-[#edf5f0] border-[#cce3d4] hover:border-[#a6d1b2]'
                  : isNegative
                  ? 'bg-[#f8f3ea] border-[#dfd2bf] hover:border-[#c5b298]'
                  : 'bg-[#f4ede1] border-[#e0d6c4] hover:border-[#c7b9a1]'
              }`}
            >
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-stone-700 group-hover:bg-stone-900 text-[#fbf9f4] flex items-center justify-center font-bold text-xs uppercase shadow-xs transition">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <p className="font-semibold text-stone-900 text-xs sm:text-sm truncate group-hover:text-stone-700 transition">
                        {user.name}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-stone-800 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-stone-500 font-medium">
                    {isPositive ? 'Receives' : isNegative ? 'Owes' : 'Status'}
                  </span>

                  {isPositive && (
                    <span className="font-bold text-[#2d4d36] bg-[#dbe8de] px-2 py-0.5 rounded font-mono">
                      +₹{balance.toFixed(2)}
                    </span>
                  )}
                  {isNegative && (
                    <span className="font-bold text-stone-800 bg-[#ede1cf] border border-[#d8c7b0] px-2 py-0.5 rounded font-mono">
                      -₹{Math.abs(balance).toFixed(2)}
                    </span>
                  )}
                  {!isPositive && !isNegative && (
                    <span className="font-medium text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded">
                      Settled ✨
                    </span>
                  )}
                </div>
              </div>

              {/* Click-to-view Breakdown Footer Indicator */}
              <div className="mt-2.5 pt-2 border-t border-stone-200/50 flex items-center justify-between text-[10px] text-stone-500 group-hover:text-stone-800 transition">
                <span className="flex items-center space-x-1 font-medium">
                  <span>{trips.length > 0 ? `🎒 ${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} involved` : '🔍 View breakdown'}</span>
                </span>
                <span className="font-semibold text-stone-700 group-hover:text-stone-900 group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5">
                  <span>Trips Breakdown</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Render Trip Breakdown Modal when a member is clicked */}
      {selectedMember && (
        <UserTripBreakdownModal
          memberBalance={selectedMember}
          clusterName={clusterName}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </>
  );
}

