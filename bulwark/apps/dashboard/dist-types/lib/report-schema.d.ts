import { z } from 'zod';
/**
 * Validation of `report.json` at the dashboard boundary.
 *
 * The dashboard is handed a file produced by a separate process, possibly an older
 * one. Validating on load turns a schema drift into one clear message instead of a
 * blank overlay and a console full of undefined property reads.
 */
declare const boxSchema: z.ZodObject<{
    xMin: z.ZodNumber;
    yMin: z.ZodNumber;
    xMax: z.ZodNumber;
    yMax: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
}, {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
}>;
export declare const defectTypeSchema: z.ZodEnum<["spacing", "position", "missing-element", "unexpected-element", "font-size", "font-weight", "font-family", "color"]>;
export declare const defectSeveritySchema: z.ZodEnum<["error", "warning", "info"]>;
export declare const defectSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["spacing", "position", "missing-element", "unexpected-element", "font-size", "font-weight", "font-family", "color"]>;
    severity: z.ZodEnum<["error", "warning", "info"]>;
    message: z.ZodString;
    designBox: z.ZodOptional<z.ZodObject<{
        xMin: z.ZodNumber;
        yMin: z.ZodNumber;
        xMax: z.ZodNumber;
        yMax: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }>>;
    liveBox: z.ZodOptional<z.ZodObject<{
        xMin: z.ZodNumber;
        yMin: z.ZodNumber;
        xMax: z.ZodNumber;
        yMax: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }>>;
    designElementId: z.ZodOptional<z.ZodString>;
    liveElementId: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    type: z.ZodEnum<["spacing", "position", "missing-element", "unexpected-element", "font-size", "font-weight", "font-family", "color"]>;
    severity: z.ZodEnum<["error", "warning", "info"]>;
    message: z.ZodString;
    designBox: z.ZodOptional<z.ZodObject<{
        xMin: z.ZodNumber;
        yMin: z.ZodNumber;
        xMax: z.ZodNumber;
        yMax: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }>>;
    liveBox: z.ZodOptional<z.ZodObject<{
        xMin: z.ZodNumber;
        yMin: z.ZodNumber;
        xMax: z.ZodNumber;
        yMax: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }>>;
    designElementId: z.ZodOptional<z.ZodString>;
    liveElementId: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    type: z.ZodEnum<["spacing", "position", "missing-element", "unexpected-element", "font-size", "font-weight", "font-family", "color"]>;
    severity: z.ZodEnum<["error", "warning", "info"]>;
    message: z.ZodString;
    designBox: z.ZodOptional<z.ZodObject<{
        xMin: z.ZodNumber;
        yMin: z.ZodNumber;
        xMax: z.ZodNumber;
        yMax: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }>>;
    liveBox: z.ZodOptional<z.ZodObject<{
        xMin: z.ZodNumber;
        yMin: z.ZodNumber;
        xMax: z.ZodNumber;
        yMax: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }, {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    }>>;
    designElementId: z.ZodOptional<z.ZodString>;
    liveElementId: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const reportSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    runId: z.ZodString;
    generatedAt: z.ZodString;
    target: z.ZodObject<{
        url: z.ZodString;
        viewport: z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
            deviceScaleFactor: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            height: number;
            width: number;
            deviceScaleFactor: number;
        }, {
            height: number;
            width: number;
            deviceScaleFactor: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        viewport: {
            height: number;
            width: number;
            deviceScaleFactor: number;
        };
    }, {
        url: string;
        viewport: {
            height: number;
            width: number;
            deviceScaleFactor: number;
        };
    }>;
    surfaces: z.ZodObject<{
        design: z.ZodObject<{
            imagePath: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
            imageSha256: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        }, {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        }>;
        live: z.ZodObject<{
            imagePath: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
            imageSha256: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        }, {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        design: {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        };
        live: {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        };
    }, {
        design: {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        };
        live: {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        };
    }>;
    tolerances: z.ZodObject<{
        spacingPx: z.ZodNumber;
        positionPx: z.ZodNumber;
        fontSizePx: z.ZodNumber;
        deltaE: z.ZodNumber;
        minFamilyMargin: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        spacingPx: number;
        positionPx: number;
        fontSizePx: number;
        deltaE: number;
        minFamilyMargin: number;
    }, {
        spacingPx: number;
        positionPx: number;
        fontSizePx: number;
        deltaE: number;
        minFamilyMargin: number;
    }>;
    summary: z.ZodObject<{
        passed: z.ZodBoolean;
        totalDefects: z.ZodNumber;
        bySeverity: z.ZodRecord<z.ZodString, z.ZodNumber>;
        byType: z.ZodRecord<z.ZodString, z.ZodNumber>;
        designElementCount: z.ZodNumber;
        liveElementCount: z.ZodNumber;
        matchedElementCount: z.ZodNumber;
        matchRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        passed: boolean;
        totalDefects: number;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
        designElementCount: number;
        liveElementCount: number;
        matchedElementCount: number;
        matchRate: number;
    }, {
        passed: boolean;
        totalDefects: number;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
        designElementCount: number;
        liveElementCount: number;
        matchedElementCount: number;
        matchRate: number;
    }>;
    defects: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["spacing", "position", "missing-element", "unexpected-element", "font-size", "font-weight", "font-family", "color"]>;
        severity: z.ZodEnum<["error", "warning", "info"]>;
        message: z.ZodString;
        designBox: z.ZodOptional<z.ZodObject<{
            xMin: z.ZodNumber;
            yMin: z.ZodNumber;
            xMax: z.ZodNumber;
            yMax: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }>>;
        liveBox: z.ZodOptional<z.ZodObject<{
            xMin: z.ZodNumber;
            yMin: z.ZodNumber;
            xMax: z.ZodNumber;
            yMax: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }>>;
        designElementId: z.ZodOptional<z.ZodString>;
        liveElementId: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        type: z.ZodEnum<["spacing", "position", "missing-element", "unexpected-element", "font-size", "font-weight", "font-family", "color"]>;
        severity: z.ZodEnum<["error", "warning", "info"]>;
        message: z.ZodString;
        designBox: z.ZodOptional<z.ZodObject<{
            xMin: z.ZodNumber;
            yMin: z.ZodNumber;
            xMax: z.ZodNumber;
            yMax: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }>>;
        liveBox: z.ZodOptional<z.ZodObject<{
            xMin: z.ZodNumber;
            yMin: z.ZodNumber;
            xMax: z.ZodNumber;
            yMax: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }>>;
        designElementId: z.ZodOptional<z.ZodString>;
        liveElementId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        type: z.ZodEnum<["spacing", "position", "missing-element", "unexpected-element", "font-size", "font-weight", "font-family", "color"]>;
        severity: z.ZodEnum<["error", "warning", "info"]>;
        message: z.ZodString;
        designBox: z.ZodOptional<z.ZodObject<{
            xMin: z.ZodNumber;
            yMin: z.ZodNumber;
            xMax: z.ZodNumber;
            yMax: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }>>;
        liveBox: z.ZodOptional<z.ZodObject<{
            xMin: z.ZodNumber;
            yMin: z.ZodNumber;
            xMax: z.ZodNumber;
            yMax: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }>>;
        designElementId: z.ZodOptional<z.ZodString>;
        liveElementId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    measurements: z.ZodObject<{
        designElements: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            surface: z.ZodEnum<["design", "live"]>;
            box: z.ZodObject<{
                xMin: z.ZodNumber;
                yMin: z.ZodNumber;
                xMax: z.ZodNumber;
                yMax: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            }, {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            }>;
            kind: z.ZodString;
            label: z.ZodString;
            text: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }, {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }>, "many">;
        liveElements: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            surface: z.ZodEnum<["design", "live"]>;
            box: z.ZodObject<{
                xMin: z.ZodNumber;
                yMin: z.ZodNumber;
                xMax: z.ZodNumber;
                yMax: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            }, {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            }>;
            kind: z.ZodString;
            label: z.ZodString;
            text: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }, {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }>, "many">;
        pairs: z.ZodArray<z.ZodObject<{
            designElementId: z.ZodString;
            liveElementId: z.ZodString;
            centerOffset: z.ZodObject<{
                dx: z.ZodNumber;
                dy: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                dx: number;
                dy: number;
            }, {
                dx: number;
                dy: number;
            }>;
            centerDistance: z.ZodNumber;
            iou: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            designElementId: string;
            liveElementId: string;
            centerOffset: {
                dx: number;
                dy: number;
            };
            centerDistance: number;
            iou: number;
        }, {
            designElementId: string;
            liveElementId: string;
            centerOffset: {
                dx: number;
                dy: number;
            };
            centerDistance: number;
            iou: number;
        }>, "many">;
        spacing: z.ZodArray<z.ZodUnknown, "many">;
        typography: z.ZodArray<z.ZodUnknown, "many">;
        colors: z.ZodArray<z.ZodUnknown, "many">;
    }, "strip", z.ZodTypeAny, {
        spacing: unknown[];
        designElements: {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }[];
        liveElements: {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }[];
        pairs: {
            designElementId: string;
            liveElementId: string;
            centerOffset: {
                dx: number;
                dy: number;
            };
            centerDistance: number;
            iou: number;
        }[];
        typography: unknown[];
        colors: unknown[];
    }, {
        spacing: unknown[];
        designElements: {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }[];
        liveElements: {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }[];
        pairs: {
            designElementId: string;
            liveElementId: string;
            centerOffset: {
                dx: number;
                dy: number;
            };
            centerDistance: number;
            iou: number;
        }[];
        typography: unknown[];
        colors: unknown[];
    }>;
    diagnostics: z.ZodObject<{
        warnings: z.ZodArray<z.ZodString, "many">;
        detector: z.ZodString;
        textRecognizer: z.ZodString;
        durationMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        warnings: string[];
        detector: string;
        textRecognizer: string;
        durationMs: number;
    }, {
        warnings: string[];
        detector: string;
        textRecognizer: string;
        durationMs: number;
    }>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: 1;
    runId: string;
    generatedAt: string;
    target: {
        url: string;
        viewport: {
            height: number;
            width: number;
            deviceScaleFactor: number;
        };
    };
    surfaces: {
        design: {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        };
        live: {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        };
    };
    tolerances: {
        spacingPx: number;
        positionPx: number;
        fontSizePx: number;
        deltaE: number;
        minFamilyMargin: number;
    };
    summary: {
        passed: boolean;
        totalDefects: number;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
        designElementCount: number;
        liveElementCount: number;
        matchedElementCount: number;
        matchRate: number;
    };
    defects: z.objectOutputType<{
        id: z.ZodString;
        type: z.ZodEnum<["spacing", "position", "missing-element", "unexpected-element", "font-size", "font-weight", "font-family", "color"]>;
        severity: z.ZodEnum<["error", "warning", "info"]>;
        message: z.ZodString;
        designBox: z.ZodOptional<z.ZodObject<{
            xMin: z.ZodNumber;
            yMin: z.ZodNumber;
            xMax: z.ZodNumber;
            yMax: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }>>;
        liveBox: z.ZodOptional<z.ZodObject<{
            xMin: z.ZodNumber;
            yMin: z.ZodNumber;
            xMax: z.ZodNumber;
            yMax: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }>>;
        designElementId: z.ZodOptional<z.ZodString>;
        liveElementId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">[];
    measurements: {
        spacing: unknown[];
        designElements: {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }[];
        liveElements: {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }[];
        pairs: {
            designElementId: string;
            liveElementId: string;
            centerOffset: {
                dx: number;
                dy: number;
            };
            centerDistance: number;
            iou: number;
        }[];
        typography: unknown[];
        colors: unknown[];
    };
    diagnostics: {
        warnings: string[];
        detector: string;
        textRecognizer: string;
        durationMs: number;
    };
}, {
    schemaVersion: 1;
    runId: string;
    generatedAt: string;
    target: {
        url: string;
        viewport: {
            height: number;
            width: number;
            deviceScaleFactor: number;
        };
    };
    surfaces: {
        design: {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        };
        live: {
            height: number;
            width: number;
            imagePath: string;
            imageSha256: string;
        };
    };
    tolerances: {
        spacingPx: number;
        positionPx: number;
        fontSizePx: number;
        deltaE: number;
        minFamilyMargin: number;
    };
    summary: {
        passed: boolean;
        totalDefects: number;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
        designElementCount: number;
        liveElementCount: number;
        matchedElementCount: number;
        matchRate: number;
    };
    defects: z.objectInputType<{
        id: z.ZodString;
        type: z.ZodEnum<["spacing", "position", "missing-element", "unexpected-element", "font-size", "font-weight", "font-family", "color"]>;
        severity: z.ZodEnum<["error", "warning", "info"]>;
        message: z.ZodString;
        designBox: z.ZodOptional<z.ZodObject<{
            xMin: z.ZodNumber;
            yMin: z.ZodNumber;
            xMax: z.ZodNumber;
            yMax: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }>>;
        liveBox: z.ZodOptional<z.ZodObject<{
            xMin: z.ZodNumber;
            yMin: z.ZodNumber;
            xMax: z.ZodNumber;
            yMax: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }, {
            xMin: number;
            yMin: number;
            xMax: number;
            yMax: number;
        }>>;
        designElementId: z.ZodOptional<z.ZodString>;
        liveElementId: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">[];
    measurements: {
        spacing: unknown[];
        designElements: {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }[];
        liveElements: {
            id: string;
            surface: "design" | "live";
            box: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            kind: string;
            label: string;
            text?: string | undefined;
            confidence?: number | undefined;
        }[];
        pairs: {
            designElementId: string;
            liveElementId: string;
            centerOffset: {
                dx: number;
                dy: number;
            };
            centerDistance: number;
            iou: number;
        }[];
        typography: unknown[];
        colors: unknown[];
    };
    diagnostics: {
        warnings: string[];
        detector: string;
        textRecognizer: string;
        durationMs: number;
    };
}>;
export type DashboardReport = z.infer<typeof reportSchema>;
export type DashboardDefect = z.infer<typeof defectSchema>;
export type DashboardBox = z.infer<typeof boxSchema>;
export type DefectType = z.infer<typeof defectTypeSchema>;
export type DefectSeverity = z.infer<typeof defectSeveritySchema>;
export interface ReportParseFailure {
    readonly ok: false;
    readonly message: string;
    readonly issues: readonly string[];
}
export interface ReportParseSuccess {
    readonly ok: true;
    readonly report: DashboardReport;
}
export declare function parseReport(input: unknown): ReportParseSuccess | ReportParseFailure;
export {};
//# sourceMappingURL=report-schema.d.ts.map