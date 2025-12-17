import { BaseExporter } from './index';
import { WorkoutSummary, ExportablePoint } from '../types';
import * as fs from 'fs-extra';
import { create } from 'xmlbuilder2';

export class GpxExporter implements BaseExporter {
    getSupportedFileFormats(): string[] {
        return ['gpx'];
    }

    async export(outputFilePath: string, summary: WorkoutSummary, points: ExportablePoint[]): Promise<void> {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('gpx', {
                version: '1.1',
                creator: 'Mi Fit & Zepp Exporter TS',
                'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                'xmlns': 'http://www.topografix.com/GPX/1/1',
                'xsi:schemaLocation': 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd',
                'xmlns:gpxtpx': 'http://www.garmin.com/xmlschemas/TrackPointExtension/v1'
            });

        const trk = root.ele('trk');
        trk.ele('name').txt(`Workout ${summary.trackid}`);
        trk.ele('type').txt(String(summary.type));

        const trkseg = trk.ele('trkseg');

        for (const p of points) {
            const trkpt = trkseg.ele('trkpt', { lat: String(p.latitude), lon: String(p.longitude) });

            if (p.altitude !== null) {
                trkpt.ele('ele').txt(String(p.altitude));
            }

            trkpt.ele('time').txt(p.time.toISOString());

            if (p.heart_rate !== null || p.cadence !== null) {
                const extensions = trkpt.ele('extensions');
                const tpx = extensions.ele('gpxtpx:TrackPointExtension');

                if (p.heart_rate !== null) {
                    tpx.ele('gpxtpx:hr').txt(String(p.heart_rate));
                }
                if (p.cadence !== null) {
                    tpx.ele('gpxtpx:cad').txt(String(p.cadence));
                }
            }
        }

        const xml = root.end({ prettyPrint: true });
        await fs.writeFile(outputFilePath, xml);
    }
}
