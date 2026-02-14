import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), '.data', 'store.json');

const defaultData = {
  users: {
    demo: {
      id: 'demo',
      liked: [],
      disliked: [],
      savedSeeds: [],
      seenSeeds: [],
      skipCount: 0,
      playSeconds: 0,
      sessions: 1,
      chaosMode: false,
    },
  },
  games: {},
  feed: [],
  comments: {},
  engagements: {},
  memes: {},
  recentGameFingerprints: [],
  recentMemeItems: [],
};

function ensureFile() {
  if (!fs.existsSync(path.dirname(DATA_PATH))) fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2));
}

export function readStore() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

export function writeStore(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export function withStore(mutator) {
  const data = readStore();
  const result = mutator(data);
  writeStore(data);
  return result;
}

export function getUser(data, userId = 'demo') {
  if (!data.users[userId]) data.users[userId] = { ...defaultData.users.demo, id: userId };
  return data.users[userId];
}
