import { keccak256, stringToHex } from "viem";

type PolicyHumanResponse = {
  identifier?: string;
  nullifier?: string;
  signal_hash?: string;
};

type VerifiedPolicyHumanResult = {
  identifier?: string;
  success?: boolean;
};

export type PolicyHumanIdentifier = "orb" | "proof_of_human";
export type PolicyHumanVerificationIdentifier = PolicyHumanIdentifier | "face";

export function normalizeNullifier(nullifier: string) {
  return BigInt(nullifier).toString(10);
}

export function selectPolicyHumanResponse(
  responses: readonly PolicyHumanResponse[],
  expectedSignalHash: string,
  expectedIdentifier: PolicyHumanVerificationIdentifier | readonly PolicyHumanVerificationIdentifier[]
) {
  const normalizedSignalHash = expectedSignalHash.toLowerCase();
  const expectedIdentifiers = typeof expectedIdentifier === "string"
    ? [expectedIdentifier.toLowerCase()]
    : expectedIdentifier.map((identifier) => identifier.toLowerCase());

  return responses.find(
    (response) =>
      typeof response.identifier === "string" &&
      expectedIdentifiers.includes(response.identifier.toLowerCase()) &&
      typeof response.nullifier === "string" &&
      response.nullifier.length > 0 &&
      response.signal_hash?.toLowerCase() === normalizedSignalHash
  );
}

export function derivePolicyNullifier({ action, nullifier }: { action: string; nullifier: string }) {
  const normalizedNullifier = normalizeNullifier(nullifier);

  return {
    nullifier: normalizedNullifier,
    nullifierHash: keccak256(stringToHex(`${action}:${normalizedNullifier}`))
  };
}

export function hasVerifiedPolicyHumanResult(
  results: readonly VerifiedPolicyHumanResult[],
  identifier: string
) {
  const normalizedIdentifier = identifier.toLowerCase();

  return results.some(
    (result) =>
      result.success === true &&
      result.identifier?.toLowerCase() === normalizedIdentifier
  );
}
