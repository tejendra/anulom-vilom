/**
 * Curated ATHLETIC PERFORMANCE breathing timings aligned with how tracks are named under level_1 … level_4.
 * Edit rows here to add or remove presets — no separate generator.
 *
 * Athletic intent (real-world carryover):
 *   L1 = rhythm + aerobic efficiency (usable during easy movement)
 *   L2 = controlled inhale holds without disrupting flow
 *   L3 = light CO₂ exposure while maintaining rhythm (not extreme)
 *   L4 = composure + control under stress (balanced, transferable)
 *
 * Key principle: NO extreme breath holds. Everything must stay smooth, repeatable, and usable while moving.
 */

const REAL_WORLD_STEPS = {
    1: {
        summary:
            'Inhale and exhale. Focus on smooth, rhythmic breathing that can transfer directly to walking/running.',
    },
    2: {
        summary:
            'Inhale, short hold, exhale. Builds control without breaking movement rhythm.',
    },
    3: {
        summary:
            'Inhale, exhale, short hold. Adds mild CO₂ stress while preserving flow.',
    },
    4: {
        summary:
            'Inhale, hold, exhale, hold. Builds composure under stress while staying smooth.',
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

const REAL_WORLD_TIMINGS = {
    // Level 1: rhythm + efficiency (directly transferable to running cadence)
    1: [
        L1(8, 16),
        L1(10, 20),
        L1(12, 24),
        L1(13, 26),
        L1(14, 28),
        L1(15, 30),
    ],

    // Level 2: light inhale holds (control without disrupting flow)
    2: [
        L2(8, 2, 16),
        L2(10, 3, 20),
        L2(12, 4, 24),
        L2(12, 5, 24),
        L2(14, 5, 28),
        L2(14, 6, 28),
        L2(15, 6, 30),
    ],

    // Level 3: mild CO₂ + rhythm (keep holds short to stay athletic)
    3: [
        L3(8, 16, 3),
        L3(10, 20, 4),
        L3(12, 24, 4),
        L3(12, 24, 5),
        L3(12, 24, 6),
        L3(14, 28, 6),
        L3(14, 28, 8),
        L3(15, 30, 8),
    ],

    // Level 4: composure under stress (balanced, not extreme)
    4: [
        L4(8, 3, 16, 3),
        L4(10, 4, 20, 4),
        L4(12, 4, 24, 4),
        L4(12, 6, 24, 6),
        L4(14, 6, 28, 6),
        L4(14, 8, 28, 6),
        L4(15, 8, 30, 8),
    ],
};

window.BREATHING_LIBRARY_REAL_WORLD = {
    id: 'realWorld',
    label: 'Real-world / athletic',
    description: 'Rhythm and control you can use while moving — no extreme holds.',
    source: 'real-world-data.js',
    steps: REAL_WORLD_STEPS,
    timings: REAL_WORLD_TIMINGS,
};
