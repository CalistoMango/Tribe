"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { UserCard } from "~/components/ui/UserCard";
import { useCategories } from "~/hooks/useCategories";
import { useDiscoverUsers, useCategoryCounts } from "~/hooks/useDiscoverUsers";

export function DiscoverTab() {
  const { categories, isLoading: categoriesLoading } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { users, isLoading: usersLoading } = useDiscoverUsers(selectedCategory, searchQuery);
  const { counts } = useCategoryCounts(categories.map(c => c.id));

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username or bio..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-sm text-zinc-400 mb-3 font-medium">Browse by category</h3>
        {categoriesLoading ? (
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-zinc-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {cat.emoji} {cat.display_name}
                <span className="ml-1 text-zinc-500 text-xs">{counts[cat.id] ?? 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User List */}
      <div>
        <h3 className="text-sm text-zinc-400 mb-3 font-medium">
          {selectedCategory
            ? `${categories.find(c => c.id === selectedCategory)?.display_name}s`
            : 'Featured users'}
        </h3>
        <div className="space-y-3">
          {usersLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl p-4 flex gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse mb-2" />
                  <div className="h-3 w-full bg-zinc-800 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="bg-zinc-900 rounded-xl p-8 text-center text-zinc-500">
              {searchQuery
                ? 'No users found matching your search'
                : selectedCategory
                  ? 'No users in this category yet'
                  : 'No discoverable users yet'}
            </div>
          ) : (
            users.map(user => (
              <UserCard key={user.fid} user={user} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
