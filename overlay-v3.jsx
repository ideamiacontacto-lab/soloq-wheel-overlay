/* global React, ReactDOM */
const { useState, useEffect, useRef } = React;
const FM = window.Motion || window.framerMotion || window.FramerMotion || {};
const { motion, AnimatePresence } = FM;

// ------------------------------------------------------------
// TOKENS
// ------------------------------------------------------------
const YELLOW = "#F6E232";
const YELLOW_DARK = "#C9B91D";
const PANEL_TOP = "#0E0E10";
const PANEL_BOT = "#161618";
const BORDER = "#2A2A30";
const FONT_DISPLAY = "'General Sans', system-ui, sans-serif";
const FONT_BODY = "'Outfit', system-ui, sans-serif";

const SECTOR_COLORS = [
  "#5A1117",
  "#14315E",
  "#2C2438",
  "#1F3A28",
  "#4A3517",
  "#1A1A1F",
];

// ------------------------------------------------------------
// DATA
// ------------------------------------------------------------
const OPTIONS = [
  { id: "autofill-3",        label: "Autofill 3 partidas",        short: "AUTOFILL ×3",  weight: 0.22, tone: "pain",   description: "Tres partidas seguidas con el rol que te dé el matchmaking.", imageUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Teemo_0.jpg",  champName: "TEEMO" },
  { id: "rol-sup-2",         label: "Jugar SUPPORT 2 partidas",   short: "SUPPORT ×2",   weight: 0.18, tone: "pain",   description: "Dos partidas obligatorias en la línea de soporte.",            imageUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Soraka_0.jpg", champName: "SORAKA" },
  { id: "letra-k",           label: "Champ que empiece por K",    short: "CHAMP CON K",  weight: 0.15,                 description: "Tu próxima partida con un champ que empiece por K.",          imageUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Kayn_0.jpg",   champName: "KAYN" },
  { id: "champ-yuumi",       label: "Jugar Yuumi 1 partida",      short: "YUUMI",        weight: 0.10, tone: "pain",   description: "Una partida con Yuumi, sí o sí.",                               imageUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Yuumi_0.jpg",  champName: "YUUMI" },
  { id: "safe",              label: "No pasa nada",                short: "INDULTO",      weight: 0.20, tone: "mercy",  description: "La ruleta se apiada de ti. Sigue con tu vida.",                                                                                                       champName: "INDULTO" },
  { id: "first-pick-random", label: "Primer pick = random",       short: "PICK RANDOM",  weight: 0.15,                 description: "Tu siguiente partida bloqueas el primer champ random.",        imageUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Jinx_0.jpg",   champName: "JINX" },
];

const TRIGGER = "Werlyb";
const TARGET = "JavierrLol";

const PENDING = [
  { nick: "Th3Antonio", label: "Autofill · 2 restantes", img: "https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/Garen_0.jpg" },
  { nick: "Knekro",     label: "Yuumi · 1 restante",     img: "https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/Yuumi_0.jpg" },
  { nick: "Reborn",     label: "Support · 1 restante",   img: "https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/Thresh_0.jpg" },
];

const URL_PARAMS = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
const OBS_MODE = URL_PARAMS.get("obs") === "1";

// ------------------------------------------------------------
// MATH
// ------------------------------------------------------------
const TOTAL_WEIGHT = OPTIONS.reduce((s, o) => s + o.weight, 0);

const SECTORS = (() => {
  let acc = 0;
  return OPTIONS.map((o, i) => {
    const span = (o.weight / TOTAL_WEIGHT) * 360;
    const start = acc;
    const end = acc + span;
    acc = end;
    return { ...o, start, end, mid: (start + end) / 2, span, color: SECTOR_COLORS[i % SECTOR_COLORS.length] };
  });
})();

function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

// ------------------------------------------------------------
// LOGO
// ------------------------------------------------------------
function LogoMark({ size = 28 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, #fff79e 0%, ${YELLOW} 50%, ${YELLOW_DARK} 100%)`,
        display: "grid",
        placeItems: "center",
        color: "#0a0a0c",
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        fontSize: size * 0.55,
        lineHeight: 1,
        boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.5)",
      }}
    >
      S
    </div>
  );
}

// ------------------------------------------------------------
// WHEEL
// ------------------------------------------------------------
function Wheel({ rotation, spinning, size = 520 }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 10;
  const R_LABEL = R * 0.55;
  const R_THUMB = R * 0.78;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div
        style={{
          position: "absolute",
          inset: -12,
          borderRadius: "50%",
          boxShadow: "0 0 28px rgba(246,226,50,0.18), 0 12px 40px rgba(0,0,0,0.55)",
          pointerEvents: "none",
        }}
      />

      {/* HTML thumbnails layer — rotates with the wheel via the same rotation */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
        }}
        animate={{ rotate: rotation }}
        transition={{ duration: 6.5, ease: [0.12, 0.72, 0.12, 1] }}
      >
        {SECTORS.filter((s) => s.imageUrl).map((s) => {
          const pos = polar(cx, cy, R_THUMB, s.mid);
          return (
            <div
              key={`thumb-${s.id}`}
              style={{
                position: "absolute",
                left: pos.x - 22,
                top: pos.y - 22,
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: `url(${s.imageUrl}) center/cover, #1c1c20`,
                border: "1.5px solid rgba(255,255,255,0.95)",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.7)",
              }}
            />
          );
        })}
      </motion.div>

      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          display: "block",
          filter: spinning ? "blur(0.5px)" : "none",
          transition: "filter 0.6s ease-out",
        }}
        animate={{ rotate: rotation }}
        transition={{ duration: 6.5, ease: [0.12, 0.72, 0.12, 1] }}
      >
        <defs>
          <g>
            {SECTORS.map((s) => (
              <radialGradient key={`g-${s.id}`} id={`grad3-${s.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={s.color} stopOpacity={1} />
              </radialGradient>
            ))}
          </g>
          {SECTORS.filter((s) => s.imageUrl).map((s) => {
            const pos = polar(cx, cy, R_THUMB, s.mid);
            return (
              <clipPath key={`c-${s.id}`} id={`clip3-${s.id}`}>
                <circle cx={pos.x} cy={pos.y} r={22} />
              </clipPath>
            );
          })}
        </defs>

        {/* Sectors */}
        <g>
          {SECTORS.map((s) => (
            <path
              key={`p-${s.id}`}
              d={describeArc(cx, cy, R, s.start, s.end)}
              fill={`url(#grad3-${s.id})`}
              stroke="rgba(246,226,50,0.30)"
              strokeWidth={1}
            />
          ))}
        </g>

        {/* Labels + thumbs */}
        <g>
          {SECTORS.map((s) => {
            const labelPos = polar(cx, cy, R_LABEL, s.mid);
            const thumbPos = polar(cx, cy, R_THUMB, s.mid);
            const flip = s.mid > 90 && s.mid < 270;
            const textRotate = flip ? s.mid + 180 : s.mid;
            return (
              <g key={`lbl-${s.id}`}>
                <g transform={`translate(${labelPos.x}, ${labelPos.y}) rotate(${textRotate})`}>
                  <text
                    textAnchor="middle"
                    fill="#ffffff"
                    fontFamily={FONT_DISPLAY}
                    fontWeight={700}
                    fontSize={13}
                    letterSpacing={0.6}
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.85)" }}
                    dy={-2}
                  >
                    {s.short.length > 12 ? s.short.slice(0, 11) + "…" : s.short}
                  </text>
                  <text
                    textAnchor="middle"
                    fill={YELLOW}
                    fontFamily={FONT_DISPLAY}
                    fontWeight={700}
                    fontSize={11}
                    letterSpacing={1}
                    dy={13}
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.85)" }}
                  >
                    {Math.round(s.weight * 100)}%
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        <circle cx={cx} cy={cy} r={R} fill="none" stroke={YELLOW} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={R - 4} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      </motion.svg>

      {/* Center hub */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 35%, #1c1c20 0%, #0b0b0d 100%)",
          border: `1px solid ${BORDER}`,
          display: "grid",
          placeItems: "center",
          boxShadow: "0 0 22px rgba(0,0,0,0.7), inset 0 0 0 4px rgba(0,0,0,0.5)",
        }}
      >
        <LogoMark size={48} />
      </div>

      {/* Pointer */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: -8,
          transform: "translateX(-50%)",
          zIndex: 6,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.85))",
        }}
      >
        <svg width={32} height={30} viewBox="0 0 32 30">
          <defs>
            <linearGradient id="ptr3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff79e" />
              <stop offset="55%" stopColor={YELLOW} />
              <stop offset="100%" stopColor={YELLOW_DARK} />
            </linearGradient>
          </defs>
          <path d="M 16 30 L 1 1 L 31 1 Z" fill="url(#ptr3)" stroke="#5c5306" strokeWidth={1} />
        </svg>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// EVELYN BADGE
