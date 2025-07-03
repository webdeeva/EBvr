const adjectives = [
  'Swift', 'Bright', 'Cosmic', 'Digital', 'Stellar', 'Quantum', 'Crystal', 
  'Neon', 'Cyber', 'Electric', 'Mystic', 'Radiant', 'Dynamic', 'Astral',
  'Vivid', 'Prism', 'Aurora', 'Echo', 'Phoenix', 'Storm'
];

const nouns = [
  'Explorer', 'Pioneer', 'Voyager', 'Builder', 'Creator', 'Architect',
  'Guardian', 'Navigator', 'Wanderer', 'Dreamer', 'Sage', 'Seeker',
  'Artist', 'Innovator', 'Visionary', 'Traveler', 'Designer', 'Engineer',
  'Adventurer', 'Pathfinder'
];

export const generateRandomName = (): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}${noun}${number}`;
};

export const getStoredUserName = (): string => {
  const stored = localStorage.getItem('eb-username');
  if (stored) return stored;
  
  const newName = generateRandomName();
  localStorage.setItem('eb-username', newName);
  return newName;
};