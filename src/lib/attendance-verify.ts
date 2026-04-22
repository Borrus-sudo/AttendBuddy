import { createHash } from "node:crypto";
import { Jimp, compareHashes } from "jimp";

function stableHash(input: string): string {
    return createHash("sha256").update(input).digest("hex");
}

function parseDataUrlBase64(value: string): Buffer {
    const trimmed = value.trim();
    const payload = trimmed.includes(",") ? trimmed.split(",")[1]! : trimmed;
    return Buffer.from(payload, "base64");
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new Error("Could not download reference profile image.");
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export function hashVerificationToken(token: string): string {
    return stableHash(token);
}

export async function verifySelfieAgainstReference(input: {
    selfieBase64: string;
    referenceImageUrl: string | null;
    minScore: number;
}): Promise<{
    ok: boolean;
    confidence: number;
    reason?: string;
}> {
    const { selfieBase64, referenceImageUrl, minScore } = input;

    if (!referenceImageUrl) {
        return {
            ok: false,
            confidence: 0,
            reason: "No profile photo found for this account.",
        };
    }

    let sourceBytes: Buffer;
    let targetBytes: Buffer;

    try {
        sourceBytes = parseDataUrlBase64(selfieBase64);
        targetBytes = await fetchImageBuffer(referenceImageUrl);
    } catch {
        return {
            ok: false,
            confidence: 0,
            reason: "Invalid selfie image or profile photo URL.",
        };
    }

    try {
        const selfieImage = await Jimp.read(sourceBytes);
        const referenceImage = await Jimp.read(targetBytes);

        const selfieHash = selfieImage.hash();
        const referenceHash = referenceImage.hash();
        const confidence = Math.max(
            0,
            Math.min(1, 1 - compareHashes(selfieHash, referenceHash)),
        );

        return {
            ok: confidence >= minScore,
            confidence,
            ...(confidence >= minScore
                ? {}
                : { reason: "Face does not match profile photo." }),
        };
    } catch (e) {
        console.log(e);
        return {
            ok: false,
            confidence: 0,
            reason: "Could not process images for local face matching.",
        };
    }
}
