import { BaseExporter } from './index';
import { WorkoutSummary, ExportablePoint } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

export class GeoJsonExporter implements BaseExporter {
    getSupportedFileFormats(): string[] {
        return ['geojson'];
    }

    async export(outputFilePath: string, summary: WorkoutSummary, points: ExportablePoint[]): Promise<void> {
        const featureCollection = {
            type: "FeatureCollection",
            features: points.map(p => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [p.longitude, p.latitude, p.altitude || 0]
                },
                properties: {
                    time: p.time.toISOString(),
                    heart_rate: p.heart_rate,
                    cadence: p.cadence,
                    track_id: summary.trackid
                }
            }))
        };

        // Adiciona uma Feature LineString para o trajeto completo
        const lineStringFeature = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: points.map(p => [p.longitude, p.latitude, p.altitude || 0])
            },
            properties: {
                type: "track",
                track_id: summary.trackid,
                start_time: points[0]?.time.toISOString(),
                end_time: points[points.length - 1]?.time.toISOString()
            }
        };

        featureCollection.features.push(lineStringFeature as any);

        await fs.writeJson(outputFilePath, featureCollection, { spaces: 2 });
    }
}
