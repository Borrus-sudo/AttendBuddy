import { createHash } from "node:crypto";
import { Jimp, compareHashes } from "jimp";

function stableHash(input: string): string {
    return createHash("sha256").update(input).digest("hex");
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

    let targetBytes: Buffer;

    try {
        targetBytes = await fetchImageBuffer(referenceImageUrl);
    } catch (e: any) {
        return {
            ok: false,
            confidence: 0,
            reason: `Could not fetch profile photo: ${e.message || "Unknown error"}`,
        };
    }

    try {
        const referenceBase64 = targetBytes.toString("base64");
        const serverUrl = process.env.FACE_MATCHING_SERVER || "http://127.0.0.1:8000";
        
        const response = await fetch(`${serverUrl}/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                selfie_base64: selfieBase64,
                reference_image_base64: referenceBase64
            }),
            signal: AbortSignal.timeout(30_000)
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => null) as { reason?: string } | null;
            return {
                ok: false,
                confidence: 0,
                reason: errBody?.reason || "Face verification server returned an error.",
            };
        }

        const data = await response.json() as { ok: boolean; confidence: number; reason?: string };
        return {
            ok: Boolean(data.ok),
            confidence: Number(data.confidence) || 0,
            ...(data.ok ? {} : { reason: data.reason || "Face does not match profile photo." }),
        };
    } catch (e) {
        console.log("DeepFace Verification Error:", e);
        return {
            ok: false,
            confidence: 0,
            reason: "Could not communicate with the face matching server.",
        };
    }
}
