"use client";

import {
  useCallback,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type GalleryPhoto = {
  id: string;
  url: string;
  is_main: boolean;
};

export type PropertyHeroConfig = {
  priceLabel: string;
  statusBadge: ReactNode;
};

type Props = {
  photos: GalleryPhoto[];
  fallbackImageUrl: string | null;
  title: string;
  hero?: PropertyHeroConfig;
};

export function PropertyGallery({
  photos,
  fallbackImageUrl,
  title,
  hero,
}: Props) {
  const ordered = useMemo(() => {
    if (photos.length === 0) return [];
    const main = photos.filter((p) => p.is_main);
    const rest = photos.filter((p) => !p.is_main);
    return [...main, ...rest];
  }, [photos]);

  const slides = useMemo(() => {
    if (ordered.length > 0)
      return ordered.map((p) => ({ key: p.id, url: p.url }));
    if (fallbackImageUrl?.trim())
      return [{ key: "fallback-image", url: fallbackImageUrl.trim() }];
    return [];
  }, [ordered, fallbackImageUrl]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const safeIndex = Math.min(
    selectedIndex,
    Math.max(0, slides.length - 1)
  );
  const mainSrc = slides[safeIndex]?.url ?? "";

  const onThumbKeyDown = useCallback(
    (index: number, e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSelectedIndex(index);
      }
    },
    []
  );

  const placeholderHero = (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1a1a24] to-[#0a0a0f]">
      <span className="text-6xl opacity-40" aria-hidden>
        🏠
      </span>
      <p className="mt-4 text-sm font-medium text-zinc-500">Aucune photo</p>
    </div>
  );

  if (hero) {
    const showImage = mainSrc.length > 0;
    return (
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a] shadow-2xl shadow-black/40 card-luxury">
        <div className="relative h-[min(60vh,720px)] min-h-[320px] w-full">
          {showImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mainSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0">{placeholderHero}</div>
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/70 to-transparent"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F]/80 via-transparent to-transparent"
            aria-hidden
          />

          <div className="absolute right-6 top-6 z-10 sm:right-8 sm:top-8">
            {hero.statusBadge}
          </div>

          <div className="absolute bottom-0 left-0 z-10 max-w-3xl p-6 sm:p-10">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-3 text-2xl font-bold tabular-nums text-white sm:text-3xl">
              {hero.priceLabel}
            </p>
          </div>
        </div>

        {slides.length > 1 ? (
          <div className="border-t border-white/[0.06] bg-[#0a0a0f]/90 px-4 py-3">
            <ul
              className="flex gap-2 overflow-x-auto pb-1 pt-0.5"
              role="list"
              aria-label="Miniatures"
            >
              {slides.map((slide, index) => {
                const selected = index === safeIndex;
                return (
                  <li key={slide.key} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      onKeyDown={(e) => onThumbKeyDown(index, e)}
                      className={`relative h-16 w-28 overflow-hidden rounded-lg border-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] ${
                        selected
                          ? "border-indigo-400 shadow-[0_0_16px_-4px_rgba(99,102,241,0.6)]"
                          : "border-transparent opacity-75 hover:border-white/20 hover:opacity-100"
                      }`}
                      aria-label={`Photo ${index + 1}`}
                      aria-current={selected ? "true" : undefined}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a]">
        <div className="flex aspect-[16/10] items-center justify-center">
          {placeholderHero}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a]">
        <div className="relative aspect-[16/10] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainSrc}
            alt={title}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {slides.length > 1 ? (
        <ul
          className="flex gap-2 overflow-x-auto pb-1 pt-0.5"
          role="list"
          aria-label="Miniatures"
        >
          {slides.map((slide, index) => {
            const selected = index === safeIndex;
            return (
              <li key={slide.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  onKeyDown={(e) => onThumbKeyDown(index, e)}
                  className={`relative h-16 w-24 overflow-hidden rounded-lg border-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    selected
                      ? "border-indigo-400 shadow-[0_0_12px_-2px_rgba(99,102,241,0.5)]"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  aria-label={`Afficher la photo ${index + 1}`}
                  aria-current={selected ? "true" : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
