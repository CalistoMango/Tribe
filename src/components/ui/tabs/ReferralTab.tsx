"use client";

import { Gift, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useReferrals } from "~/hooks/useReferrals";

interface ReferralTabProps {
  userFid: number | null;
}

export function ReferralTab({ userFid }: ReferralTabProps) {
  const { leaderboard, userStats, isLoading } = useReferrals(userFid);
  const [copied, setCopied] = useState(false);

  const referralLink = userStats?.referral_code
    ? `tribe.xyz/r/${userStats.referral_code}`
    : null;

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      {/* Your Referral Link */}
      <div className="bg-gradient-to-br from-fuchsia-900/50 to-violet-900/50 border border-fuchsia-800/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-5 h-5 text-fuchsia-400" />
          <span className="font-medium">Your Referral Link</span>
        </div>
        <div className="bg-zinc-900/50 rounded-lg p-3 flex items-center gap-2 mb-4">
          {isLoading ? (
            <div className="flex-1 h-5 bg-zinc-800 rounded animate-pulse" />
          ) : referralLink ? (
            <code className="flex-1 text-sm text-zinc-300 truncate">{referralLink}</code>
          ) : (
            <span className="flex-1 text-sm text-zinc-500">Sign in to get your referral link</span>
          )}
          <button
            onClick={handleCopyLink}
            disabled={!referralLink}
            className="text-fuchsia-400 hover:text-fuchsia-300 disabled:text-zinc-600 disabled:cursor-not-allowed"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-sm text-zinc-400">Invite friends to earn airdrop allocation. Referrals are tracked forever.</p>
      </div>

      {/* Your Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900 rounded-xl p-4">
          <div className="text-sm text-zinc-400 mb-1">Your Referrals</div>
          {isLoading ? (
            <div className="h-8 w-12 bg-zinc-800 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-bold text-fuchsia-400">
              {userStats?.referral_count ?? 0}
            </div>
          )}
        </div>
        <div className="bg-zinc-900 rounded-xl p-4">
          <div className="text-sm text-zinc-400 mb-1">Your Rank</div>
          {isLoading ? (
            <div className="h-8 w-12 bg-zinc-800 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-bold">
              {userStats?.rank ? `#${userStats.rank}` : '-'}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h3 className="font-medium mb-3">Referral Leaderboard</h3>
        <div className="bg-zinc-900 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-800 rounded-full animate-pulse" />
                  <div className="w-10 h-10 bg-zinc-800 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse mb-1" />
                    <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No referrals yet. Be the first to invite friends!
            </div>
          ) : (
            leaderboard.map((entry, i) => (
              <div
                key={entry.fid}
                className={`flex items-center gap-3 p-4 ${i !== leaderboard.length - 1 ? 'border-b border-zinc-800' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  entry.rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                  entry.rank === 2 ? 'bg-zinc-400 text-zinc-900' :
                  entry.rank === 3 ? 'bg-orange-600 text-orange-100' :
                  'bg-zinc-700 text-zinc-300'
                }`}>
                  {entry.rank}
                </div>
                {entry.pfp_url ? (
                  <img src={entry.pfp_url} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
                    {entry.display_name?.[0] || entry.username?.[0] || '?'}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{entry.display_name || entry.username || 'Anonymous'}</div>
                  <div className="text-sm text-zinc-400">@{entry.username || 'unknown'}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-fuchsia-400">{entry.referral_count}</div>
                  <div className="text-xs text-zinc-500">referrals</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
