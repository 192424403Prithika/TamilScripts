export interface StrokePoint {
  x: number;
  y: number;
  pen_down: number;
  dt: number;
}

export interface PredictionItem {
  class_id: number;
  char: string;
  transliteration: string;
  confidence: number;
  unicode: string;
  category: string;
  meaning: string;
  stroke_count: number;
}

export interface RecognitionResult {
  predictions: PredictionItem[];
  top_prediction?: PredictionItem;
  recognized_word?: string;
  word_transliteration?: string;
  word_confidence?: number;
  segmented_chars?: string[];
  latency_ms: number;
  modality: string;
  is_scribble?: boolean;
  ood_score?: number;
}

export interface QualityScoreResult {
  target_char: string;
  target_transliteration: string;
  overall_score: number;
  proportions_score: number;
  loops_score: number;
  smoothness_score: number;
  feedback_text: string;
  pass_status: boolean;
  reference_image_base64: string;
}

export interface LeaderboardEntry {
  username: string;
  total_xp: number;
  streak_days: number;
  rank: number;
  badge: string;
}

export interface ModelMetricInfo {
  name: string;
  target_platform: string;
  test_top1_acc?: number;
  test_top5_acc?: number;
  params?: number;
  size_mb: number;
  latency_p50_ms: number;
  latency_p95_ms: number;
}
