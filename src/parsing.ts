import { IResumoAtividade, IDetalheAtividade } from './models/dominio';
import { ExportablePoint } from './types';

const NO_VALUE = -2000000;
const FIX_BIP_GAPS = false;

interface RawTrackData {
    start_time: number;
    end_time: number;
    cost_time: number;
    distance: number;
    times: number[];
    lat: number[];
    lon: number[];
    alt: number[];
    hrtimes: number[];
    hr: number[];
    steptimes: number[];
    stride: number[];
    cadence: number[];
}

interface Position {
    lat: number;
    lon: number;
    alt: number;
}

interface TrackPoint {
    time: number;
    position: Position;
    hr: number | null;
    stride: number | null;
    cadence: number | null;
}

class Interpolate {
    x_list: number[];
    y_list: number[];
    slopes: number[];

    constructor(x_list: number[], y_list: number[]) {
        this.x_list = x_list;
        this.y_list = y_list;

        this.slopes = [];
        for (let i = 0; i < x_list.length - 1; i++) {
            const x1 = x_list[i];
            const x2 = x_list[i + 1];
            const y1 = y_list[i];
            const y2 = y_list[i + 1];

            const den = (x2 - x1) || 1;
            this.slopes.push(Math.floor((y2 - y1) / den));
        }
    }

    getitem(x: number): number {
        // bisect_left implementation
        let i = 0;
        let low = 0;
        let high = this.x_list.length;

        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.x_list[mid] < x) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        i = low - 1;

        if (i >= this.slopes.length) {
            return this.y_list[this.y_list.length - 1]; // last element
        }
        if (i < 0) {
            return this.y_list[0];
        }
        return this.y_list[i] + this.slopes[i] * (x - this.x_list[i]);
    }
}

// Helper para converter string de dados em array de números
function parseStringData(dataStr: string | null | undefined, separator: string = ';', subIndex: number = 0, isSub: boolean = false): number[] {
    if (!dataStr) return [];

    return dataStr.split(separator)
        .filter(val => val !== '')
        .map(val => {
            if (isSub) {
                const parts = val.split(',');
                return parseInt(parts[subIndex] || '0', 10);
            }
            return parseInt(val, 10);
        });
}

function parseTrackData(summary: IResumoAtividade, detail: IDetalheAtividade): RawTrackData {
    // Parsing helpers com lógica específica do python original
    const parseLatLon = (idx: number) => {
        if (!detail.dadosPosicao) return [];
        return detail.dadosPosicao.split(';')
            .filter(v => v)
            .map(v => parseInt(v.split(',')[idx], 10));
    };

    const parseHeartRate = (idx: number, fallback: number | null = null) => {
        if (!detail.dadosFrequenciaCardiaca) return [];
        return detail.dadosFrequenciaCardiaca.split(';')
            .filter(v => v)
            .map(v => {
                const parts = v.split(',');
                const val = parts[idx];
                if (!val && fallback !== null) return fallback;
                return parseInt(val || (fallback !== null ? String(fallback) : '0'), 10);
            });
    };

    const parseGait = (idx: number) => {
        if (!detail.dadosCadencia) return [];
        return detail.dadosCadencia.split(';')
            .filter(v => v)
            .map(v => parseInt(v.split(',')[idx], 10));
    };

    return {
        start_time: parseInt(summary.idRastreamento, 10),
        end_time: Math.floor(summary.horarioFim.getTime() / 1000),
        cost_time: -1,
        distance: summary.distancia,
        times: parseStringData(detail.dadosTempo),
        lat: parseLatLon(0),
        lon: parseLatLon(1),
        alt: parseStringData(detail.dadosAltitude),
        hrtimes: parseHeartRate(0, 1), // Primeiro elemento, fallback 1
        hr: parseHeartRate(1),        // Segundo elemento
        steptimes: parseGait(0),
        stride: parseGait(2),
        cadence: parseGait(3),
    };
}

function accumulateArray(arr: number[]): number[] {
    let sum = 0;
    return arr.map(v => {
        sum += v;
        return sum;
    });
}

function interpolateColumn(data: number[], original_points: number[], new_points: number[]): number[] {
    // Substituir NO_VALUE pelo valor anterior
    let old_value = NO_VALUE;
    // Encontrar primeiro valor válido para usar como old_value incial se o começo for NO_VALUE
    for (const val of data) {
        if (val !== NO_VALUE) {
            // Nota: o python usa o valor que encontrou no loop, mas não define 'old_value' ANTES do loop principal de substituição
            // Na verdade no python ele faz:
            /*
             for old_value in data:
                if old_value != NO_VALUE:
                    break
            */
            // Isso seta old_value para o primeiro válido.
            old_value = val;
            break;
        }
    }

    const cleanedData = [...data];
    for (let i = 0; i < cleanedData.length; i++) {
        if (cleanedData[i] === NO_VALUE) {
            cleanedData[i] = old_value;
        } else {
            old_value = cleanedData[i];
        }
    }

    if (new_points.length === 0) return [];
    if (original_points.length === 0) return new Array(new_points.length).fill(0);
    if (original_points.length === 1) return new Array(new_points.length).fill(original_points[0]);

    const interpolator = new Interpolate(original_points, cleanedData);
    return new_points.map(point => interpolator.getitem(point));
}


function interpolateData(trackData: RawTrackData): RawTrackData {
    let track_times = accumulateArray(trackData.times);
    let hr_times = accumulateArray(trackData.hrtimes);
    let step_times = accumulateArray(trackData.steptimes);

    // FIX_BIP_GAPS logic omitted for simplicity unless requested, logic is complex and flagged false by default

    // Union of all times, sorted
    const timesSet = new Set([...track_times, ...hr_times, ...step_times]);
    const times = Array.from(timesSet).sort((a, b) => a - b);

    // Interpolate all columns to the unified timeline
    const lat = interpolateColumn(accumulateArray(trackData.lat), track_times, times);
    const lon = interpolateColumn(accumulateArray(trackData.lon), track_times, times);
    const alt = interpolateColumn(trackData.alt, track_times, times);

    const hr = interpolateColumn(accumulateArray(trackData.hr), hr_times, times);

    const stride = interpolateColumn(trackData.stride, step_times, times);
    const cadence = interpolateColumn(trackData.cadence, step_times, times);

    return {
        ...trackData,
        times: times,
        lat: lat,
        lon: lon,
        alt: alt,
        hrtimes: times,
        hr: hr,
        steptimes: times,
        stride: stride,
        cadence: cadence
    };
}


export function parsePoints(summary: IResumoAtividade, detail: IDetalheAtividade): ExportablePoint[] {
    const trackData = parseTrackData(summary, detail);

    if (trackData.lat.length === 0) {
        return [];
    }

    const interpolated = interpolateData(trackData);

    const points: ExportablePoint[] = [];

    for (let i = 0; i < interpolated.times.length; i++) {
        const timeOffset = interpolated.times[i];
        // timestamp em segundos: start_time + timeOffset
        const timestamp = interpolated.start_time + timeOffset;

        points.push({
            time: new Date(timestamp * 1000), // JS Date usa ms
            latitude: interpolated.lat[i] / 100000000,
            longitude: interpolated.lon[i] / 100000000,
            altitude: interpolated.alt[i] / 100, // TODO: Verificar se altitude precisa de escala, no python é /100
            heart_rate: interpolated.hr[i],
            cadence: interpolated.cadence[i]
            // stride omitido pois não está na interface ExportablePoint do original exportada pelo geopandas, mas pode ser útil
        });
    }

    return points;
}
