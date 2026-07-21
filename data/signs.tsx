import Image from "next/image";
import type { StaticImageData } from "next/image";

import bothDirectionsImage from "../public/assets/signs/both_directions.png";
import fietsstraatImage from "../public/assets/signs/fietsstraat.png";
import letOpImage from "../public/assets/signs/let_op.png";
import mandatoryCycleImage from "../public/assets/signs/mandatory_cycle.png";
import motorizedOnlyImage from "../public/assets/signs/motorized_only.png";
import noCyclingImage from "../public/assets/signs/no_cycling.png";
import noParkingImage from "../public/assets/signs/no_parking.png";
import priorityEndsImage from "../public/assets/signs/priority_end.png";
import priorityRoadImage from "../public/assets/signs/priority_road.png";
import uitgezonderdEntryImage from "../public/assets/signs/uitgezonderd_red_sign.png";
import uitgezonderdImage from "../public/assets/signs/uitgezonderd.png";

const SignImage = ({ src, alt }: { src: StaticImageData; alt: string }) => (
  <Image src={src} alt={alt} width={100} height={100} loading="lazy" />
);

const BothDirectionsSign = () => (
  <SignImage src={bothDirectionsImage} alt="Two-way cyclists and mopeds sign" />
);
const FietsstraatSign = () => (
  <SignImage src={fietsstraatImage} alt="Fietsstraat sign" />
);
const LetOpSign = () => (
  <SignImage src={letOpImage} alt="Let op warning sign" />
);
const MandatoryCycleSign = () => (
  <SignImage src={mandatoryCycleImage} alt="Mandatory cycle path (G11)" />
);
const MotorizedOnlySign = () => (
  <SignImage src={motorizedOnlyImage} alt="Motorized vehicles only sign" />
);
const NoCyclingSign = () => (
  <SignImage src={noCyclingImage} alt="No cycling sign" />
);
const NoParkingSign = () => (
  <SignImage src={noParkingImage} alt="No parking sign" />
);
const PriorityEndsSign = () => (
  <SignImage src={priorityEndsImage} alt="Priority ends sign" />
);
const PriorityRoadSign = () => (
  <SignImage src={priorityRoadImage} alt="Priority road sign" />
);
const UitgezonderdEntrySign = () => (
  <SignImage src={uitgezonderdEntryImage} alt="No entry except cyclists sign" />
);
const UitgezonderdSign = () => (
  <SignImage src={uitgezonderdImage} alt="Cyclists excepted sign" />
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
  uitgezonderd: UitgezonderdSign, // TODO: add
};
