import React from "react";
import { motion } from "framer-motion";

// Hand-built flat mascot illustration: a mentor pointing at a whiteboard of
// code. Drawn in SVG (no external image asset) so it stays crisp at any
// size and can be animated piece by piece with framer-motion.
export default function MentorIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 420 380" className={className} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="205" cy="352" rx="150" ry="16" className="fill-accent/10" />

      {/* Whiteboard on an easel */}
      <motion.g
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <g transform="rotate(4 305 197)">
          <line x1="255" y1="298" x2="232" y2="344" stroke="#2F3542" strokeWidth="7" strokeLinecap="round" />
          <line x1="255" y1="298" x2="300" y2="344" stroke="#2F3542" strokeWidth="7" strokeLinecap="round" />
          <line x1="330" y1="298" x2="353" y2="344" stroke="#2F3542" strokeWidth="7" strokeLinecap="round" />

          <rect x="218" y="86" width="176" height="220" rx="20" fill="white" stroke="#2F3542" strokeWidth="6" />
          <rect x="238" y="108" width="76" height="24" rx="8" fill="#F6C445" />
          <text x="248" y="125" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="15" fill="#2F3542">{"</>"}</text>

          <rect x="238" y="150" width="128" height="11" rx="5.5" fill="#F6C445" opacity="0.85" />
          <rect x="238" y="173" width="96" height="11" rx="5.5" fill="#E9EAEE" />
          <rect x="238" y="196" width="116" height="11" rx="5.5" fill="#E9EAEE" />
          <rect x="238" y="219" width="74" height="11" rx="5.5" fill="#4CAF50" opacity="0.85" />
          <rect x="238" y="242" width="104" height="11" rx="5.5" fill="#E9EAEE" />

          <circle cx="358" cy="268" r="28" fill="#4CAF50" stroke="white" strokeWidth="5" />
          <path d="M347 268 L356 277 L371 259" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      </motion.g>

      {/* Mentor character */}
      <motion.g
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}
      >
        {/* legs */}
        <rect x="100" y="288" width="28" height="42" rx="11" fill="#2F3542" />
        <rect x="158" y="288" width="28" height="42" rx="11" fill="#2F3542" />

        {/* left arm (resting on hip) */}
        <rect x="50" y="192" width="26" height="72" rx="13" fill="#2F3542" />

        {/* body */}
        <rect x="68" y="148" width="150" height="150" rx="38" fill="#2F3542" />

        {/* face plate */}
        <rect x="92" y="172" width="102" height="82" rx="22" fill="#3A4356" />
        <circle cx="122" cy="211" r="7.5" fill="#F6C445" />
        <circle cx="164" cy="211" r="7.5" fill="#F6C445" />
        <path d="M120 230 Q143 246 166 230" stroke="#F6C445" strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* graduation cap */}
        <polygon points="143,86 218,116 143,146 68,116" fill="#F6C445" />
        <rect x="130" y="116" width="26" height="20" rx="4" fill="#E5B02E" />
        <line x1="212" y1="119" x2="212" y2="152" stroke="#2F3542" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="212" cy="157" r="6.5" fill="#2F3542" />

        {/* right arm pointing at the board, with a subtle wobble */}
        <motion.g
          style={{ transformOrigin: "204px 188px" }}
          animate={{ rotate: [0, 7, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="196" y="150" width="26" height="92" rx="13" fill="#2F3542" transform="rotate(-38 209 188)" />
          <line x1="258" y1="138" x2="308" y2="104" stroke="#F6C445" strokeWidth="7" strokeLinecap="round" />
          <circle cx="308" cy="104" r="7" fill="#F6C445" />
        </motion.g>
      </motion.g>

      {/* floating sparkles */}
      <motion.text
        x="18" y="150" fontSize="26"
        animate={{ y: [150, 130, 150], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 3, repeat: Infinity }}
      >✨</motion.text>
      <motion.text
        x="368" y="55" fontSize="22"
        animate={{ y: [55, 38, 55], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3.4, repeat: Infinity, delay: 0.5 }}
      >⭐</motion.text>
      <motion.text
        x="20" y="70" fontSize="20"
        animate={{ y: [70, 56, 70], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.8, repeat: Infinity, delay: 1 }}
      >💡</motion.text>
    </svg>
  );
}
