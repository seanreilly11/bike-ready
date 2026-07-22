import type { StaticImageData } from "next/image";

import bothDirectionsImage from "../public/assets/signs/both_directions.png";
import fietsstraatImage from "../public/assets/signs/fietsstraat.png";
import letOpImage from "../public/assets/signs/let_op.png";
import mandatoryCycleImage from "../public/assets/signs/mandatory_cycle.png";
import motorizedOnlyImage from "../public/assets/signs/motorized_only.png";
import noCyclingImage from "../public/assets/signs/no_cycling.png";
import noParkingImage from "../public/assets/signs/no_parking.png";
import priorityEndImage from "../public/assets/signs/priority_end.png";
import priorityRoadImage from "../public/assets/signs/priority_road.png";
import uitgezonderdEntryImage from "../public/assets/signs/uitgezonderd_red_sign.png";
import uitgezonderdImage from "../public/assets/signs/uitgezonderd.png";

/**
 * Every sign photo in `public/assets/signs`, statically imported so Next has
 * intrinsic dimensions at build time (no layout shift, no runtime fetch of
 * metadata). Keys match the question bank's `sign` field.
 */
export const SIGN_IMAGES = {
  both_directions: bothDirectionsImage,
  fietsstraat: fietsstraatImage,
  let_op: letOpImage,
  mandatory_cycle: mandatoryCycleImage,
  motorized_only: motorizedOnlyImage,
  no_cycling: noCyclingImage,
  no_parking: noParkingImage,
  priority_end: priorityEndImage,
  priority_road: priorityRoadImage,
  uitgezonderd_entry: uitgezonderdEntryImage,
  uitgezonderd: uitgezonderdImage,
} satisfies Record<string, StaticImageData>;

/**
 * `signs-reference.json` `component` key → photo. Only signs we hold a real
 * photo for appear here; the rest render text-only rather than a drawn stand-in.
 */
export const SIGN_REFERENCE_IMAGES: Record<string, StaticImageData> = {
  mandatory_cycle: SIGN_IMAGES.mandatory_cycle,
  no_cycling: SIGN_IMAGES.no_cycling,
  fietsstraat: SIGN_IMAGES.fietsstraat,
  cyclists_both_ways: SIGN_IMAGES.both_directions,
  uitgezonderd: SIGN_IMAGES.uitgezonderd,
  priority_road: SIGN_IMAGES.priority_road,
};
