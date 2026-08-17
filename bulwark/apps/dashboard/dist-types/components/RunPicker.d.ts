export interface RunListItem {
    readonly id: string;
    readonly status: string;
    readonly reportUrl: string;
    readonly label?: string;
    readonly configName?: string;
    readonly detector?: string;
    readonly generatedAt?: string;
    readonly target?: {
        readonly url: string;
    };
    readonly summary?: {
        readonly passed: boolean;
        readonly totalDefects: number;
        readonly matchedElementCount: number;
        readonly designElementCount: number;
        readonly matchRate: number;
    };
    readonly durationMs?: number;
}
export interface RunPickerProps {
    readonly selectedReportUrl: string;
    readonly onSelect: (reportUrl: string) => void;
}
export declare function RunPicker({ selectedReportUrl, onSelect }: RunPickerProps): import("react").JSX.Element;
//# sourceMappingURL=RunPicker.d.ts.map