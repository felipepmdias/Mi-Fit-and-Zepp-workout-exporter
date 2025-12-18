import { z } from 'zod';

// Esquema para o resumo do treino (equivalente a WorkoutSummary)
export const WorkoutSummarySchema = z.object({
  trackid: z.string(),
  source: z.string(),
  dis: z.string(),
  calorie: z.string(),
  end_time: z.string(),
  run_time: z.string(),
  avg_pace: z.string(), // Pode ser '0.0' ou similar
  avg_frequency: z.string(),
  avg_heart_rate: z.string(),
  type: z.number(),
  location: z.string(),
  city: z.string(),
  forefoot_ratio: z.string().optional(),
  bind_device: z.string().optional(),
  max_pace: z.number().nullable().optional(),
  min_pace: z.number().nullable().optional(),
  version: z.number().optional(),
  altitude_ascend: z.number().nullable().optional(),
  altitude_descend: z.number().nullable().optional(),
  total_step: z.number().nullable().optional(),
  avg_stride_length: z.number().nullable().optional(),
  max_frequency: z.number().nullable().optional(),
  max_altitude: z.number().nullable().optional(),
  min_altitude: z.number().nullable().optional(),
  lap_distance: z.number().nullable().optional(),
  sync_to: z.string().nullable().optional(),
  distance_ascend: z.number().nullable().optional(),
  max_cadence: z.number().nullable().optional(),
  avg_cadence: z.number().nullable().optional(),
  landing_time: z.number().nullable().optional(),
  flight_ratio: z.number().nullable().optional(),
  climb_dis_descend: z.number().nullable().optional(),
  climb_dis_ascend_time: z.number().nullable().optional(),
  climb_dis_descend_time: z.number().nullable().optional(),
  child_list: z.string().nullable().optional(),
  parent_trackid: z.number().nullable().optional(),
  max_heart_rate: z.number().nullable().optional(),
  min_heart_rate: z.number().nullable().optional(),
  swolf: z.number().nullable().optional(),
  total_strokes: z.number().nullable().optional(),
  total_trips: z.number().nullable().optional(),
  avg_stroke_speed: z.number().nullable().optional(),
  max_stroke_speed: z.number().nullable().optional(),
  avg_distance_per_stroke: z.number().nullable().optional(),
  swim_pool_length: z.number().nullable().optional(),
  te: z.number().nullable().optional(),
  swim_style: z.number().nullable().optional(),
  unit: z.number().nullable().optional(),
  add_info: z.string().nullable().optional(),
  sport_mode: z.number().nullable().optional(),
  downhill_num: z.number().nullable().optional(),
  downhill_max_altitude_desend: z.number().nullable().optional(),
  strokes: z.number().nullable().optional(),
  fore_hand: z.number().nullable().optional(),
  back_hand: z.number().nullable().optional(),
  serve: z.number().nullable().optional(),
  second_half_start_time: z.number().nullable().optional(),
  pb: z.string().nullable().optional(),
  rope_skipping_count: z.number().nullable().optional(),
  rope_skipping_avg_frequency: z.number().nullable().optional(),
  rope_skipping_max_frequency: z.number().nullable().optional(),
  rope_skipping_rest_time: z.number().nullable().optional(),
  left_landing_time: z.number().nullable().optional(),
  left_flight_ratio: z.number().nullable().optional(),
  right_landing_time: z.number().nullable().optional(),
  right_flight_ratio: z.number().nullable().optional(),
  marathon: z.string().nullable().optional(),
  situps: z.number().nullable().optional(),
  anaerobic_te: z.number().nullable().optional(),
  target_type: z.number().nullable().optional(),
  target_value: z.string().nullable().optional(),
  total_group: z.number().nullable().optional(),
  spo2_max: z.number().nullable().optional(),
  spo2_min: z.number().nullable().optional(),
  avg_altitude: z.number().nullable().optional(),
  max_slope: z.number().nullable().optional(),
  avg_slope: z.number().nullable().optional(),
  avg_pulloar_time: z.number().nullable().optional(),
  avg_return_time: z.number().nullable().optional(),
  floor_number: z.number().nullable().optional(),
  upstairs_height: z.number().nullable().optional(),
  min_upstairs_floors: z.number().nullable().optional(),
  accumulated_gap: z.number().nullable().optional(),
  auto_recognition: z.union([z.number(), z.boolean()]).nullable().optional(),
  app_name: z.string(),
  pause_time: z.string().nullable().optional(),
  heartrate_setting_type: z.number().nullable().optional(),
  sport_title: z.string().nullable().optional(),
});

export type WorkoutSummary = z.infer<typeof WorkoutSummarySchema>;

// Esquema para os detalhes do treino (equivalente a WorkoutDetailData)
export const WorkoutDetailDataSchema = z.object({
  trackid: z.number(),
  source: z.string(),
  longitude_latitude: z.string().nullable().optional(),
  altitude: z.string().nullable().optional(),
  accuracy: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  gait: z.string().nullable().optional(),
  pace: z.string().nullable().optional(),
  pause: z.string().nullable().optional(),
  spo2: z.string().nullable().optional(),
  flag: z.string().nullable().optional(),
  kilo_pace: z.string().nullable().optional(),
  mile_pace: z.string().nullable().optional(),
  heart_rate: z.string().nullable().optional(),
  version: z.number().optional(),
  provider: z.string().optional(),
  speed: z.string().optional(),
  bearing: z.string().optional(),
  distance: z.string().optional(),
  lap: z.string().optional(),
  air_pressure_altitude: z.string().optional(),
  course: z.string().optional(),
  correct_altitude: z.string().optional(),
  stroke_speed: z.string().optional(),
  cadence: z.string().optional(),
  daily_performance_info: z.string().optional(),
  rope_skipping_frequency: z.string().optional(),
  weather_info: z.string().optional(),
  coaching_segment: z.string().optional(),
  golf_swing_rt_data: z.string().optional(),
  power_meter: z.string().optional(),
});

export type WorkoutDetailData = z.infer<typeof WorkoutDetailDataSchema>;

// Esquema para o histórico
export const WorkoutHistoryDataSchema = z.object({
  next: z.number(),
  summary: z.array(WorkoutSummarySchema),
});

export const WorkoutHistorySchema = z.object({
  code: z.number(),
  message: z.string(),
  data: WorkoutHistoryDataSchema,
});

export type WorkoutHistory = z.infer<typeof WorkoutHistorySchema>;

// Esquema para a resposta completa de detalhes
export const WorkoutDetailSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: WorkoutDetailDataSchema,
});

export type WorkoutDetail = z.infer<typeof WorkoutDetailSchema>;

// Ponto exportável processado
export interface ExportablePoint {
  time: Date;
  latitude: number;
  longitude: number;
  altitude: number | null;
  heart_rate: number | null;
  cadence: number | null;
}

// Esquema para o resumo do peso
export const WeightSummarySchema = z.object({
  weight: z.number(),
  bmi: z.number(),
  deviceType: z.number().optional(),
  source: z.number().optional(),
  syncHealthConnect: z.boolean().optional(),
});

// Esquema para o registro de peso
export const WeightRecordSchema = z.object({
  userId: z.string(),
  memberId: z.string(),
  deviceSource: z.number(),
  appName: z.string(),
  generatedTime: z.number(),
  weightType: z.number(),
  summary: WeightSummarySchema,
  createTime: z.number(),
});

export const WeightHistorySchema = z.object({
  items: z.array(WeightRecordSchema)
});

export type WeightRecord = z.infer<typeof WeightRecordSchema>;
export type WeightHistory = z.infer<typeof WeightHistorySchema>;