// ------------------------------------------------------------
function EvelynBadge({ text }) {
  return (
    <motion.div
      initial={{ scale: 0, y: -6 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ delay: 0.35, type: "spring", stiffness: 480, damping: 18 }}
      style={{
        position: "absolute",
        top: -22,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "3px 10px",
        background: YELLOW,
        color: "#0a0a0c",
        borderRadius: 6,
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: 1.5,
        whiteSpace: "nowrap",
        boxShadow: "0 4px 10px rgba(0,0,0,0.55)",
        zIndex: 3,
      }}
    >
      {text}
      <div
        style={{
          position: "absolute",
          bottom: -5,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: `5px solid ${YELLOW}`,
        }}
      />
    </motion.div>
  );
}

// ------------------------------------------------------------
// CHALLENGER ROW HELPERS
// ------------------------------------------------------------
const CHALLENGER_BG = "linear-gradient(90deg, #1A1112 0%, #2A1115 35%, #5A1117 100%)";

// ------------------------------------------------------------
// RESULT BANNER
// ------------------------------------------------------------
function ResultBanner({ option }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 16);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div
      animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 28 }}
      transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
      style={{
        opacity: 0,
        transform: "translateY(28px)",
        width: 920,
        height: 140,
        borderRadius: 16,
        background: CHALLENGER_BG,
        border: `1px solid ${BORDER}`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "0 30px 0 26px",
        boxShadow: "0 22px 60px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 14, right: 14, height: 1.5, background: YELLOW, opacity: 0.9 }} />
      <div style={{ position: "absolute", bottom: 0, left: 14, right: 14, height: 1.5, background: YELLOW, opacity: 0.9 }} />

      {/* Avatar + Evelyn */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: option.imageUrl ? `url(${option.imageUrl}) center/cover` : `radial-gradient(circle, ${YELLOW} 0%, ${YELLOW_DARK} 100%)`,
            border: `2px solid ${YELLOW}`,
            boxShadow: "0 0 0 1px #0a0a0c, 0 6px 14px rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            color: "#0a0a0c",
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 32,
          }}
        >
          {!option.imageUrl ? "✦" : null}
        </div>
        <EvelynBadge text={option.champName || "?"} />
      </div>

      {/* Center text */}
      <div style={{ flex: "0 0 320px", minWidth: 0 }}>
        <div
          style={{
            color: YELLOW,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: 3.5,
            textTransform: "uppercase",
            marginBottom: 5,
          }}
        >
          Castigo asignado
        </div>
        <div
          style={{
            color: "#fff",
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 24,
            lineHeight: 1.05,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            textWrap: "balance",
          }}
        >
          {option.label}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.6)",
            fontFamily: FONT_BODY,
            fontWeight: 400,
            fontSize: 12,
            lineHeight: 1.4,
            marginTop: 4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {option.description}
        </div>
      </div>

      <div style={{ width: 1, height: 80, background: "rgba(255,255,255,0.12)" }} />

      <div style={{ minWidth: 120 }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 2.8, textTransform: "uppercase", fontWeight: 600 }}>
          Para
        </div>
        <div style={{ color: "#fff", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, marginTop: 3 }}>
          {TARGET}
        </div>
      </div>

      <div style={{ width: 1, height: 80, background: "rgba(255,255,255,0.12)" }} />

      <div style={{ minWidth: 120 }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 2.8, textTransform: "uppercase", fontWeight: 600 }}>
          De parte de
        </div>
        <div
          style={{
            color: YELLOW,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 19,
            marginTop: 3,
            textShadow: "0 0 14px rgba(246,226,50,0.4)",
          }}
        >
          {TRIGGER}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {option.imageUrl && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 320,
            backgroundImage: `url(${option.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center 25%",
            maskImage: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,1) 100%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,1) 100%)",
            opacity: 0.55,
            pointerEvents: "none",
          }}
        />
      )}
    </motion.div>
  );
}

// ------------------------------------------------------------
// PENDING LIST
// ------------------------------------------------------------
function PendingList() {
  if (PENDING.length === 0) return null;
  return (
    <div style={{ position: "absolute", left: 40, top: 220, width: 380, zIndex: 3 }}>
      <div
        style={{
          color: YELLOW,
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        }}
      >
        <span style={{ width: 22, height: 1, background: YELLOW, opacity: 0.85 }} />
        Castigos pendientes
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PENDING.map((p, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              height: 56,
              padding: "0 16px",
              borderRadius: 12,
              background: CHALLENGER_BG,
              border: `1px solid ${BORDER}`,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 10, right: 10, height: 1, background: YELLOW, opacity: 0.6 }} />
            <div style={{ position: "absolute", bottom: 0, left: 10, right: 10, height: 1, background: YELLOW, opacity: 0.6 }} />
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: `url(${p.img}) center/cover, #1c1c20`,
                border: `1.5px solid ${YELLOW}`,
                flexShrink: 0,
                boxShadow: "0 0 0 1px #0a0a0c",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, lineHeight: 1.1, letterSpacing: 0.3 }}>
                {p.nick}
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontFamily: FONT_BODY, fontWeight: 400, fontSize: 11, marginTop: 2 }}>
                {p.label}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "8px 8px", gridTemplateRows: "8px 8px", gap: 3, opacity: 0.6 }}>
              {[0, 1, 2, 3].map((k) => (
                <div key={k} style={{ width: 8, height: 8, background: "rgba(255,255,255,0.85)", borderRadius: 1 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// HEADER
// ------------------------------------------------------------
function HeaderStrip() {
  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 40,
        right: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 3,
        padding: "10px 18px",
        borderRadius: 12,
        background: `linear-gradient(180deg, rgba(14,14,16,0.85) 0%, rgba(22,22,24,0.85) 100%)`,
        border: `1px solid ${BORDER}`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      {/* yellow ticket lines */}
      <div style={{ position: "absolute", top: 0, left: 14, right: 14, height: 1.2, background: YELLOW, opacity: 0.85 }} />
      <div style={{ position: "absolute", bottom: 0, left: 14, right: 14, height: 1.2, background: YELLOW, opacity: 0.85 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <LogoMark size={28} />
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, letterSpacing: 4.5, color: "#fff" }}>
          SOLOQCHALLENGE
        </div>
      </div>

      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 5.5,
          color: YELLOW,
          textTransform: "uppercase",
          textShadow: "0 0 18px rgba(246,226,50,0.4)",
        }}
      >
        ▸ Ruleta de Castigo ◂
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${BORDER}`,
          fontFamily: FONT_DISPLAY,
          fontWeight: 600,
          fontSize: 11,
          letterSpacing: 2.5,
          color: "rgba(255,255,255,0.78)",
          textTransform: "uppercase",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: YELLOW, boxShadow: "0 0 8px rgba(246,226,50,0.8)" }} />
        Semana 2 · Match #047
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// EVENT TITLE BLOCK (above the wheel, centered-ish)
// ------------------------------------------------------------
function TitleBlock() {
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        top: 540,
        width: 540,
        zIndex: 3,
        textShadow: "0 2px 8px rgba(0,0,0,0.8)",
      }}
    >
      <div
        style={{
          color: YELLOW,
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: 5,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Castigo en directo
      </div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        <span style={{ color: YELLOW }}>{TRIGGER}</span>
        <span style={{ color: "rgba(255,255,255,0.45)", margin: "0 14px" }}>→</span>
        <span style={{ color: "#fff" }}>{TARGET}</span>
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.7)",
          fontFamily: FONT_BODY,
          fontWeight: 400,
          fontSize: 14,
          marginTop: 10,
          maxWidth: 520,
        }}
      >
        Win streak detectada — 3 victorias seguidas. La ruleta determina el peaje.
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// SPINNER
// ------------------------------------------------------------
function Spinner() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: `2px solid rgba(246,226,50,0.25)`,
        borderTopColor: YELLOW,
        display: "inline-block",
        animation: "rspin 0.8s linear infinite",
      }}
    />
  );
}

// ------------------------------------------------------------
// APP
// ------------------------------------------------------------
function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1920,
    h: typeof window !== "undefined" ? window.innerHeight : 1080,
  }));
  useEffect(() => {
    const measure = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    measure();
    // Re-measure on next frame too (iframe can resize after mount)
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(document.documentElement);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      if (ro) ro.disconnect();
    };
  }, []);
  return vp;
}

function App() {
  const [winnerId, setWinnerId] = useState("rol-sup-2");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | spinning | result
  const [bgOn, setBgOn] = useState(true);
  const tokenRef = useRef(0);

  const winner = SECTORS.find((s) => s.id === winnerId) || SECTORS[0];

  const { w: vpW, h: vpH } = useViewport();
  // Reserve ~120px top (header) + ~200px bottom (banner). Cap between 360 and 520.
  const wheelSize = Math.round(Math.max(360, Math.min(520, vpH - 360)));
  const captionH = 56;

  // BG toggle reflected on body
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("bg-on", bgOn && !OBS_MODE);
    document.body.classList.toggle("bg-off", !bgOn || OBS_MODE);
  }, [bgOn]);

  // Backend-driven spin: receives a winner id and animates wheel to that sector
  const spinTo = (targetId) => {
    const id = targetId || winnerId;
    const target = SECTORS.find((s) => s.id === id);
    if (!target) return;
    if (phase === "spinning") return;

    tokenRef.current += 1;
    const myToken = tokenRef.current;

    setPhase("spinning");
    setSpinning(true);
    setWinnerId(id);

    const jitterMag = Math.min(target.span * 0.35, 8);
    const jitter = (Math.random() * 2 - 1) * jitterMag;
    const baseTurns = 6 * 360;
    const desired = -target.mid + jitter;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = (((desired - currentMod) % 360) + 360) % 360;
    const next = rotation + baseTurns + delta;
    setRotation(next);

    setTimeout(() => {
      if (tokenRef.current !== myToken) return;
      setSpinning(false);
      setTimeout(() => {
        if (tokenRef.current !== myToken) return;
        setPhase("result");
      }, 600);
    }, 6500);
  };

  const reset = () => {
    tokenRef.current += 1;
    setSpinning(false);
    setPhase("idle");
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "r" || e.key === "R") {
        if (phase === "spinning") return;
        const r = Math.random() * TOTAL_WEIGHT;
        let acc = 0;
        let picked = SECTORS[0];
        for (const s of SECTORS) {
          acc += s.weight;
          if (r <= acc) { picked = s; break; }
        }
        spinTo(picked.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div style={{ position: "absolute", inset: 0, color: "#fff", fontFamily: FONT_BODY }}>
      <HeaderStrip />
      <TitleBlock />
      <PendingList />

      {/* WHEEL + CAPTION — vertically centered on the right */}
      <div
        style={{
          position: "absolute",
          right: Math.max(40, Math.min(120, (vpW - 1280) / 6)),
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <Wheel rotation={rotation} spinning={spinning} size={wheelSize} />

        <div style={{ height: captionH, display: "flex", alignItems: "center" }}>
          <AnimatePresence mode="wait">
            {phase === "spinning" && (
              <motion.div
                key="dec"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 24px",
                  borderRadius: 999,
                  background: "rgba(14,14,16,0.85)",
                  border: `1px solid rgba(246,226,50,0.35)`,
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: "#fff",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <Spinner />
                Decelerando…
              </motion.div>
            )}
            {phase === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: "rgba(14,14,16,0.7)",
                  border: `1px solid ${BORDER}`,
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3ee07f", boxShadow: "0 0 8px rgba(62,224,127,0.6)" }} />
                Lista para girar
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RESULT BANNER bottom-center */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 80,
          transform: "translateX(-50%)",
          zIndex: 8,
          pointerEvents: "none",
        }}
      >
        {phase === "result" && <ResultBanner key={winner.id} option={winner} />}
      </div>

      {/* DEV PANEL bottom-left */}
      {!OBS_MODE && (
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 40,
            zIndex: 30,
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(14,14,16,0.92)",
            border: `1px solid ${BORDER}`,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: 260,
            boxShadow: "0 14px 30px rgba(0,0,0,0.55)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                color: YELLOW,
                fontFamily: FONT_DISPLAY,
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              Dev Panel
            </div>
            <div
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 9,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: 1,
              }}
            >
              {phase}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <DevBtn onClick={() => setBgOn((v) => !v)} variant="ghost">
              {bgOn ? "BG OFF" : "BG ON"}
            </DevBtn>
            <DevBtn onClick={reset} variant="ghost">
              Reset
            </DevBtn>
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: FONT_DISPLAY,
              fontSize: 9,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            Forzar ganador
          </div>
          <select
            value={winnerId}
            onChange={(e) => setWinnerId(e.target.value)}
            disabled={phase === "spinning"}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.5)",
              border: `1px solid ${BORDER}`,
              color: "#fff",
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 500,
              outline: "none",
              cursor: phase === "spinning" ? "not-allowed" : "pointer",
            }}
          >
            {SECTORS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} · {Math.round(s.weight * 100)}%
              </option>
            ))}
          </select>

          <DevBtn onClick={() => spinTo()} variant="primary" disabled={phase === "spinning"}>
            {phase === "spinning" ? "Girando…" : "Disparar Ruleta"}
          </DevBtn>

          <div
            style={{
              color: "rgba(255,255,255,0.4)",
              fontFamily: FONT_BODY,
              fontSize: 10,
              letterSpacing: 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "center",
            }}
          >
            <kbd
              style={{
                padding: "2px 6px",
                borderRadius: 4,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                fontFamily: "ui-monospace, monospace",
                fontSize: 10,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              R
            </kbd>
            spin aleatorio
          </div>
        </div>
      )}

      {/* DEBUG badge top-right of viewport (hidden in OBS) */}
      {!OBS_MODE && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            padding: "5px 10px",
            borderRadius: 6,
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.12)",
            fontFamily: "ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.7)",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: phase === "spinning" ? YELLOW : "#3ee07f",
              boxShadow: phase === "spinning"
                ? "0 0 8px rgba(246,226,50,0.8)"
                : "0 0 6px rgba(62,224,127,0.6)",
            }}
          />
          DEBUG · {phase} · winner:&nbsp;<span style={{ color: YELLOW }}>{winner.id}</span>
        </div>
      )}
    </div>
  );
}

function DevBtn({ children, onClick, disabled, variant = "ghost" }) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: isPrimary ? "10px 14px" : "8px 10px",
        borderRadius: isPrimary ? 999 : 8,
        border: isPrimary ? "1px solid rgba(0,0,0,0.4)" : `1px solid ${BORDER}`,
        background: disabled
          ? "rgba(60,55,15,0.4)"
          : isPrimary
            ? `linear-gradient(180deg, #fff79e 0%, ${YELLOW} 50%, ${YELLOW_DARK} 100%)`
            : "rgba(255,255,255,0.04)",
        color: disabled ? "rgba(255,255,255,0.5)" : isPrimary ? "#0a0a0c" : "#fff",
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        fontSize: isPrimary ? 12 : 10,
        letterSpacing: isPrimary ? 3 : 2,
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: isPrimary && !disabled ? "0 4px 12px rgba(246,226,50,0.4), inset 0 1px 0 rgba(255,255,255,0.5)" : "none",
        transition: "transform 0.08s ease",
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
    >
      {children}
    </button>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
