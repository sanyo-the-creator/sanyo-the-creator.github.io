export interface FeatureItem {
  slug: string;
  icon: string;
  title: string;
  description: string;
  details: string[];
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  screenshot: string;
  highlights: string[];
}

export const featuresList: FeatureItem[] = [
  {
    slug: 'quests-sidequests',
    icon: '🗡️',
    title: 'Quests & Sidequests',
    description: 'Turn habits into main quests and sidequests with XP, streaks, and meaningful rewards.',
    details: [
      'Create main quests and sidequests for flexible progress',
      'Daily/weekly/monthly cadence with streak protection',
      'Category XP: Money, Strength, Health, Knowledge',
      'Difficulty tiers and reward multipliers'
    ]
  },
  {
    slug: 'groups',
    icon: '👥',
    title: 'Groups',
    description: 'Stay accountable with friends, leaderboards, and community challenges.',
    details: [
      'Private and public groups',
      'Group challenges and shared quests',
      'Leaderboards and progress snapshots'
    ]
  },
  {
    slug: 'goals-journal',
    icon: '📝',
    title: 'Goals with Journal',
    description: 'Long-term goals with milestones, notes, and photo journaling.',
    details: [
      'Break goals into milestones',
      'Write your plan in journal and track progress',
      'Deadline reminders and reflections'
    ]
  },
  {
    slug: 'time-tracker',
    icon: '⏱️',
    title: 'Time Tracker',
    description: 'Track deep work, sessions, and screen time with insightful analytics.',
    details: [
      'Pomodoro and custom session lengths',
      'Automatic activity tagging',
      'Daily/weekly time reports'
    ]
  },
  // {
  //   slug: 'app-blocker',
  //   icon: '🚫',
  //   title: 'App Blocker',
  //   description: 'Intelligent blocker to remove temptations and keep you focused, inspired by robust content-blocking approaches.',
  //   details: [
  //     'Real-time detection of distracting content',
  //     'Covers common loopholes and workarounds',
  //     'Session locks tied to focus goals'
  //   ]
  // },
  {
    slug: 'profile',
    icon: '👤',
    title: 'Profile',
    description: 'Personal identity, public profile, and social presence.',
    details: [
      'Profile card, avatar, and bio',
      'Public sharing and privacy controls',
      'Highlights and pinned achievements'
    ]
  },
  {
    slug: 'xp-progress-badges',
    icon: '🏅',
    title: 'XP, Progress & Badges',
    description: 'Level up across categories, earn badges, and visualize progress with rich analytics.',
    details: [
      'Category XP and global level',
      'Badge collections and title tiers',
      'Progress charts and heatmaps'
    ]
  }
];

