import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly";

import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { MetaMorpho } from "../generated/schema";
import { handleCreateMetaMorpho } from "../src/handlers/meta-morpho-factory";

import { createCreateMetaMorphoEvent } from "./meta-morpho-factory-utils";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    const metaMorpho = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const initialOwner = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const initialTimelock = BigInt.fromI32(234);
    const asset = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const name = "Example string value";
    const symbol = "Example string value";
    const salt = Bytes.fromI32(1234567890);
    const timestamp = BigInt.fromI32(1);
    const newCreateMetaMorphoEvent = createCreateMetaMorphoEvent(
      metaMorpho,
      caller,
      initialOwner,
      initialTimelock,
      asset,
      name,
      symbol,
      salt,
      timestamp
    );
    handleCreateMetaMorpho(newCreateMetaMorphoEvent);
  });

  afterAll(() => {
    clearStore();
  });

  test("CreateMetaMorpho created and stored", () => {
    assert.entityCount("MetaMorpho", 1);
    const metaMorpho = MetaMorpho.load(
      Bytes.fromHexString("0x0000000000000000000000000000000000000001")
    );

    assert.assertNotNull(metaMorpho);
    assert.bigIntEquals(metaMorpho!.lastUpdate, BigInt.fromI32(1));
    assert.bigIntEquals(metaMorpho!.totalPoints, BigInt.fromI32(0));
    assert.bigIntEquals(metaMorpho!.totalShares, BigInt.fromI32(0));
    assert.bigIntEquals(metaMorpho!.totalAssets, BigInt.fromI32(0));
    // the following test is throwing an error at the compile time
    // assert.assertNull(metaMorpho!.feeRecipient);
  });
  test("CreateMetaMorpho datasource created", () => {
    assert.dataSourceExists(
      "MetaMorpho",
      "0x0000000000000000000000000000000000000001"
    );
    assert.dataSourceCount("MetaMorpho", 1);
  });
});
