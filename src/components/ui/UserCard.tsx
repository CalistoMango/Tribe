"use client";

import { Sparkles, User } from "lucide-react";
import { useCategories } from "~/hooks/useCategories";
import type { DiscoverUser } from "~/hooks/useDiscoverUsers";

interface UserCardProps {
  user: DiscoverUser;
}

export function UserCard({ user }: UserCardProps) {
  const { categories } = useCategories();

  const getCategoryDisplay = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? { emoji: cat.emoji, name: cat.display_name } : null;
  };

  return (
    <div className="bg-zinc-900 rounded-xl p-4 flex gap-3">
      {user.pfp_url ? (
        <img src={user.pfp_url} alt="" className="w-12 h-12 rounded-full flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 flex-shrink-0">
          {user.display_name?.[0] || user.username?.[0] || '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{user.display_name || user.username || 'Anonymous'}</span>
          {user.score !== null && user.score >= 0.9 && (
            <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          )}
        </div>
        <div className="text-sm text-zinc-400 truncate">@{user.username || 'unknown'}</div>
        {user.bio && (
          <div className="text-sm text-zinc-300 mt-1 line-clamp-2">{user.bio}</div>
        )}
        {user.categories && user.categories.length > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {user.categories.map(catId => {
              const cat = getCategoryDisplay(catId);
              return cat ? (
                <span key={catId} className="text-xs bg-zinc-800 px-2 py-1 rounded">
                  {cat.emoji} {cat.name}
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
      <button className="text-violet-400 hover:text-violet-300 flex-shrink-0">
        <User className="w-5 h-5" />
      </button>
    </div>
  );
}
