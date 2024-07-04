import { Bytes, ethereum, log } from "@graphprotocol/graph-ts";

export namespace EventType {
  export const SUPPLY = "SUPPLY";

  export const BORROW = "BORROW";

  export const COLLATERAL = "COLLATERAL";

  export const ACCRUE_INTEREST = "ACCRUE_INTEREST";
}

export function generateLogId(event: ethereum.Event): Bytes {
  // Pad to 32 bytes the log index
  const value = ethereum.Value.fromSignedBigInt(event.logIndex);

  const logIndex = ethereum.encode(value);
  if (!logIndex) {
    log.critical("Log index is null", []);
    return Bytes.fromUTF8("");
  }

  return event.transaction.hash.concat(logIndex);
}
