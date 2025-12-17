import { WorkoutSummary, ExportablePoint } from '../types';
import * as fs from 'fs-extra';

export interface BaseExporter {
    getSupportedFileFormats(): string[];
    export(outputFilePath: string, summary: WorkoutSummary, points: ExportablePoint[]): Promise<void>;
}
