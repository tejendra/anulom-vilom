/**
 * Curated CO₂-tolerance breathing timings aligned with how tracks are named under level_1 … level_4.
 * Edit rows here to add or remove presets — no separate generator.
 *
 * CO₂ tolerance intent:
 *   L1 = long-exhale base and warmup
 *   L2 = full-lung hold control before introducing harder empty holds
 *   L3 = primary CO₂ tolerance ladder via empty-lung holds
 *   L4 = advanced tolerance with both full and empty holds
 *
 * Filename patterns (for matching your MP3s):
 *   L1  In-Out … (inh-exh)
 *   L2  In-Hold-Out … (inh - hold - exh)
 *   L3  In-Out-Hold … (inh - exh - hold after exhale)
 *   L4  In-Hold-Out-Hold … (inh - hold - exh - hold)
 */

const CO2_STEPS = {
    1: {
        summary:
            'Inhale and exhale',
    },
    2: {
        summary:
            'Inhale, hold (lungs full), exhale. Builds retention control with less air-hunger stress than empty holds.',
    },
    3: {
        summary:
            'Inhale, exhale, then hold empty before the next inhale. This is the primary CO₂-tolerance progression level.',
    },
    4: {
        summary:
            'Inhale, hold, exhale, hold. Use after Level 3 feels steady; this adds full-lung control while keeping the empty hold as the main tolerance stimulus.',
    },
};

function L1(i, e) {
    return {
        inhale: i,
        holdIn: 0,
        exhale: e,
        holdOut: 0,
        label: `${i} / ${e}`,
    };
}

function L2(a, b, c) {
    return {
        inhale: a,
        holdIn: b,
        exhale: c,
        holdOut: 0,
        label: `${a} · ${b} · ${c}`,
    };
}

function L3(a, b, c) {
    return {
        inhale: a,
        holdIn: 0,
        exhale: b,
        holdOut: c,
        label: `${a} · ${b} · ${c}`,
    };
}

function L4(a, b, c, d) {
    return {
        inhale: a,
        holdIn: b,
        exhale: c,
        holdOut: d,
        label: `${a} · ${b} · ${c} · ${d}`,
    };
}

const CO2_TIMINGS = {
    // Level 1: CO₂ base / warmup.
    // Build comfort with long exhales before adding retention.
    1: [
        L1(8, 16),
        L1(10, 20),
        L1(12, 24),
        L1(13, 26),
        L1(14, 28),
        L1(15, 30),
        L1(16, 32),
        L1(18, 36),
    ],

    // Level 2: full-lung hold control.
    // Useful preparation for retention without the stronger air hunger of empty holds.
    2: [
        L2(8, 2, 16),
        L2(10, 3, 20),
        L2(12, 4, 24),
        L2(12, 6, 24),
        L2(12, 8, 24),
        L2(12, 10, 24),
        L2(14, 6, 28),
        L2(14, 8, 28),
        L2(14, 10, 28),
        L2(15, 10, 30),
        L2(16, 12, 32),
    ],

    // Level 3: primary CO₂ tolerance ladder.
    // Empty holds are the main stimulus. Progress only when the next inhale stays calm, not gasped.
    3: [
        L3(8, 16, 4),
        L3(10, 20, 4),
        L3(12, 24, 4),
        L3(12, 24, 6),
        L3(12, 24, 8),
        L3(12, 24, 10),
        L3(12, 24, 12),
        L3(12, 24, 15),
        L3(14, 28, 10),
        L3(14, 28, 12),
        L3(14, 28, 15),
        L3(14, 28, 18),
        L3(15, 30, 18),
        L3(15, 30, 20),
        L3(16, 32, 20),
        L3(16, 32, 24),
    ],

    // Level 4: advanced CO₂ tolerance.
    // Adds an inhale hold while keeping the post-exhale hold prominent.
    4: [
        L4(8, 2, 16, 4),
        L4(10, 3, 20, 5),
        L4(12, 4, 24, 6),
        L4(12, 6, 24, 8),
        L4(12, 8, 24, 10),
        L4(12, 10, 24, 12),
        L4(14, 6, 28, 10),
        L4(14, 8, 28, 12),
        L4(14, 10, 28, 15),
        L4(14, 12, 28, 18),
        L4(15, 10, 30, 18),
        L4(15, 12, 30, 20),
        L4(16, 12, 32, 20),
        L4(16, 14, 32, 24),
    ],
};

window.BREATHING_LIBRARY_CO2 = {
    id: 'co2',
    label: 'CO₂ tolerance',
    description: 'Longer exhales and holds to build CO₂ comfort — progress carefully.',
    source: 'co2-data.js',
    steps: CO2_STEPS,
    timings: CO2_TIMINGS,
};
