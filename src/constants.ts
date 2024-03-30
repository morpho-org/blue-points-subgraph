import { BigInt } from "@graphprotocol/graph-ts";

export const ONE_YEAR = BigInt.fromString("31536000");
export const PRECISION = BigInt.fromString("10").pow(36 as u8);

// Rate = 1e18 points per second emited over the market.
export const POINTS_RATE_PER_SECONDS = BigInt.fromString("1000000000000000000");
