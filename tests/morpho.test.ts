import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly";

import { Bytes, BigInt } from "@graphprotocol/graph-ts";

import { Market, MorphoFeeRecipient, MorphoTx } from "../generated/schema";
import { handleAccrueInterest } from "../src/handlers/morpho";
import { generateLogId, PositionType } from "../src/utils";

import { createAccrueInterestEvent } from "./morpho-utils";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Morpho tx entity creation", () => {
  beforeAll(() => {
    const market = new Market(Bytes.fromI32(1234567890));
    market.collateralToken = Bytes.fromHexString(
      "0xA16081F360e3847006dB660bae1c6d1b2e17eC2A"
    );
    market.loanToken = Bytes.fromHexString(
      "0xA16081F360e3847006dB660bae1c6d1b2e17eC2A"
    );
    market.lastUpdate = BigInt.fromI32(1);
    market.totalSupplyShares = BigInt.zero();
    market.totalBorrowShares = BigInt.zero();
    market.totalCollateral = BigInt.zero();
    market.totalSupplyShards = BigInt.zero();
    market.totalBorrowShards = BigInt.zero();
    market.totalCollateralShards = BigInt.zero();

    market.save();
  });

  afterAll(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AccrueInterest should not create any entity if there is no fee", () => {
    const id = Bytes.fromI32(1234567890);
    const prevBorrowRate = BigInt.fromI32(234);
    const interest = BigInt.fromI32(234);
    const feeShares = BigInt.zero();
    const timestamp = BigInt.fromI32(1);
    const newAccrueInterestEvent = createAccrueInterestEvent(
      id,
      prevBorrowRate,
      interest,
      feeShares,
      timestamp
    );
    handleAccrueInterest(newAccrueInterestEvent);
    assert.entityCount("MorphoTx", 0);
  });
  test("AccrueInterest should create a deposit on behalf of the fee receiver", () => {
    const morphoFeeRecipient = new MorphoFeeRecipient(Bytes.empty());
    morphoFeeRecipient.feeRecipient = Bytes.fromHexString(
      "0xA16081F360e3847006dB660bae1c6d1b2e17eC2A"
    );
    morphoFeeRecipient.save();

    const id = Bytes.fromI32(1234567890);
    const prevBorrowRate = BigInt.fromI32(234);
    const interest = BigInt.fromI32(234);
    const feeShares = BigInt.fromI32(100);
    const timestamp = BigInt.fromI32(1);
    const newAccrueInterestEvent = createAccrueInterestEvent(
      id,
      prevBorrowRate,
      interest,
      feeShares,
      timestamp
    );
    handleAccrueInterest(newAccrueInterestEvent);
    assert.entityCount("MorphoTx", 1);

    const morphoTx = MorphoTx.load(generateLogId(newAccrueInterestEvent));
    assert.assertNotNull(morphoTx);
    assert.stringEquals(morphoTx!.type, PositionType.SUPPLY);
    assert.bigIntEquals(morphoTx!.shares, feeShares);
  });
});
