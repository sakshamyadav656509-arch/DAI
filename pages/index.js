import { useEffect, useMemo, useState } from 'react';
import GameEngine from '../components/GameEngine';

const navItems = ['Home', 'Trending', 'Chaos Mode', 'My Seeds', 'Liked Games'];

function FeedCard({ item, onEngage }) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (item.type !== 'game') return;
    fetch(`/api/comments?seed=${item.game.seed}`).then((r) => r.json()).then((d) => setComments(d.items || []));
  }, [item]);

  if (item.type === 'meme') {
    return (
      <div className="feed-item animate-fadeIn border border-zinc-700 rounded-xl p-6 bg-zinc-900 min-h-[35vh] flex items-center justify-center text-xl text-center">
        {item.meme.text}
      </div>
    );
  }

  const seed = item.game.seed;
  const postComment = async () => {
    if (!commentText.trim()) return;
    const res = await fetch(`/api/comments?seed=${seed}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: commentText }),
    });
    const created = await res.json();
    setComments((c) => [created, ...c]);
    setCommentText('');
  };

  return (
    <div className="feed-item animate-fadeIn border border-zinc-700 rounded-xl p-3 md:p-4 bg-zinc-900 md:min-h-0 min-h-[100vh]">
      {item.remix && <div className="text-amber-300 text-xs mb-2">Remixing unique variant…</div>}
      <GameEngine config={item.game} onPlayTick={(s) => onEngage(seed, 'play', s)} />
      <h3 className="font-semibold mt-2">{item.game.title}</h3>
      <div className="text-xs text-zinc-400">@ai-channel · GameType: {item.game.gameType} · Seed: {seed}</div>
      <div className="text-xs text-zinc-500 mt-1">Views: {Math.floor((Date.now() / 1000) % 90000) + 1000}</div>

      <div className="flex gap-2 text-sm mt-3 flex-wrap">
        <button onClick={() => onEngage(seed, 'like')} className="px-2 py-1 rounded bg-zinc-800">Like</button>
        <button onClick={() => onEngage(seed, 'dislike')} className="px-2 py-1 rounded bg-zinc-800">Dislike</button>
        <button onClick={() => onEngage(seed, 'save')} className="px-2 py-1 rounded bg-zinc-800">Save</button>
        <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}?seed=${seed}`)} className="px-2 py-1 rounded bg-zinc-800">Share</button>
      </div>

      <div className="mt-3">
        <div className="text-sm mb-1">Comments</div>
        <div className="flex gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="bg-zinc-800 rounded px-2 py-1 w-full"
            placeholder="Say something"
          />
          <button onClick={postComment} className="bg-red-600 px-3 rounded">Post</button>
        </div>
        <div className="mt-2 space-y-1 text-xs text-zinc-300 max-h-24 overflow-auto">
          {comments.map((c) => <div key={c.id}>{c.user}: {c.text}</div>)}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [activeNav, setActiveNav] = useState('Home');
  const [uploadPrompt, setUploadPrompt] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [user, setUser] = useState({ liked: [], savedSeeds: [] });
  const [trending, setTrending] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);

  const refreshUser = async () => {
    const d = await fetch('/api/user').then((r) => r.json());
    setUser(d.user);
    setTrending(d.trending || []);
  };

  const load = async (nextCursor = 0, replace = false) => {
    const res = await fetch(`/api/stream?cursor=${nextCursor}&count=9`);
    const data = await res.json();
    setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
    setCursor(data.nextCursor);
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const deepSeed = url.searchParams.get('seed');
    if (deepSeed) {
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ seed: deepSeed }),
      })
        .then((r) => r.json())
        .then((d) => setItems([{ type: 'game', id: d.game.seed, game: d.game, remix: d.remix }]));
    } else {
      load(0, true);
    }
    refreshUser();
  }, [activeNav]);

  const onEngage = async (seed, action, playSeconds = 0) => {
    await fetch('/api/engage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ seed, action, playSeconds }),
    });
    if (action !== 'play') refreshUser();
  };

  const onCustomGenerate = async () => {
    const seed = `${Date.now()}-${uploadPrompt.slice(0, 10).replace(/\s+/g, '-')}`;
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ seed, prompt: uploadPrompt }),
    });
    const d = await res.json();
    if (d?.game) setItems((prev) => [{ type: 'game', id: d.game.seed, game: d.game, remix: d.remix }, ...prev]);
    setUploadPrompt('');
    setShowPromptModal(false);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let data = items;

    if (activeNav === 'Trending') data = items.filter((i) => i.type !== 'game' || trending.includes(i.game.seed));
    if (activeNav === 'My Seeds') data = items.filter((i) => i.type !== 'game' || user.savedSeeds?.includes(i.game.seed));
    if (activeNav === 'Liked Games') data = items.filter((i) => i.type !== 'game' || user.liked?.includes(i.game.seed));

    if (!q) return data;
    return data.filter((i) => {
      if (i.type === 'meme') return i.meme.text.toLowerCase().includes(q);
      return i.game.gameType.includes(q) || i.game.seed.includes(q) || i.game.title.toLowerCase().includes(q);
    });
  }, [items, query, activeNav, user, trending]);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:block w-56 border-r border-zinc-800 p-4 sticky top-0 h-screen">
        {navItems.map((n) => (
          <button
            key={n}
            className={`block w-full text-left px-3 py-2 rounded mb-1 ${n === activeNav ? 'bg-zinc-700' : 'bg-transparent'}`}
            onClick={() => {
              setActiveNav(n);
              if (n === 'Chaos Mode') onEngage(null, 'toggleChaos');
            }}
          >
            {n}
          </button>
        ))}
      </aside>

      <main className="flex-1 pb-20">
        <header className="sticky top-0 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 p-3 z-10">
          <div className="max-w-3xl mx-auto flex gap-2 items-center">
            <div className="font-bold text-red-500">DoomScroll AI</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gameType / difficulty / seed"
              className="flex-1 bg-zinc-900 rounded px-3 py-1"
            />
            <button onClick={() => setShowPromptModal(true)} className="bg-zinc-800 px-3 py-1 rounded">Upload/Prompt</button>
            <button onClick={onCustomGenerate} className="bg-red-600 px-3 py-1 rounded">Generate</button>
            <div className="relative">
              <button className="rounded-full bg-zinc-800 px-3 py-1" onClick={() => setProfileOpen((v) => !v)}>Profile ▾</button>
              {profileOpen && (
                <div className="absolute right-0 top-9 w-56 bg-zinc-900 border border-zinc-700 rounded p-2 text-xs space-y-1">
                  <div>Liked: {user.liked?.length || 0}</div>
                  <div>Saved: {user.savedSeeds?.length || 0}</div>
                  <div>Skips: {user.skipCount || 0}</div>
                  <div>Playtime: {Math.floor((user.playSeconds || 0) / 60)} min</div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto p-2 md:p-4 space-y-3 md:space-y-4 md:max-w-[800px] feed-snap">
          {filtered.map((item) => <FeedCard key={item.id} item={item} onEngage={onEngage} />)}
          <button onClick={() => load(cursor)} className="w-full py-3 rounded bg-zinc-800">Load More</button>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 grid grid-cols-5 text-xs">
        {navItems.map((n) => (
          <button key={n} onClick={() => setActiveNav(n)} className="py-2">{n.split(' ')[0]}</button>
        ))}
      </nav>

      {showPromptModal && (
        <div className="fixed inset-0 bg-black/70 z-20 flex items-center justify-center p-3">
          <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-2">
            <div className="font-semibold">Generate from prompt</div>
            <textarea
              value={uploadPrompt}
              onChange={(e) => setUploadPrompt(e.target.value)}
              className="w-full h-28 bg-zinc-800 rounded p-2"
              placeholder="e.g. hard parkour with low gravity and neon palette"
            />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded bg-zinc-700" onClick={() => setShowPromptModal(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-red-600" onClick={onCustomGenerate}>Generate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
