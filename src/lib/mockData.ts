// Mock data for static Tribe app

export interface Category {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

export interface MockUser {
  fid: number;
  username: string;
  displayName: string;
  pfp: string;
  bio: string;
  categories: string[];
  followers: number;
  quotient: number;
}

export interface MockBounty {
  id: number;
  poster: MockUser;
  castText: string;
  rewardPerReply: number;
  maxBudget: number;
  spent: number;
  repliesCount: number;
  status: 'active' | 'paused' | 'exhausted';
  timeAgo: string;
}

export interface MockReferral {
  rank: number;
  username: string;
  displayName: string;
  referrals: number;
  pfp: string;
}

export interface TasksCompleted {
  connected: boolean;
  followed: boolean;
  likedRecasted: boolean;
}

export interface Transaction {
  id: number;
  type: 'earned' | 'claimed' | 'rejected';
  amount: number;
  from?: string;
  time: string;
  status: 'approved' | 'rejected' | 'claimed';
  reason?: string;
}

export const categories: Category[] = [
  { id: 'builder', name: 'Builder', emoji: '🛠️', count: 342 },
  { id: 'artist', name: 'Artist', emoji: '🎨', count: 156 },
  { id: 'degen', name: 'Degen', emoji: '🎰', count: 891 },
  { id: 'founder', name: 'Founder', emoji: '🚀', count: 234 },
  { id: 'dev', name: 'Dev', emoji: '👨‍💻', count: 567 },
  { id: 'creator', name: 'Creator', emoji: '✨', count: 423 },
  { id: 'trader', name: 'Trader', emoji: '📈', count: 312 },
  { id: 'shitposter', name: 'Shitposter', emoji: '💩', count: 1243 },
  { id: 'analyst', name: 'Analyst', emoji: '🔍', count: 189 },
  { id: 'writer', name: 'Writer', emoji: '✍️', count: 267 },
];

export const mockUsers: MockUser[] = [
  {
    fid: 1,
    username: 'vitalik.eth',
    displayName: 'Vitalik Buterin',
    pfp: 'https://i.pravatar.cc/100?img=1',
    bio: 'Building the future of Ethereum',
    categories: ['founder', 'dev'],
    followers: 892100,
    quotient: 0.95
  },
  {
    fid: 2,
    username: 'jessepollak',
    displayName: 'Jesse Pollak',
    pfp: 'https://i.pravatar.cc/100?img=2',
    bio: 'Building @base. Onchain is the next online.',
    categories: ['builder', 'founder'],
    followers: 234500,
    quotient: 0.92
  },
  {
    fid: 3,
    username: 'dwr.eth',
    displayName: 'Dan Romero',
    pfp: 'https://i.pravatar.cc/100?img=3',
    bio: 'Building Farcaster',
    categories: ['founder', 'builder'],
    followers: 178900,
    quotient: 0.91
  },
  {
    fid: 4,
    username: 'cryptoartist',
    displayName: 'Sarah Chen',
    pfp: 'https://i.pravatar.cc/100?img=4',
    bio: 'Digital artist exploring the onchain frontier',
    categories: ['artist', 'creator'],
    followers: 45600,
    quotient: 0.78
  },
  {
    fid: 5,
    username: 'degentrader',
    displayName: 'Ape McApeFace',
    pfp: 'https://i.pravatar.cc/100?img=5',
    bio: 'Aping into everything. NFA.',
    categories: ['degen', 'trader'],
    followers: 23400,
    quotient: 0.65
  },
];

export const mockBounties: MockBounty[] = [
  {
    id: 1,
    poster: mockUsers[1],
    castText: "Just shipped a major update to Base. What features would you love to see next? 🔵",
    rewardPerReply: 0.05,
    maxBudget: 2.50,
    spent: 1.25,
    repliesCount: 25,
    status: 'active',
    timeAgo: '2h ago'
  },
  {
    id: 2,
    poster: mockUsers[2],
    castText: "What's the one thing that would make you use Farcaster more?",
    rewardPerReply: 0.03,
    maxBudget: 1.50,
    spent: 0.45,
    repliesCount: 15,
    status: 'active',
    timeAgo: '4h ago'
  },
  {
    id: 3,
    poster: mockUsers[0],
    castText: "Thoughts on account abstraction and its impact on UX? Let's discuss.",
    rewardPerReply: 0.10,
    maxBudget: 5.00,
    spent: 2.30,
    repliesCount: 23,
    status: 'active',
    timeAgo: '6h ago'
  },
  {
    id: 4,
    poster: mockUsers[3],
    castText: "Should NFT artists focus more on utility or pure aesthetics? Curious to hear different perspectives.",
    rewardPerReply: 0.02,
    maxBudget: 1.00,
    spent: 0.86,
    repliesCount: 43,
    status: 'active',
    timeAgo: '1d ago'
  },
];

export const mockReferrals: MockReferral[] = [
  { rank: 1, username: 'whale.eth', displayName: 'Whale', referrals: 234, pfp: 'https://i.pravatar.cc/100?img=10' },
  { rank: 2, username: 'builder123', displayName: 'The Builder', referrals: 189, pfp: 'https://i.pravatar.cc/100?img=11' },
  { rank: 3, username: 'fcaster', displayName: 'FC Native', referrals: 156, pfp: 'https://i.pravatar.cc/100?img=12' },
  { rank: 4, username: 'degen.degen', displayName: 'Super Degen', referrals: 134, pfp: 'https://i.pravatar.cc/100?img=13' },
  { rank: 5, username: 'cryptomom', displayName: 'Crypto Mom', referrals: 98, pfp: 'https://i.pravatar.cc/100?img=14' },
];

export const mockTransactions: Transaction[] = [
  { id: 1, type: 'earned', amount: 0.03, from: '@jessepollak', time: '2h ago', status: 'approved' },
  { id: 2, type: 'earned', amount: 0.025, from: '@dwr.eth', time: '4h ago', status: 'approved' },
  { id: 3, type: 'rejected', amount: 0.02, from: '@vitalik.eth', time: '5h ago', status: 'rejected', reason: 'Too short' },
  { id: 4, type: 'claimed', amount: 15.00, time: '1d ago', status: 'claimed' },
  { id: 5, type: 'earned', amount: 0.02, from: '@cryptoartist', time: '1d ago', status: 'approved' },
];

// Helper to get category by ID
export function getCategoryById(id: string): Category | undefined {
  return categories.find(c => c.id === id);
}
