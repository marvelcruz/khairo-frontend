import type { HomepageVideoConfig } from "@/config/homepage";

export function HeroVideo({ video }: { video: HomepageVideoConfig }) {
  const desktop = video.desktop || video.bgVideoUrl;
  const hasVideo = Boolean(desktop || video.tablet || video.mobile);
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {hasVideo ? (
        <video autoPlay muted loop playsInline preload="metadata" poster={video.poster || undefined} className="h-full w-full object-cover">
          {video.mobile ? <source media="(max-width: 639px)" src={video.mobile} /> : null}
          {video.tablet ? <source media="(min-width: 640px) and (max-width: 1023px)" src={video.tablet} /> : null}
          {desktop ? <source src={desktop} /> : null}
        </video>
      ) : (
        <div className="h-full w-full" style={{ background: "radial-gradient(circle at 74% 30%, rgba(212,176,106,.22), transparent 28%), radial-gradient(circle at 18% 74%, rgba(62,111,91,.28), transparent 32%), linear-gradient(135deg, #07110e 0%, #10251d 52%, #07110e 100%)" }} />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,14,.9)_0%,rgba(7,17,14,.58)_48%,rgba(7,17,14,.25)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,14,.15)_0%,rgba(7,17,14,.08)_55%,rgba(7,17,14,.92)_100%)]" />
    </div>
  );
}
