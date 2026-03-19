export type Tier = number;

export const CLOSED_TIER = 7;

export const tierName: Record<Tier, string> = {
    0: "此生必吃",
    1: "贊不絕口",
    2: "值得一試",
    3: "家常風味",
    4: "將就果腹",
    5: "難以下嚥",
    6: "犬不爭食",
    7: "屍骨未寒",
};

export const tierColor: Record<Tier, string> = {
    0: "#d73027",
    1: "#f46d43",
    2: "#fee08b",
    3: "#66bd63",
    4: "#1a6698",
    5: "#542788",
    6: "#000000",
    7: "#8d99a6",
};

export function tierBadge(tier: Tier): string {
    return tier === CLOSED_TIER ? "EX" : `T${tier}`;
}

export function compareTierDescending(left: Tier, right: Tier): number {
    if (left === CLOSED_TIER && right !== CLOSED_TIER) {
        return 1;
    }

    if (right === CLOSED_TIER && left !== CLOSED_TIER) {
        return -1;
    }

    return right - left;
}
