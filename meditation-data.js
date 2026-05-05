/**
 * Curated MEDITATION / STILLNESS breathing timings aligned with how tracks are named under level_1 … level_4.
 * Edit rows here to add or remove presets — no separate generator.
 *
 * Meditation intent:
 *   L1 = effortless calming rhythm (foundation)
 *   L2 = gentle inhale holds for internal stillness
 *   L3 = exhale holds for deep quiet + mind slowing
 *   L4 = balanced stillness (symmetry, minimal movement, maximal awareness)
 *
 * Key principle: prioritize smoothness, silence, and mental stillness over duration.
 */

const MEDITATION_STEPS = {
    1: {
        summary:
            'Inhale and exhale. Focus on slow, silent breathing that naturally settles the mind.',
    },
    2: {
        summary:
            'Inhale, hold, exhale. The hold introduces stillness and awareness without strain.',
    },
    3: {
        summary:
            'Inhale, exhale, hold empty. This creates deeper quiet and mental slowing.',
    },
    4: {
        summary:
            'Inhale, hold, exhale, hold. Designed for deep meditation and sustained awareness.',
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

const MEDITATION_TIMINGS = {
    // Level 1: calming rhythm (foundation)
    1: [
        L1(8, 16),
        L1(10, 20),
        L1(12, 24),
        L1(14, 28),
        L1(16, 32),
    ],

    // Level 2: gentle inhale holds (introduce stillness)
    2: [
        L2(8, 4, 16),
        L2(10, 5, 20),
        L2(12, 6, 24),
        L2(12, 8, 24),
        L2(14, 8, 28),
        L2(14, 10, 28),
    ],

    // Level 3: exhale holds (deeper quiet)
    3: [
        L3(8, 16, 4),
        L3(10, 20, 6),
        L3(12, 24, 6),
        L3(12, 24, 8),
        L3(12, 24, 10),
        L3(14, 28, 10),
        L3(14, 28, 12),
    ],

    // Level 4: full stillness cycles (balanced meditation)
    4: [
        L4(8, 4, 16, 4),
        L4(10, 6, 20, 6),
        L4(12, 6, 24, 6),
        L4(12, 8, 24, 8),
        L4(14, 8, 28, 8),
        L4(14, 10, 28, 10),
    ],
};

window.BREATHING_LIBRARY_MEDITATION = {
    id: 'meditation',
    label: 'Meditation / stillness',
    description: 'Slow, smooth timing aimed at calm and quiet awareness.',
    source: 'meditation-data.js',
    steps: MEDITATION_STEPS,
    timings: MEDITATION_TIMINGS,
};
