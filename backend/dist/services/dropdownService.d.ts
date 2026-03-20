export interface SuburbRow {
    SAL_ID: string;
    Suburb_Name: string;
    SAL_CODE_2021: string;
    State: string;
    Postcode: string;
    Population: number;
    Median_Age: number;
    Median_Income_Weekly: number;
    Median_House_Price: number;
    One_Year_Growth_Pct: number;
    Median_Rent_Weekly: number;
    HH_Size: number;
    School_Count: number;
    Commute_Time_Mins: number;
    Parks_Count: number;
    Rental_Yield_Pct: number;
}
export interface DropdownItem {
    id: string;
    label: string;
    suburb_name: string;
    sal_code_2021: string;
    state: string;
    postcode: string;
    population: number;
    median_age: number;
    median_income: number;
    median_house_price: number;
    one_year_growth: number;
    median_rent: number;
    hh_size: number;
    employment_rate: number;
    school_count: number;
    commute_time: number;
    parks_count: number;
    rental_yield: number;
    all_postcodes: string[];
    ssc: string;
    overall_score?: number;
    rank?: number;
    total_suburbs?: number;
    searchText?: string;
}
/**
 * Get all suburbs for dropdown
 */
export declare function getAllSuburbsForDropdown(state?: string): Promise<DropdownItem[]>;
/**
 * Search suburbs by name or postcode with optional state
 */
export declare function searchSuburbs(query: string, state?: string): Promise<DropdownItem[]>;
/**
 * Get single suburb with all postcode options
 */
export declare function getSuburbWithPostcodes(ssc: string): Promise<DropdownItem & {
    display: string;
    all_postcodes: string[];
} | null>;
export declare function getNearbySuburbs(id: string, postcode: string, state: string): Promise<DropdownItem[]>;
/**
 * Get top ranked suburbs
 */
export declare function getTopRankings(limit?: number, state?: string): Promise<DropdownItem[]>;
//# sourceMappingURL=dropdownService.d.ts.map