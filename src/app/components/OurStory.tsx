import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import hosanyFounder from '../../img/hosany-founder-voel.jpg';
import './OurStory.css';

type StoryChapterId = '01' | '02' | '03';

type StoryChapter = {
  id: StoryChapterId;
  label: string;
  lead?: string;
  content: ReactNode;
};

const storyChapters: StoryChapter[] = [
  {
    id: '01',
    label: 'O começo',
    lead: 'Prazer, eu sou a Hosany.',
    content: (
      <>
        <p>Sempre tive o sonho de empreender.</p>
        <p>
          Trabalhando com vendas, descobri o quanto gosto de lidar com pessoas e de construir algo que pudesse chamar
          de meu.
        </p>
        <p>Durante muito tempo, as ideias existiram apenas no papel.</p>
        <p>
          <strong>Até que decidi começar.</strong>
        </p>
      </>
    ),
  },
  {
    id: '02',
    label: 'Nasce a VÖEL',
    lead: 'Este é o começo.',
    content: (
      <>
        <p>
          A VÖEL nasceu para mulheres que gostam de se vestir bem, com um estilo social moderno e leve, perfeito para o
          dia a dia sem perder a elegância.
        </p>
        <p>Uma curadoria pensada para unir presença, conforto e naturalidade.</p>
        <p className="our-story__emphasis">
          Sem excessos. Sem pressa.
          <br />
          Com atenção ao que realmente importa.
        </p>
      </>
    ),
  },
  {
    id: '03',
    label: 'Mais que uma loja',
    content: (
      <>
        <blockquote className="our-story__quote">
          “A VÖEL é mais do que uma loja para mim.
          <br />É a realização de um sonho.”
        </blockquote>
        <div className="our-story__signature" aria-label="Hosany, fundadora da VÖEL">
          <span>Hosany</span>
          <small>Fundadora da VÖEL</small>
        </div>
      </>
    ),
  },
];

