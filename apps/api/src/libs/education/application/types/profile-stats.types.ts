import { Role } from "../../../identity/config/identity.enums";
import { ProfileMetric } from "../../config/profile-stats.enums";

export interface MetricValue {
  key: ProfileMetric;
  value: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface BreakdownItem {
  label: string;
  average_percent: number;
  submissions: number;
}

export interface HighlightItem {
  label: string;
  caption: string;
  percent: number;
}

export interface ProfileStats {
  role: Role;
  average_percent: number;
  metrics: MetricValue[];
  trend: TrendPoint[];
  breakdown: BreakdownItem[];
  highlights: HighlightItem[];
}
