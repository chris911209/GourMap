export type Tier = number;

export const CLOSED_TIER = 7;
export const CONTROVERSIAL_TIER = 8;

export const tierName: Record<Tier, string> = {
    0: "此生必吃",
    1: "贊不絕口",
    2: "值得一試",
    3: "家常風味",
    4: "將就果腹",
    5: "味同嚼蠟",
    6: "犬不爭食",
    7: "屍骨未寒",
    8: "眾說紛紜",
};

export const tierColor: Record<Tier, string> = {
    0: "#d73027",
    1: "#f46d43",
    2: "#fdcf4f",
    3: "#66bd63",
    4: "#1a6698",
    5: "#542788",
    6: "#000000",
    7: "#8d99a6",
    8: "#b07aa1",
};

export function tierBadge(tier: Tier): string {
    if (tier === CLOSED_TIER) {
        return "XX";
    }

    if (tier === CONTROVERSIAL_TIER) {
        return "MX";
    }

    return `T${tier}`;
}

export function compareTierDescending(left: Tier, right: Tier): number {
    const isLeftSpecial = left === CLOSED_TIER || left === CONTROVERSIAL_TIER;
    const isRightSpecial = right === CLOSED_TIER || right === CONTROVERSIAL_TIER;

    if (isLeftSpecial && !isRightSpecial) {
        return 1;
    }

    if (isRightSpecial && !isLeftSpecial) {
        return -1;
    }

    if (left === CONTROVERSIAL_TIER && right === CLOSED_TIER) {
        return -1;
    }

    if (left === CLOSED_TIER && right === CONTROVERSIAL_TIER) {
        return 1;
    }

    return right - left;
}
