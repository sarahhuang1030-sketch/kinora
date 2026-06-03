'use client';

import { useMemo, useState } from 'react';

type Film = {
  title: string;
  year: string;
  genre: string;
  rating: string;
  image: string;
  // colors: [string, string, string];
  progress: number;
  isNew: boolean;
};

// hero slides
const heroSlides = [
  {
    title: <>Minions &<br /> <em>Monsters</em></>,
    desc: "The Minions become Hollywood stars, accidentally unleash monsters on the world, and must team up to save the planet from the chaos they created.",
  },
  {
    title: <>The<br /><em>Backrooms</em></>,
    desc: "A strange doorway appears in the basement of a furniture showroom.",
  },
  {
    title: <>Star Wars<br /><em>The Mandalorian and Grogu</em></>,
    desc: "The evil Empire has fallen, and Imperial warlords remain scattered throughout the galaxy. As the fledgling New Republic works to protect everything the Rebellion fought for, they have enlisted the help of legendary Mandalorian bounty hunter Din Djarin (Pedro Pascal) and his young apprentice Grogu. Directed by Jon Favreau, “The Mandalorian and Grogu” also stars Sigourney Weaver and is produced by Jon Favreau, Kathleen Kennedy, Dave Filoni, and Ian Bryce, with music composed by Ludwig Göransson.",
  },
];

//options for the mood and genre filters, as well as the modal choices
const moods = ['All', '🔥 Intense', '🌙 Melancholic', '✨ Euphoric', '💫 Romantic', '🌿 Tranquil', '👁 Unsettling', '🏆 Nostalgic'];
const genres = ['All', 'Drama', 'Sci-Fi', 'Thriller', 'Horror', 'Romance', 'Noir', 'Fantasy', '1970s', '1980s', '1990s', '2000s'];
const modalMoods = ['🌙 Melancholic', '🔥 Intense', '✨ Euphoric', '🌿 Tranquil', '👁 Unsettling', '💫 Romantic'];
const modalGenres = ['Drama', 'Sci-Fi', 'Noir', 'Horror', 'Romance', 'Thriller', 'Fantasy', 'Action', 'Comedy'];


//watch list options
const films: Film[] = [
  { title: 'Hollow Ground', year: '2023', genre: 'Thriller', rating: '8.4', colors: ['#1a0400', '#3c0c00', '#0f0300'], progress: 0.65, isNew: true },
  { title: 'Neon Requiem', year: '2022', genre: 'Drama', rating: '9.1', colors: ['#060618', '#14144a', '#06060f'], progress: 0.3, isNew: false },
  { title: 'The Last Signal', year: '2024', genre: 'Sci-Fi', rating: '8.7', colors: ['#001808', '#003c18', '#000f04'], progress: 0.8, isNew: true },
  { title: 'Crimson Shore', year: '2021', genre: 'Horror', rating: '7.9', colors: ['#180004', '#3c000c', '#0a0002'], progress: 0.45, isNew: false },
  { title: 'Desert Hour', year: '2023', genre: 'Drama', rating: '8.2', colors: ['#181000', '#3a2c00', '#100c00'], progress: 0.1, isNew: false },
  { title: 'Blue Meridian', year: '2024', genre: 'Sci-Fi', rating: '9.0', colors: ['#001018', '#00283c', '#000810'], progress: 0.55, isNew: true },
  { title: 'Pale Archive', year: '2022', genre: 'Thriller', rating: '8.5', colors: ['#0c0020', '#200050', '#080015'], progress: 0.9, isNew: false },
  { title: 'Woven Dark', year: '2024', genre: 'Horror', rating: '8.1', colors: ['#080018', '#140038', '#040010'], progress: 0.2, isNew: true },
];


