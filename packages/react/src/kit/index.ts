/**
 * @latent/react/kit — the Latent · 潜 component kit.
 *
 * Standalone, prop-driven React components grounded in the design language and
 * decoupled from the CognitiveState schema, so any app can adopt them piece by
 * piece. Import the styles once (after @latent/tokens/css):
 *
 *   import "@latent/tokens/css";
 *   import "@latent/react/kit.css";
 *   import { Button, EpistemicCard, StateDot } from "@latent/react/kit";
 */

// shared
export { cx, toneClass } from "./types.ts";
export type { Tone } from "./types.ts";

// primitives
export {
  Button,
  IconButton,
  Badge,
  Tag,
  Chip,
  Card,
  Panel,
  Meter,
  Disclosure,
  Segmented,
  Tabs,
  Switch,
  Field,
  Input,
  Textarea,
  Callout,
  Divider,
  Kbd,
  Tooltip,
} from "./primitives.tsx";
export type {
  ButtonProps,
  ButtonVariant,
  ChipProps,
  CardProps,
  MeterProps,
  DisclosureProps,
  SegOption,
  SegmentedProps,
  TabItem,
} from "./primitives.tsx";

// forms
export { Checkbox, Radio, RadioGroup, Select, Slider } from "./forms.tsx";
export type { CheckboxProps, RadioProps, RadioOption, SelectOption, SelectProps, SliderProps } from "./forms.tsx";

// overlays
export { Modal, Drawer, Popover, Toaster, useToast } from "./overlay.tsx";
export type { ToastInput } from "./overlay.tsx";

// data display
export {
  Table,
  DescList,
  Stat,
  Avatar,
  AvatarGroup,
  Skeleton,
  Spinner,
  EmptyState,
  Timeline,
  Breadcrumb,
  Pagination,
  Steps,
} from "./data.tsx";
export type { Column, DescItem, TimelineItem, Crumb, StepItem } from "./data.tsx";

// navigation / shell
export { NavList, NavGroup, NavItem, Toolbar, ToolbarSpacer } from "./shell.tsx";
export type { NavItemProps } from "./shell.tsx";

// semantic
export {
  StateDot,
  CertaintyPill,
  ConfidenceMeter,
  EvidenceList,
  Provenance,
  FalsifyNote,
  InflectionMark,
  EpistemicCard,
  OutcomeBanner,
} from "./semantic.tsx";
export type {
  EpistemicState,
  CertaintyLevel,
  EvidenceItem,
  ProvenanceStep,
  ProvenanceProps,
  EpistemicCardProps,
} from "./semantic.tsx";

// motion + voices
export { Reveal, Voice, Mono, UIText } from "./motion.tsx";
export type { Motion } from "./motion.tsx";

// layout
export { ZoneLayout, Zone } from "./layout.tsx";
export type { ZoneRole } from "./layout.tsx";

// controls
export { ThemeToggle, LangToggle } from "./controls.tsx";
export type { Theme } from "./controls.tsx";

// language hooks (re-exported for convenience)
export { useLang, useStrings } from "../i18n.ts";
export type { Lang } from "../i18n.ts";
