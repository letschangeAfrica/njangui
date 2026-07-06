/**
 * Onboarding market illustration — pixel-matched to the approved design
 * spec (two stalls exchanging goods, reputation badge above, handshake
 * between vendor and customer). Rendered with react-native-svg so it
 * scales cleanly to any container width.
 *
 * `accent` is the single brand color threaded through: the left stall's
 * awning, one produce dot per stall, and the customer's torso. The right
 * stall's awning is always green, per the source design.
 */

import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

const VIEWBOX_W = 320;
const VIEWBOX_H = 230;

export default function MarketIllustration({
  width,
  accent,
}: {
  width: number;
  accent: string;
}) {
  const height = (width * VIEWBOX_H) / VIEWBOX_W;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
      {/* ground */}
      <Ellipse cx={160} cy={206} rx={140} ry={16} fill="#E7D3B7" opacity={0.7} />

      {/* reputation badge — smaller than the source spec's badge so it
          reads as an accent above the stalls, not a competing focal point */}
      <Circle cx={160} cy={26} r={14} fill="#FDF0DC" />
      <Circle cx={160} cy={26} r={14} fill="none" stroke="#E0A21A" strokeWidth={1.5} />
      <Path
        d="M160 19l1.93 3.94 4.34 .63-3.14 3.07 .73 4.3-3.87-2.03-3.87 2.03 .73-4.3-3.14-3.07 4.34-.63z"
        fill="#E0A21A"
      />
      <Path
        d="M160 40 L160 62"
        stroke="#D9C3A2"
        strokeWidth={2}
        strokeDasharray="2 5"
        strokeLinecap="round"
      />

      {/* ── left stall ── */}
      <Rect x={34} y={88} width={6} height={80} rx={3} fill="#B98A5A" />
      <Rect x={120} y={88} width={6} height={80} rx={3} fill="#B98A5A" />
      {/* awning bunting */}
      <Path
        d="M28 66 h104 v10 l-6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 z"
        fill={accent}
      />
      <Path d="M28 66 h104 v6 h-104 z" fill="#F7E0CB" />
      <Rect x={42} y={66} width={12} height={16} fill="#F7EFE2" opacity={0.55} />
      <Rect x={66} y={66} width={12} height={16} fill="#F7EFE2" opacity={0.55} />
      <Rect x={90} y={66} width={12} height={16} fill="#F7EFE2" opacity={0.55} />
      <Rect x={114} y={66} width={12} height={16} fill="#F7EFE2" opacity={0.55} />
      {/* counter */}
      <Rect x={30} y={150} width={100} height={30} rx={5} fill="#C99A63" />
      <Rect x={30} y={150} width={100} height={8} rx={4} fill="#DBB484" />
      {/* produce */}
      <Circle cx={52} cy={146} r={8} fill="#1E7A52" />
      <Circle cx={72} cy={146} r={8} fill={accent} />
      <Circle cx={92} cy={146} r={8} fill="#E0A21A" />

      {/* ── right stall ── */}
      <Rect x={194} y={88} width={6} height={80} rx={3} fill="#B98A5A" />
      <Rect x={280} y={88} width={6} height={80} rx={3} fill="#B98A5A" />
      <Path
        d="M188 66 h104 v10 l-6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 z"
        fill="#1E7A52"
      />
      <Path d="M188 66 h104 v6 h-104 z" fill="#DCEDE2" />
      <Rect x={202} y={66} width={12} height={16} fill="#EAF4EE" opacity={0.55} />
      <Rect x={226} y={66} width={12} height={16} fill="#EAF4EE" opacity={0.55} />
      <Rect x={250} y={66} width={12} height={16} fill="#EAF4EE" opacity={0.55} />
      <Rect x={274} y={66} width={12} height={16} fill="#EAF4EE" opacity={0.55} />
      <Rect x={190} y={150} width={100} height={30} rx={5} fill="#C99A63" />
      <Rect x={190} y={150} width={100} height={8} rx={4} fill="#DBB484" />
      <Circle cx={232} cy={146} r={8} fill={accent} />
      <Circle cx={252} cy={146} r={8} fill="#1E7A52" />

      {/* vendor — behind left counter */}
      <Circle cx={108} cy={112} r={12} fill="#8A5A34" />
      <Path d="M96 150 q0 -22 12 -22 q12 0 12 22 z" fill="#1E7A52" />

      {/* customer — front, center */}
      <Circle cx={176} cy={120} r={13} fill="#5C3A1E" />
      <Path d="M162 168 q0 -26 14 -26 q14 0 14 26 z" fill={accent} />

      {/* handshake */}
      <Path
        d="M120 138 Q148 108 164 132"
        fill="none"
        stroke="#241C15"
        strokeWidth={3.5}
        strokeLinecap="round"
        opacity={0.85}
      />
      <Circle cx={120} cy={138} r={5.5} fill="#8A5A34" />
      <Circle cx={164} cy={132} r={5.5} fill="#5C3A1E" />
    </Svg>
  );
}
