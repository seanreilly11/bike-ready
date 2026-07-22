import Image from "next/image";
import type { StaticImageData } from "next/image";

import { SIGN_IMAGES } from "./signImages";

const SignImage = ({ src, alt }: { src: StaticImageData; alt: string }) => (
  <Image src={src} alt={alt} width={100} height={100} loading="lazy" />
);

const BothDirectionsSign = () => (
  <SignImage
    src={SIGN_IMAGES.both_directions}
    alt="Two-way cyclists and mopeds sign"
  />
);
const FietsstraatSign = () => (
  <SignImage src={SIGN_IMAGES.fietsstraat} alt="Fietsstraat sign" />
);
const LetOpSign = () => (
  <SignImage src={SIGN_IMAGES.let_op} alt="Let op warning sign" />
);
const MandatoryCycleSign = () => (
  <SignImage src={SIGN_IMAGES.mandatory_cycle} alt="Mandatory cycle path (G11)" />
);
const MotorizedOnlySign = () => (
  <SignImage src={SIGN_IMAGES.motorized_only} alt="Motorized vehicles only sign" />
);
const NoCyclingSign = () => (
  <SignImage src={SIGN_IMAGES.no_cycling} alt="No cycling sign" />
);
const NoParkingSign = () => (
  <SignImage src={SIGN_IMAGES.no_parking} alt="No parking sign" />
);
const PriorityEndsSign = () => (
  <SignImage src={SIGN_IMAGES.priority_end} alt="Priority ends sign" />
);
const PriorityRoadSign = () => (
  <SignImage src={SIGN_IMAGES.priority_road} alt="Priority road sign" />
);
const UitgezonderdEntrySign = () => (
  <SignImage
    src={SIGN_IMAGES.uitgezonderd_entry}
    alt="No entry except cyclists sign"
  />
);
const UitgezonderdSign = () => (
  <SignImage src={SIGN_IMAGES.uitgezonderd} alt="Cyclists excepted sign" />
);

// ---------------------------------------------------------------------------
// Registry - lookup by SignId
// ---------------------------------------------------------------------------

export const SIGN_REGISTRY = {
  both_directions: BothDirectionsSign,
  fietsstraat: FietsstraatSign,
  let_op: LetOpSign,
  mandatory_cycle: MandatoryCycleSign,
  motorized_only: MotorizedOnlySign,
  no_cycling: NoCyclingSign,
  no_parking: NoParkingSign,
  priority_ends: PriorityEndsSign,
  priority_road: PriorityRoadSign,
  uitgezonderd_entry: UitgezonderdEntrySign,
  uitgezonderd: UitgezonderdSign,
};