const brandPillars = [
  {
    id: '01',
    title: 'Leveza',
    text: 'Peças que acompanham sua rotina com conforto e naturalidade.',
  },
  {
    id: '02',
    title: 'Essência',
    text: 'Estilo que traduz quem você é, sem precisar explicar.',
  },
  {
    id: '03',
    title: 'Estilo',
    text: 'Elegância na medida certa, para você se sentir bem em qualquer ocasião.',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface OurStoryProps {
  onViewCollection: () => void;
}

export default function OurStory({ onViewCollection }: OurStoryProps) {
  const [activeChapter, setActiveChapter] = useState<StoryChapterId>('01');
  const [visiblePillars, setVisiblePillars] = useState<string[]>([]);
  const [storyProgress, setStoryProgress] = useState(0);
  const [introProgress, setIntroProgress] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const introRef = useRef<HTMLDivElement | null>(null);
  const narrativeRef = useRef<HTMLDivElement | null>(null);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const pillarRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      entries => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length === 0) return;

        const viewportFocus = window.innerHeight * 0.52;
        const closestEntry = visibleEntries.sort((firstEntry, secondEntry) => {
          const firstCenter = firstEntry.boundingClientRect.top + firstEntry.boundingClientRect.height * 0.35;
          const secondCenter = secondEntry.boundingClientRect.top + secondEntry.boundingClientRect.height * 0.35;
          return Math.abs(firstCenter - viewportFocus) - Math.abs(secondCenter - viewportFocus);
        })[0];
        const nextChapter = (closestEntry.target as HTMLElement).dataset.chapter as StoryChapterId | undefined;

        if (nextChapter) {
          setActiveChapter(nextChapter);
        }
      },
      {
        root: null,
        rootMargin: '-34% 0px -38% 0px',
        threshold: [0, 0.18, 0.4, 0.65, 0.9],
      },
    );

    chapterRefs.current.forEach(chapter => {
      if (chapter) observer.observe(chapter);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setVisiblePillars(brandPillars.map(pillar => pillar.id));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          const nextPillar = (entry.target as HTMLElement).dataset.pillar;
          if (!nextPillar) return;

          setVisiblePillars(previous =>
            previous.includes(nextPillar) ? previous : [...previous, nextPillar],
          );
        });
      },
      {
        root: null,
        rootMargin: '-12% 0px -10% 0px',
        threshold: 0.18,
      },
    );

    pillarRefs.current.forEach(pillar => {
      if (pillar) observer.observe(pillar);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let animationFrame = 0;

    const updateProgress = () => {
      const narrative = narrativeRef.current;
      const intro = introRef.current;

      if (narrative) {
        const narrativeRect = narrative.getBoundingClientRect();
        const scrollableDistance = narrativeRect.height - window.innerHeight;
        const nextProgress =
          scrollableDistance > 0 ? clamp(-narrativeRect.top / scrollableDistance, 0, 1) : 0;

        setStoryProgress(nextProgress);
      }

      if (intro) {
        const introRect = intro.getBoundingClientRect();
        const introTravel = introRect.height + window.innerHeight;
        setIntroProgress(clamp((window.innerHeight - introRect.top) / introTravel, 0, 1));
      }
    };

    const handleScroll = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        updateProgress();
        animationFrame = 0;
      });
    };

    updateProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  const activeChapterIndex = storyChapters.findIndex(chapter => chapter.id === activeChapter);
  const storyStyle = {
    '--story-progress': `${Math.round(storyProgress * 100)}%`,
    '--story-progress-value': storyProgress.toFixed(3),
    '--founder-scale': (1 + storyProgress * 0.035).toFixed(4),
    '--intro-drift': `${Math.round(introProgress * -28)}px`,
    '--closing-drift': `${Math.round((storyProgress - 0.62) * 26)}px`,
  } as CSSProperties;

  return (
    <section
      id="nossa-historia"
      ref={sectionRef}
      className="our-story"
      aria-labelledby="our-story-title"
      style={storyStyle}
    >
      <div ref={introRef} className="our-story__intro">
        <span className="our-story__intro-mark" aria-hidden="true">
          V Ö E L
        </span>

        <div className="our-story__intro-inner">
          <p className="our-story__eyebrow">Nossa história</p>
          <h1 id="our-story-title" className="our-story__intro-title">
            <span className="our-story__title-desktop">
              Toda marca começa
              <br />
              com uma ideia.
            </span>
            <span className="our-story__title-mobile">
              Toda marca
              <br />
              começa com
              <br />
              uma ideia.
            </span>
          </h1>
          <p className="our-story__intro-note">
            <span aria-hidden="true" />
            A nossa começou com um sonho.
          </p>
        </div>
      </div>

      <div ref={narrativeRef} className="our-story__narrative">
        <div className="our-story__narrative-grid">
          <aside className="our-story__founder-sticky" aria-label="Retrato editorial da fundadora">
            <figure className="our-story__portrait">
              <div className="our-story__portrait-frame">
                <img
                  src={hosanyFounder}
                  alt="Hosany, fundadora da VÖEL"
                  className="our-story__portrait-img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="our-story__founder-caption">
                <span>Fundadora / CEO</span>
                <strong>Hosany</strong>
              </figcaption>
            </figure>
            <div className="our-story__founder-note" aria-hidden="true" />
          </aside>

          <div className="our-story__chapter-area">
            <div className="our-story__progress" aria-hidden="true">
              <span className="our-story__progress-track" />
              <span className="our-story__progress-fill" />
              {storyChapters.map((chapter, index) => (
                <span
                  key={chapter.id}
                  className={`our-story__progress-dot ${
                    index <= activeChapterIndex ? 'our-story__progress-dot--seen' : ''
                  } ${chapter.id === activeChapter ? 'our-story__progress-dot--active' : ''}`}
                  style={{ '--dot-index': index } as CSSProperties}
                />
              ))}
            </div>

            <div className="our-story__chapter-list">
              {storyChapters.map((chapter, index) => {
                const isActive = chapter.id === activeChapter;
                const isBefore = index < activeChapterIndex;

                return (
                  <article
                    key={chapter.id}
                    ref={node => {
                      chapterRefs.current[index] = node;
                    }}
                    data-chapter={chapter.id}
                    className={`our-story__chapter ${isActive ? 'our-story__chapter--active' : ''} ${
                      isBefore ? 'our-story__chapter--before' : 'our-story__chapter--after'
                    }`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <header className="our-story__chapter-header">
                      <span className="our-story__chapter-number">{chapter.id}</span>
                      <h2>{chapter.label}</h2>
                    </header>
                    <span className="our-story__chapter-rule" aria-hidden="true" />
                    {chapter.lead && <p className="our-story__chapter-lead">{chapter.lead}</p>}
                    <div className="our-story__chapter-copy">{chapter.content}</div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <section className="our-story__pillars" aria-labelledby="our-story-pillars-title">
        <h2 id="our-story-pillars-title" className="sr-only">
          Pilares da VÖEL
        </h2>
        <div className="our-story__pillar-grid">
          {brandPillars.map(pillar => (
            <article
              key={pillar.id}
              ref={node => {
                pillarRefs.current[Number(pillar.id) - 1] = node;
              }}
              data-pillar={pillar.id}
              className={`our-story__pillar ${
                visiblePillars.includes(pillar.id) ? 'our-story__pillar--visible' : ''
              }`}
            >
              <span className="our-story__pillar-number">{pillar.id}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="our-story__cta" aria-labelledby="our-story-collection-title">
        <span className="our-story__cta-mark" aria-hidden="true">
          VÖEL
        </span>
        <div className="our-story__cta-inner">
          <p>Agora que você conhece a nossa história…</p>
          <h2 id="our-story-collection-title">CONHEÇA A VÖEL.</h2>
          <button className="our-story__cta-button" type="button" onClick={onViewCollection}>
            <span>Ver coleção</span>
            <ArrowRight size={17} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </section>
    </section>
  );
}
