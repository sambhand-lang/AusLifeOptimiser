import { SA2Boundary } from './sa2Validator';
interface Metric {
    value: number;
    source: string;
    datasetYear: number;
    type: 'official_dataset' | 'derived_metric';
    reliability?: 'official_census_data' | 'verified_spatial_count' | 'routing_api_calculated';
    methodology?: string;
}
export interface DataIntegrity {
    absSource: string;
    asgsVersion: string;
    mappingVerified: boolean;
    multiSA2: boolean;
    aggregationMethod: string;
    sa2Codes?: string[];
    coveragePercents?: number[];
}
export interface SuburbRealData {
    population?: Metric | null;
    medianAge?: Metric | null;
    householdSize?: Metric | null;
    employmentRate?: Metric | null;
    medianIncome?: Metric | null;
    commute?: {
        drivingTimeMinutes?: Metric | null;
    } | null;
    schools?: {
        count?: Metric | null;
    } | null;
    publicTransportStops?: Metric | null;
    parks?: Metric | null;
    dataIntegrity?: DataIntegrity | null;
}
export declare class ExternalDataService {
    private static weightedAverage;
    private static getSA2Record;
    private static aggregateMultiSA2Metrics;
    static getAbsRecord(suburbName: string, state: string): any;
    static getAbsMetrics(suburbName: string, state: string, sa2Mapping?: SA2Boundary | null): Promise<{
        population?: number;
        medianAge?: number;
        householdSize?: number;
        employmentRate?: number;
        medianIncome?: number;
    }>;
    static getSchoolCount(suburbName: string, state: string): Promise<number | null>;
    static getCommuteTime(origin: string, destination?: string): Promise<number | null>;
    static getPublicTransportStops(suburbName: string, state: string): Promise<number | null>;
    static getParksCount(suburbName: string, state: string): Promise<number | null>;
    static getSuburbRealData(suburbName: string, state: string, postcode: string): Promise<SuburbRealData>;
}
export {};
//# sourceMappingURL=externalDataService.d.ts.map