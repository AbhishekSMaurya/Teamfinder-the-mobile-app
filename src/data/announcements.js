export const announcements = [
  {
    id: '1',
    title: 'Hackathon Team Needed!',
    description: 'Seeking React/Node developers for MLH Hackathon (Productivity App). Join Liam Chen\'s team!',
    tags: ['#React', '#Node.js', '#MLH', '#WebDev'],
    timeAgo: '31 ago',
    hasAttachment: true,
    postedBy: 'Liam Chen',
    avatarInitials: 'LC',
  },
  {
    id: '2',
    title: 'Project Alpha: UX Designer Wanted',
    description: 'Looking for a skilled UX Researcher for startup project focused on sustainable tech.',
    tags: ['#UXResearch', '#UI', '#Figma', '#Sustainable'],
    timeAgo: '9h ago',
    hasAttachment: true,
    postedBy: 'Sarah Kim',
    avatarInitials: 'SK',
  },
  {
    id: '3',
    title: 'Data Science Study Group',
    description: 'Join Sarah Kim\'s group studying Python, ML, and Data Visualization for upcoming projects.',
    tags: ['#DataScience', '#Python', '#ML', '#StudyGroup'],
    timeAgo: '16 ago',
    hasAttachment: true,
    postedBy: 'Sarah Kim',
    avatarInitials: 'SK',
  },
  {
    id: '4',
    title: 'Climate Action Hack: App Devs',
    description: 'Building an app for environmental impact. Need mobile developers passionate about climate!',
    tags: ['#Flutter', '#Firebase', '#Climate', '#Hackathon'],
    timeAgo: '1d ago',
    hasAttachment: false,
    postedBy: 'Alex Rivera',
    avatarInitials: 'AR',
  },
];

export const feedItems = [
  {
    id: '1',
    type: 'group_join',
    user: { name: 'You', avatarInitials: 'ME' },
    action: 'Joined a group:',
    target: 'AI Ethicists',
    timeAgo: '2h ago',
  },
  {
    id: '2',
    type: 'article_share',
    user: { name: 'Sarah Kim', avatarInitials: 'SK' },
    action: 'shared an article:',
    target: '"The Future of Remote Collaboration"',
    link: 'https://source.com/article-al-...',
    image: null,
    timeAgo: '3h ago',
  },
  {
    id: '3',
    type: 'project_update',
    user: { name: 'Liam Chen', avatarInitials: 'LC' },
    action: 'is now on Project Alpha',
    timeAgo: '5h ago',
  },
];

export const projects = [
  {
    id: '1',
    name: 'Project Beta: IoT Sensor Network',
    progress: 45,
    teamCount: 4,
    status: 'active',
    tags: ['#IoT', '#Hardware', '#Python'],
  },
  {
    id: '2',
    name: 'Project Gamma: Open Data API',
    progress: 90,
    teamCount: 2,
    status: 'active',
    tags: ['#API', '#OpenData', '#Node'],
  },
  {
    id: '3',
    name: 'Project Alpha: Sustainable Tech',
    progress: 60,
    teamCount: 5,
    status: 'open',
    tags: ['#Sustainable', '#Mobile', '#Figma'],
  },
];

export const posts = [
  {
    id: '1',
    author: { name: 'Sarah Kim', avatarInitials: 'SK' },
    content: 'Sharing insights on React performance. Text preview insights on React and generalization needs to try more...',
    tags: ['#React', '#ML', '#WebDev'],
    likes: 15,
    comments: 3,
    timeAgo: '2h ago',
    type: 'article',
  },
  {
    id: '2',
    author: { name: 'Dev Community', avatarInitials: 'DC' },
    content: 'Anyone free for a quick code review? Anyone free for a quick code review?',
    tags: ['#Flutter', '#Firebase', '#AI'],
    likes: 1,
    comments: 3,
    timeAgo: '4h ago',
    type: 'question',
  },
  {
    id: '3',
    author: { name: 'Liam Chen', avatarInitials: 'LC' },
    content: 'Just wrapped up the new onboarding flow for Project Alpha. Huge shoutout to the design team!',
    tags: ['#UI', '#Design', '#Teamwork'],
    likes: 24,
    comments: 7,
    timeAgo: '1d ago',
    type: 'update',
  },
];

export const messages = [
  {
    id: '1',
    sender: { name: 'Sarah Kim', avatarInitials: 'SK' },
    preview: 'Preview text or las of comenicatos more in sho...',
    timeAgo: '15m ago',
    unread: 2,
    type: 'direct',
  },
  {
    id: '2',
    sender: { name: 'Project Alpha Team', avatarInitials: 'PA', isGroup: true },
    preview: 'Preview text or and groups alpha Team, reolo...',
    timeAgo: '45m ago',
    unread: 5,
    type: 'group',
  },
  {
    id: '3',
    sender: { name: 'Liam Chen', avatarInitials: 'LC' },
    preview: 'Liam Chen care for your developers to shor hair\'s...',
    timeAgo: '1h ago',
    unread: 0,
    type: 'direct',
  },
];

export const exploreGroups = [
  {
    id: '1',
    name: 'VR Development Lab',
    description: 'VR Development Lab is evelection pnnscription, meeting, technology, and communicarsinty of desters, and members.',
    memberCount: 33,
    tags: ['#VR', '#Unity', '#3D'],
  },
  {
    id: '2',
    name: 'AI Ethicists',
    description: 'A space for discussing the ethical implications of AI in society and tech.',
    memberCount: 78,
    tags: ['#AI', '#Ethics', '#Policy'],
  },
];

export const exploreSkills = ['#Golang', '#Cybersecurity', '#ProductDesign', '#Converannion', '#ReactNative', '#Figma'];

export const exploreTopics = ['#RemoteWorkHubs', '#BlockchainScale', '#OpenSourceAI', '#MobileFirst'];