function Art({ colors }: { colors: [string, string, string] }) {
  return <div className="art" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})` }} />;
}

//style for each movie card, with the poster art, title, genre/year meta, and rating/new badge for the poster cards, and progress/play overlay for the wide cards
function PosterCard({ film }: { film: Film }) {
  return (
    <article className="pcard">
      <div className="pcard-thumb">
        <Art colors={film.colors} />
        <div className="pcard-shine" />
        <div className="pcard-bottom">
          <span className="pcard-stars">★ {film.rating}</span>
          {film.isNew && <span className="pcard-new">NEW</span>}
        </div>
      </div>
      <p className="pcard-title">{film.title}</p>
      <p className="pcard-meta">{film.genre} · {film.year}</p>
    </article>
  );
}

//this is for the watch list cards
function WideCard({ film }: { film: Film }) {
  const pct = Math.round(film.progress * 100);
  return (
    <article className="wcard">
      <div className="wcard-thumb">
        <Art colors={film.colors} />
        <div className="wcard-overlay" />
        <div className="wcard-play">▶</div>
        <div className="wcard-progress"><div className="wcard-progress-fill" style={{ width: `${pct}%` }} /></div>
      </div>
      <p className="wcard-title">{film.title}</p>
      <p className="wcard-meta">{film.genre} · {pct}% watched</p>
    </article>
  );
}


function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="content-section">
      <div className="row-header"><h2 className="row-title">{title}</h2><span className="row-see-all">See all</span></div>
      <div className="cards-scroll">{children}</div>
    </section>
  );
}

export default function Home() {
  const [activeHero, setActiveHero] = useState(0);
  const slide = heroSlides[activeHero];
  const [activeMood, setActiveMood] = useState('All');
  const [activeGenre, setActiveGenre] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState('🌙 Melancholic');
  const [era, setEra] = useState('1970s');
  const [duration, setDuration] = useState('Feature film');
  const [selectedGenres, setSelectedGenres] = useState(['Drama', 'Noir']);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  const recommended = useMemo(() => films.slice().reverse(), []);

  function openModal() {
    setModalOpen(true);
    setStep(1);
    setGenerated(false);
    setGenerating(false);
  }

  function toggleGenre(genre: string) {
    setSelectedGenres((current) => {
      if (current.includes(genre)) return current.filter((item) => item !== genre);
      if (current.length >= 3) return current;
      return [...current, genre];
    });
  }

  function generateFilm() {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1800);
  }

  return (
    <>
      <nav>
        <div className="logo">CINE<span>forge</span></div>
        <div className="nav-links"><a className="active">Home</a><a>My List</a><a>New & Hot</a><a>Browse</a><a>My Films</a></div>
        <div className="nav-right"><button className="nav-icon-btn">⌕</button><button className="nav-icon-btn">🔔</button><div className="nav-avatar">S</div></div>
      </nav>

      <header className="hero">
  <div className="hero-bg" />

  <div className="hero-poster-area">
    <div className={`hero-slide hero-slide-${activeHero}`}>
      <div className="hero-poster-circle" />
    </div>
    <div className="hero-poster-gradient" />
  </div>

  <div className="hero-content">
    <div className="hero-badge">★ Made for you</div>

    <h1 className="hero-title">{slide.title}</h1>

    <div className="hero-meta">
      <span className="hero-match">97% Match</span>
      <span>2024</span>
      <span className="hero-cert">R</span>
      <span>2h 18m</span>
      <span>Noir · Drama</span>
    </div>

    <p className="hero-desc">{slide.desc}</p>

    <div className="hero-actions">
      <button className="btn-play">▶ Play</button>
      <button className="btn-info">ⓘ More Info</button>
    </div>
  </div>

  <button
    className="hero-arrow hero-arrow-left"
    onClick={() => setActiveHero(activeHero === 0 ? heroSlides.length - 1 : activeHero - 1)}
  >
    ‹
  </button>

  <button
    className="hero-arrow hero-arrow-right"
    onClick={() => setActiveHero(activeHero === heroSlides.length - 1 ? 0 : activeHero + 1)}
  >
    ›
  </button>

  <div className="hero-dots">
    {heroSlides.map((_, index) => (
      <button
        key={index}
        className={`hero-dot-btn ${activeHero === index ? "active" : ""}`}
        onClick={() => setActiveHero(index)}
      />
    ))}
  </div>
</header>

      <main>
        <button className="personalize-strip" onClick={openModal}>
          <div className="ps-left"><div className="ps-icon">🎬</div><div><p className="ps-title">Create your personalized film</p><p className="ps-sub">Choose your mood, era, genre & duration.</p></div></div>
          <span className="btn-create">Start Creating →</span>
        </button>

        <section className="mood-section"><p className="mood-label">Filter by mood</p><div className="mood-chips">{moods.map((mood) => <button key={mood} className={`mood-chip ${activeMood === mood ? 'active' : ''}`} onClick={() => setActiveMood(mood)}>{mood}</button>)}</div></section>
        <section className="genre-tabs">{genres.map((genre) => <button key={genre} className={`gtab ${activeGenre === genre ? 'active' : ''}`} onClick={() => setActiveGenre(genre)}>{genre}</button>)}</section>

        <Row title="Watch List">{films.slice(0, 5).map((film) => <WideCard key={film.title} film={film} />)}</Row>
        <Row title="Recommended for you">{recommended.map((film) => <PosterCard key={film.title} film={film} />)}</Row>
        <Row title="Trending this week">{films.map((film) => <PosterCard key={film.title} film={film} />)}</Row>
      </main>

      <footer><div className="logo footer-logo">CINE<span>forge</span></div><span>© 2026 Cineforge</span></footer>

      {modalOpen && (
        <div className="modal-backdrop open" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><h2 className="modal-title">Create your <span>film</span></h2><p className="modal-subtitle">4 steps to your personalized cinematic experience</p></div><button className="modal-close" onClick={() => setModalOpen(false)}>✕</button></div>
            <div className="step-labels"><span className={step === 1 ? 'active' : ''}>Mood</span><span className={step === 2 ? 'active' : ''}>Era & Length</span><span className={step === 3 ? 'active' : ''}>Genre</span><span className={step === 4 ? 'active' : ''}>Generate</span></div>
            <div className="modal-body">
              {step === 1 && <div className="modal-grid">{modalMoods.map((mood) => <button key={mood} className={`choice ${selectedMood === mood ? 'active' : ''}`} onClick={() => setSelectedMood(mood)}>{mood}</button>)}</div>}
              {step === 2 && <div className="modal-grid"><button className="choice active" onClick={() => setEra('1970s')}>1970s</button><button className="choice" onClick={() => setEra('1980s')}>1980s</button><button className="choice" onClick={() => setEra('1990s')}>1990s</button><button className="choice" onClick={() => setDuration('Short film')}>Short film</button><button className="choice active" onClick={() => setDuration('Feature film')}>Feature film</button><button className="choice" onClick={() => setDuration('Mini-series')}>Mini-series</button></div>}
              {step === 3 && <div className="pill-group">{modalGenres.map((genre) => <button key={genre} className={`mpill ${selectedGenres.includes(genre) ? 'active' : ''}`} onClick={() => toggleGenre(genre)}>{genre}</button>)}</div>}
              {step === 4 && <><div className="summary-bar">{[selectedMood, era, duration, ...selectedGenres].map((item) => <span className="summary-tag" key={item}>{item}</span>)}</div>{generating && <div className="generating active"><div className="gen-spinner" /><p>Crafting your film...</p></div>}{generated && <div className="result-card"><div className="result-art"><div className="result-orb" /></div><div className="result-info"><h3>The Hollow Between Hours</h3><p>A rain-slicked noir mystery made from your selections.</p><button className="btn-watch">▶ Watch Now</button></div></div>}</>}
            </div>
            <div className="modal-footer"><button className="btn-back" disabled={step === 1} onClick={() => setStep(step - 1)}>← Back</button><button className="btn-next" onClick={() => step < 4 ? setStep(step + 1) : generateFilm()}>{step < 4 ? 'Continue →' : '✨ Generate Film'}</button></div>
          </div>
        </div>
      )}
    </>
  );
}
