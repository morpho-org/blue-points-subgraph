import {
  assert,
  describe,
  test,
  clearStore,
  beforeEach,
  afterEach,
} from "matchstick-as/assembly";

import { Bytes, BigInt, Address } from "@graphprotocol/graph-ts";

import {
  Market,
  MetaMorpho,
  MorphoFeeRecipient,
  MorphoTx,
} from "../generated/schema";
import {
  handleAccrueInterest,
  handleBorrow,
  handleRepay,
  handleSupply,
  handleSupplyCollateral,
  handleWithdraw,
  handleWithdrawCollateral,
} from "../src/handlers/morpho";
import { setupMetaMorphoPosition, setupPosition } from "../src/initializers";
import { generateLogId, PositionType } from "../src/utils";

import {
  checkTxEventFields,
  createAccrueInterestEvent,
  createBorrowEvent,
  createRepayEvent,
  createSupplyCollateralEvent,
  createSupplyEvent,
  createWithdrawCollateralEvent,
  createWithdrawEvent,
} from "./morpho-utils";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Morpho handlers", () => {
  beforeEach(() => {
    const market = new Market(Bytes.fromI32(1234567890));
    market.collateralToken = Bytes.fromHexString(
      "0x1111000000000000000000000000000000000000"
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

  afterEach(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AccrueInterest with no fee", () => {
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

  test("AccrueInterest with a fee recipient but no fee", () => {
    const morphoFeeRecipient = new MorphoFeeRecipient(Bytes.empty());
    morphoFeeRecipient.feeRecipient = Bytes.fromHexString(
      "0xA16081F360e3847006dB660bae1c6d1b2e17eC2A"
    );
    morphoFeeRecipient.save();

    const id = Bytes.fromI32(1234567890);
    const prevBorrowRate = BigInt.fromI32(234);
    const interest = BigInt.fromI32(234);
    const feeShares = BigInt.fromI32(0);
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

  test("AccrueInterest with a fee", () => {
    const morphoFeeRecipient = new MorphoFeeRecipient(Bytes.empty());
    morphoFeeRecipient.feeRecipient = Bytes.fromHexString(
      "0xA16081F360e3847006dB660bae1c6d1b2e17eC2A"
    );
    morphoFeeRecipient.save();

    const id = Bytes.fromI32(1234567890);
    const prevBorrowRate = BigInt.fromI32(234);
    const interest = BigInt.fromI32(234);
    const feeShares = BigInt.fromI32(100);
    const timestamp = BigInt.fromI32(3);
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

    const position = setupPosition(id, morphoFeeRecipient.feeRecipient);
    assert.assertNotNull(position);
    assert.bigIntEquals(position!.supplyShares, feeShares);
    assert.bigIntEquals(position!.supplyShards, BigInt.zero());
    assert.bigIntEquals(position!.lastUpdate, timestamp);
    assert.bigIntEquals(position!.collateral, BigInt.zero());
    assert.bigIntEquals(position!.borrowShares, BigInt.zero());
    assert.bigIntEquals(position!.borrowShards, BigInt.zero());
    assert.bigIntEquals(position!.collateralShards, BigInt.zero());

    const market = Market.load(id);
    assert.assertNotNull(market);
    assert.bigIntEquals(market!.totalSupplyShares, feeShares);
    assert.bigIntEquals(market!.totalSupplyShards, BigInt.zero());
    assert.bigIntEquals(market!.lastUpdate, timestamp);

    assert.bigIntEquals(market!.totalBorrowShares, BigInt.zero());
    assert.bigIntEquals(market!.totalBorrowShards, BigInt.zero());
    assert.bigIntEquals(market!.totalCollateral, BigInt.zero());
    assert.bigIntEquals(market!.totalCollateralShards, BigInt.zero());
  });

  test("SupplyCollateral of a new user", () => {
    const id = Bytes.fromI32(1234567890);
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const onBehalf = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const assets = BigInt.fromI32(200);
    const timestamp = BigInt.fromI32(3);
    const newSupplyCollateralEvent = createSupplyCollateralEvent(
      id,
      caller,
      onBehalf,
      assets,
      timestamp
    );
    handleSupplyCollateral(newSupplyCollateralEvent);

    assert.entityCount("MorphoTx", 1);
    const morphoTx = MorphoTx.load(generateLogId(newSupplyCollateralEvent));
    assert.assertNotNull(morphoTx);
    assert.stringEquals(morphoTx!.type, PositionType.COLLATERAL);
    assert.bigIntEquals(morphoTx!.shares, assets);
    assert.bytesEquals(morphoTx!.user, onBehalf);
    assert.bytesEquals(morphoTx!.market, id);
    checkTxEventFields(morphoTx!, newSupplyCollateralEvent);

    const position = setupPosition(id, onBehalf);
    assert.assertNotNull(position);
    assert.bytesEquals(position!.user, onBehalf);
    assert.bytesEquals(position!.market, id);
    assert.bigIntEquals(position!.collateral, assets);
    assert.bigIntEquals(position!.supplyShares, BigInt.zero());
    assert.bigIntEquals(position!.borrowShares, BigInt.zero());
    assert.bigIntEquals(position!.supplyShards, BigInt.zero());
    assert.bigIntEquals(position!.borrowShards, BigInt.zero());
    assert.bigIntEquals(position!.collateralShards, BigInt.zero());
    assert.bigIntEquals(position!.lastUpdate, timestamp);

    const market = Market.load(id);
    assert.assertNotNull(market);
    assert.bigIntEquals(market!.totalCollateral, assets);
    assert.bigIntEquals(market!.totalCollateralShards, BigInt.zero());
    assert.bigIntEquals(market!.lastUpdate, timestamp);
    assert.bigIntEquals(market!.totalSupplyShares, BigInt.zero());
    assert.bigIntEquals(market!.totalBorrowShares, BigInt.zero());
    assert.bigIntEquals(market!.totalSupplyShards, BigInt.zero());
    assert.bigIntEquals(market!.totalBorrowShards, BigInt.zero());
    assert.bigIntEquals(market!.totalCollateral, assets);
  });

  test("SupplyCollateral of an existing user", () => {
    const id = Bytes.fromI32(1234567890);
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const onBehalf = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const assets = BigInt.fromI32(200);
    const timestamp = BigInt.fromI32(3);
    const initialMarket = Market.load(id);
    initialMarket!.totalCollateral = BigInt.fromI32(100);
    initialMarket!.save();

    const initialPosition = setupPosition(id, onBehalf);
    initialPosition!.collateral = BigInt.fromI32(100);
    initialPosition.lastUpdate = BigInt.fromI32(1);
    initialPosition!.save();

    const newSupplyCollateralEvent = createSupplyCollateralEvent(
      id,
      caller,
      onBehalf,
      assets,
      timestamp
    );
    handleSupplyCollateral(newSupplyCollateralEvent);

    assert.entityCount("MorphoTx", 1);
    const morphoTx = MorphoTx.load(generateLogId(newSupplyCollateralEvent));
    assert.assertNotNull(morphoTx);
    assert.stringEquals(morphoTx!.type, PositionType.COLLATERAL);
    assert.bigIntEquals(morphoTx!.shares, assets);
    assert.bytesEquals(morphoTx!.user, onBehalf);
    assert.bytesEquals(morphoTx!.market, id);
    checkTxEventFields(morphoTx!, newSupplyCollateralEvent);

    const position = setupPosition(id, onBehalf);
    assert.assertNotNull(position);
    assert.bytesEquals(position.user, onBehalf);
    assert.bytesEquals(position.market, id);
    assert.bigIntEquals(
      position.collateral,
      initialPosition.collateral.plus(assets)
    );
    assert.bigIntEquals(position.supplyShares, BigInt.zero());
    assert.bigIntEquals(position.borrowShares, BigInt.zero());
    assert.bigIntEquals(position.supplyShards, BigInt.zero());
    assert.bigIntEquals(position.borrowShards, BigInt.zero());
    assert.bigIntEquals(
      position!.collateralShards,
      initialPosition.collateralShards.plus(
        initialPosition.collateral.times(
          timestamp.minus(initialPosition.lastUpdate)
        )
      )
    );

    const market = Market.load(id);
    assert.assertNotNull(market);
    assert.bigIntEquals(
      market!.totalCollateral,
      initialMarket!.totalCollateral.plus(assets)
    );
    assert.bigIntEquals(
      market!.totalCollateralShards,
      initialMarket!.totalCollateralShards.plus(
        initialMarket!.totalCollateral.times(
          timestamp.minus(initialMarket!.lastUpdate)
        )
      )
    );
    assert.bigIntEquals(market!.lastUpdate, timestamp);
    assert.bigIntEquals(market!.totalSupplyShares, BigInt.zero());
    assert.bigIntEquals(market!.totalBorrowShares, BigInt.zero());
    assert.bigIntEquals(market!.totalSupplyShards, BigInt.zero());
    assert.bigIntEquals(market!.totalBorrowShards, BigInt.zero());
    assert.bigIntEquals(
      market!.totalCollateral,
      initialMarket!.totalCollateral.plus(assets)
    );
  });

  test("WithdrawCollateral of an existing user", () => {
    const id = Bytes.fromI32(1234567890);
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const onBehalf = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const receiver = Address.fromString(
      "0x0000000000000000000000000000000000000003"
    );

    const assets = BigInt.fromI32(200);
    const timestamp = BigInt.fromI32(3);
    const initialMarket = Market.load(id);
    initialMarket!.totalCollateral = BigInt.fromI32(100);
    initialMarket!.save();

    const initialPosition = setupPosition(id, onBehalf);
    initialPosition!.collateral = BigInt.fromI32(100);
    initialPosition.lastUpdate = BigInt.fromI32(1);
    initialPosition!.save();

    const newSupplyCollateralEvent = createWithdrawCollateralEvent(
      id,
      caller,
      onBehalf,
      receiver,
      assets,
      timestamp
    );
    handleWithdrawCollateral(newSupplyCollateralEvent);

    assert.entityCount("MorphoTx", 1);
    const morphoTx = MorphoTx.load(generateLogId(newSupplyCollateralEvent));
    assert.assertNotNull(morphoTx);
    assert.stringEquals(morphoTx!.type, PositionType.COLLATERAL);
    assert.bigIntEquals(morphoTx!.shares, assets.neg());
    assert.bytesEquals(morphoTx!.user, onBehalf);
    assert.bytesEquals(morphoTx!.market, id);
    checkTxEventFields(morphoTx!, newSupplyCollateralEvent);

    const position = setupPosition(id, onBehalf);
    assert.assertNotNull(position);
    assert.bytesEquals(position.user, onBehalf);
    assert.bytesEquals(position.market, id);
    assert.bigIntEquals(
      position.collateral,
      initialPosition.collateral.minus(assets)
    );
    assert.bigIntEquals(position.supplyShares, BigInt.zero());
    assert.bigIntEquals(position.borrowShares, BigInt.zero());
    assert.bigIntEquals(position.supplyShards, BigInt.zero());
    assert.bigIntEquals(position.borrowShards, BigInt.zero());
    assert.bigIntEquals(
      position!.collateralShards,
      initialPosition.collateralShards.plus(
        initialPosition.collateral.times(
          timestamp.minus(initialPosition.lastUpdate)
        )
      )
    );

    const market = Market.load(id);
    assert.assertNotNull(market);
    assert.bigIntEquals(
      market!.totalCollateral,
      initialMarket!.totalCollateral.minus(assets)
    );
    assert.bigIntEquals(
      market!.totalCollateralShards,
      initialMarket!.totalCollateralShards.plus(
        initialMarket!.totalCollateral.times(
          timestamp.minus(initialMarket!.lastUpdate)
        )
      )
    );
    assert.bigIntEquals(market!.lastUpdate, timestamp);
    assert.bigIntEquals(market!.totalSupplyShares, BigInt.zero());
    assert.bigIntEquals(market!.totalBorrowShares, BigInt.zero());
    assert.bigIntEquals(market!.totalSupplyShards, BigInt.zero());
    assert.bigIntEquals(market!.totalBorrowShards, BigInt.zero());
    assert.bigIntEquals(
      market!.totalCollateral,
      initialMarket!.totalCollateral.minus(assets)
    );
  });

  test("Supply of a new user", () => {
    const id = Bytes.fromI32(1234567890);
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const onBehalf = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const assets = BigInt.fromI32(200);
    const shares = BigInt.fromI32(100);
    const timestamp = BigInt.fromI32(3);
    const supplyEvent = createSupplyEvent(
      id,
      caller,
      onBehalf,
      assets,
      shares,
      timestamp
    );
    handleSupply(supplyEvent);

    assert.entityCount("MorphoTx", 1);
    const morphoTx = MorphoTx.load(generateLogId(supplyEvent));
    assert.assertNotNull(morphoTx);
    assert.stringEquals(morphoTx!.type, PositionType.SUPPLY);
    assert.bigIntEquals(morphoTx!.shares, shares);
    assert.bytesEquals(morphoTx!.user, onBehalf);
    assert.bytesEquals(morphoTx!.market, id);
    checkTxEventFields(morphoTx!, supplyEvent);

    const position = setupPosition(id, onBehalf);
    assert.assertNotNull(position);
    assert.bytesEquals(position!.user, onBehalf);
    assert.bytesEquals(position!.market, id);
    assert.bigIntEquals(position!.collateral, BigInt.zero());
    assert.bigIntEquals(position!.supplyShares, shares);
    assert.bigIntEquals(position!.borrowShares, BigInt.zero());
    assert.bigIntEquals(position!.supplyShards, BigInt.zero());
    assert.bigIntEquals(position!.borrowShards, BigInt.zero());
    assert.bigIntEquals(position!.collateralShards, BigInt.zero());
    assert.bigIntEquals(position!.lastUpdate, timestamp);

    const market = Market.load(id);
    assert.assertNotNull(market);
    assert.bigIntEquals(market!.totalSupplyShares, shares);
    assert.bigIntEquals(market!.totalSupplyShards, BigInt.zero());
    assert.bigIntEquals(market!.lastUpdate, timestamp);
    assert.bigIntEquals(market!.totalBorrowShares, BigInt.zero());
    assert.bigIntEquals(market!.totalBorrowShards, BigInt.zero());
    assert.bigIntEquals(market!.totalCollateral, BigInt.zero());
    assert.bigIntEquals(market!.totalCollateralShards, BigInt.zero());
  });

  test("Supply of an existing user", () => {
    const id = Bytes.fromI32(1234567890);
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const onBehalf = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const assets = BigInt.fromI32(200);
    const shares = BigInt.fromI32(100);
    const timestamp = BigInt.fromI32(3);
    const initialMarket = Market.load(id);
    initialMarket!.totalSupplyShares = BigInt.fromI32(100);
    initialMarket!.save();

    const initialPosition = setupPosition(id, onBehalf);
    initialPosition.supplyShares = BigInt.fromI32(100);
    initialPosition.lastUpdate = BigInt.fromI32(1);
    initialPosition.save();

    const supplyEvent = createSupplyEvent(
      id,
      caller,
      onBehalf,
      assets,
      shares,
      timestamp
    );

    handleSupply(supplyEvent);

    assert.entityCount("MorphoTx", 1);
    const morphoTx = MorphoTx.load(generateLogId(supplyEvent));
    assert.assertNotNull(morphoTx);
    assert.stringEquals(morphoTx!.type, PositionType.SUPPLY);
    assert.bigIntEquals(morphoTx!.shares, shares);
    assert.bytesEquals(morphoTx!.user, onBehalf);
    assert.bytesEquals(morphoTx!.market, id);
    checkTxEventFields(morphoTx!, supplyEvent);

    const position = setupPosition(id, onBehalf);
    assert.assertNotNull(position);
    assert.bytesEquals(position.user, onBehalf);
    assert.bytesEquals(position.market, id);
    assert.bigIntEquals(position.collateral, BigInt.zero());
    assert.bigIntEquals(
      position.supplyShares,
      initialPosition.supplyShares.plus(shares)
    );
    assert.bigIntEquals(position.borrowShares, BigInt.zero());
    assert.bigIntEquals(
      position.supplyShards,
      initialPosition.supplyShards.plus(
        initialPosition.supplyShares.times(
          timestamp.minus(initialPosition.lastUpdate)
        )
      )
    );
    assert.bigIntEquals(position.borrowShards, BigInt.zero());
    assert.bigIntEquals(position.collateralShards, BigInt.zero());
    assert.bigIntEquals(position.lastUpdate, timestamp);

    const market = Market.load(id);
    assert.assertNotNull(market);
    assert.bigIntEquals(
      market!.totalSupplyShares,
      initialMarket!.totalSupplyShares.plus(shares)
    );
    assert.bigIntEquals(
      market!.totalSupplyShards,
      initialMarket!.totalSupplyShards.plus(
        initialMarket!.totalSupplyShares.times(
          timestamp.minus(initialMarket!.lastUpdate)
        )
      )
    );
    assert.bigIntEquals(market!.lastUpdate, timestamp);
    assert.bigIntEquals(market!.totalBorrowShares, BigInt.zero());
    assert.bigIntEquals(market!.totalBorrowShards, BigInt.zero());
    assert.bigIntEquals(market!.totalCollateral, BigInt.zero());
    assert.bigIntEquals(market!.totalCollateralShards, BigInt.zero());
  });

  test("Withdraw of an existing user", () => {
    const id = Bytes.fromI32(1234567890);
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const onBehalf = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const receiver = Address.fromString(
      "0x0000000000000000000000000000000000000003"
    );

    const assets = BigInt.fromI32(200);
    const shares = BigInt.fromI32(100);
    const timestamp = BigInt.fromI32(3);
    const initialMarket = Market.load(id);
    initialMarket!.totalSupplyShares = BigInt.fromI32(100);
    initialMarket!.save();

    const initialPosition = setupPosition(id, onBehalf);
    initialPosition.supplyShares = BigInt.fromI32(100);
    initialPosition.lastUpdate = BigInt.fromI32(1);
    initialPosition.save();

    const withdrawEvent = createWithdrawEvent(
      id,
      caller,
      onBehalf,
      receiver,
      assets,
      shares,
      timestamp
    );

    handleWithdraw(withdrawEvent);

    assert.entityCount("MorphoTx", 1);
    const morphoTx = MorphoTx.load(generateLogId(withdrawEvent));
    assert.assertNotNull(morphoTx);
    assert.stringEquals(morphoTx!.type, PositionType.SUPPLY);
    assert.bigIntEquals(morphoTx!.shares, shares.neg());
    assert.bytesEquals(morphoTx!.user, onBehalf);
    assert.bytesEquals(morphoTx!.market, id);
    checkTxEventFields(morphoTx!, withdrawEvent);

    const position = setupPosition(id, onBehalf);
    assert.assertNotNull(position);
    assert.bytesEquals(position.user, onBehalf);
    assert.bytesEquals(position.market, id);
    assert.bigIntEquals(position.collateral, BigInt.zero());
    assert.bigIntEquals(
      position.supplyShares,
      initialPosition.supplyShares.minus(shares)
    );
    assert.bigIntEquals(position.borrowShares, BigInt.zero());
    assert.bigIntEquals(
      position.supplyShards,
      initialPosition.supplyShards.plus(
        initialPosition.supplyShares.times(
          timestamp.minus(initialPosition.lastUpdate)
        )
      )
    );
    assert.bigIntEquals(position.borrowShards, BigInt.zero());
    assert.bigIntEquals(position.collateralShards, BigInt.zero());
    assert.bigIntEquals(position.lastUpdate, timestamp);

    const market = Market.load(id);
    assert.assertNotNull(market);
    assert.bigIntEquals(
      market!.totalSupplyShares,
      initialMarket!.totalSupplyShares.minus(shares)
    );
    assert.bigIntEquals(
      market!.totalSupplyShards,
      initialMarket!.totalSupplyShards.plus(
        initialMarket!.totalSupplyShares.times(
          timestamp.minus(initialMarket!.lastUpdate)
        )
      )
    );
    assert.bigIntEquals(market!.lastUpdate, timestamp);
    assert.bigIntEquals(market!.totalBorrowShares, BigInt.zero());
    assert.bigIntEquals(market!.totalBorrowShards, BigInt.zero());
    assert.bigIntEquals(market!.totalCollateral, BigInt.zero());
    assert.bigIntEquals(market!.totalCollateralShards, BigInt.zero());
  });

  test("Borrow of a new borrower", () => {
    const id = Bytes.fromI32(1234567890);
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const onBehalf = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const receiver = Address.fromString(
      "0x0000000000000000000000000000000000000003"
    );
    const assets = BigInt.fromI32(200);
    const shares = BigInt.fromI32(100);
    const timestamp = BigInt.fromI32(3);
    const borrowEvent = createBorrowEvent(
      id,
      caller,
      onBehalf,
      receiver,
      assets,
      shares,
      timestamp
    );
    const initialMarket = Market.load(id);
    initialMarket!.totalCollateral = BigInt.fromI32(100);
    initialMarket!.save();

    const initialPosition = setupPosition(id, onBehalf);
    initialPosition.borrowShares = BigInt.zero();
    initialPosition.collateral = BigInt.fromI32(100);
    initialPosition.lastUpdate = BigInt.zero();
    initialPosition.save();

    handleBorrow(borrowEvent);

    assert.entityCount("MorphoTx", 1);
    const morphoTx = MorphoTx.load(generateLogId(borrowEvent));
    assert.assertNotNull(morphoTx);
    assert.stringEquals(morphoTx!.type, PositionType.BORROW);
    assert.bigIntEquals(morphoTx!.shares, shares);
    assert.bytesEquals(morphoTx!.user, onBehalf);
    assert.bytesEquals(morphoTx!.market, id);
    checkTxEventFields(morphoTx!, borrowEvent);

    const position = setupPosition(id, onBehalf);
    assert.assertNotNull(position);
    assert.bytesEquals(position.user, onBehalf);
    assert.bytesEquals(position.market, id);
    assert.bigIntEquals(position.collateral, BigInt.fromI32(100));
    assert.bigIntEquals(position.supplyShares, BigInt.zero());
    assert.bigIntEquals(position.borrowShares, shares);
    assert.bigIntEquals(position.supplyShards, BigInt.zero());
    assert.bigIntEquals(position.borrowShards, BigInt.zero());
    assert.bigIntEquals(
      position.collateralShards,
      position.collateralShards.plus(
        position.collateral.times(timestamp.minus(position.lastUpdate))
      )
    );
    assert.bigIntEquals(position.lastUpdate, timestamp);

    const market = Market.load(id);
    assert.assertNotNull(market);
    assert.bigIntEquals(market!.totalBorrowShares, shares);
    assert.bigIntEquals(market!.totalBorrowShards, BigInt.zero());
    assert.bigIntEquals(market!.lastUpdate, timestamp);
    assert.bigIntEquals(market!.totalSupplyShares, BigInt.zero());
    assert.bigIntEquals(market!.totalSupplyShards, BigInt.zero());
    assert.bigIntEquals(
      market!.totalCollateral,
      initialMarket!.totalCollateral
    );
    assert.bigIntEquals(
      market!.totalCollateralShards,
      initialMarket!.totalCollateralShards.plus(
        initialMarket!.totalCollateral.times(
          timestamp.minus(initialMarket!.lastUpdate)
        )
      )
    );
  });

  test("Borrow of an existing borrower", () => {
    const id = Bytes.fromI32(1234567890);
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const onBehalf = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const receiver = Address.fromString(
      "0x0000000000000000000000000000000000000003"
    );
    const assets = BigInt.fromI32(200);
    const shares = BigInt.fromI32(100);
    const timestamp = BigInt.fromI32(3);
    const initialMarket = Market.load(id);
    initialMarket!.totalCollateral = BigInt.fromI32(100);
    initialMarket!.totalBorrowShares = BigInt.fromI32(100);
    initialMarket!.save();

    const initialPosition = setupPosition(id, onBehalf);
    initialPosition.borrowShares = BigInt.fromI32(100);
    initialPosition.collateral = BigInt.fromI32(100);
    initialPosition.lastUpdate = BigInt.fromI32(1);
    initialPosition.save();

    const borrowEvent = createBorrowEvent(
      id,
      caller,
      onBehalf,
      receiver,
      assets,
      shares,
      timestamp
    );

    handleBorrow(borrowEvent);

    assert.entityCount("MorphoTx", 1);
    const morphoTx = MorphoTx.load(generateLogId(borrowEvent));
    assert.assertNotNull(morphoTx);
    assert.stringEquals(morphoTx!.type, PositionType.BORROW);
    assert.bigIntEquals(morphoTx!.shares, shares);
    assert.bytesEquals(morphoTx!.user, onBehalf);
    assert.bytesEquals(morphoTx!.market, id);
    checkTxEventFields(morphoTx!, borrowEvent);

    const position = setupPosition(id, onBehalf);
    assert.assertNotNull(position);
    assert.bytesEquals(position.user, onBehalf);
    assert.bytesEquals(position.market, id);
    assert.bigIntEquals(position.collateral, BigInt.fromI32(100));
    assert.bigIntEquals(position.supplyShares, BigInt.zero());
    assert.bigIntEquals(
      position.borrowShares,
      initialPosition.borrowShares.plus(shares)
    );
    assert.bigIntEquals(position.supplyShards, BigInt.zero());
    assert.bigIntEquals(
      position.borrowShards,
      timestamp
        .minus(initialPosition.lastUpdate)
        .times(initialPosition.borrowShares)
    );
    assert.bigIntEquals(
      position.collateralShards,
      position.collateralShards.plus(
        position.collateral.times(timestamp.minus(position.lastUpdate))
      )
    );
    assert.bigIntEquals(position.lastUpdate, timestamp);

    const market = Market.load(id);
    assert.assertNotNull(market);
    assert.bigIntEquals(
      market!.totalBorrowShares,
      initialMarket!.totalBorrowShares.plus(shares)
    );
    assert.bigIntEquals(
      market!.totalBorrowShards,
      initialMarket!.totalBorrowShards.plus(
        initialMarket!.totalBorrowShares.times(
          timestamp.minus(initialMarket!.lastUpdate)
        )
      )
    );
    assert.bigIntEquals(market!.lastUpdate, timestamp);
    assert.bigIntEquals(market!.totalSupplyShares, BigInt.zero());
    assert.bigIntEquals(market!.totalSupplyShards, BigInt.zero());
    assert.bigIntEquals(
      market!.totalCollateral,
      initialMarket!.totalCollateral
    );
    assert.bigIntEquals(
      market!.totalCollateralShards,
      initialMarket!.totalCollateralShards.plus(
        initialMarket!.totalCollateral.times(
          timestamp.minus(initialMarket!.lastUpdate)
        )
      )
    );
  });

  test("Repay of an existing borrower with collateral", () => {
    const id = Bytes.fromI32(1234567890);
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const onBehalf = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const assets = BigInt.fromI32(200);
    const shares = BigInt.fromI32(100);
    const timestamp = BigInt.fromI32(3);
    const initialMarket = Market.load(id);
    initialMarket!.totalCollateral = BigInt.fromI32(100);
    initialMarket!.totalBorrowShares = BigInt.fromI32(100);
    initialMarket!.save();

    const initialPosition = setupPosition(id, onBehalf);
    initialPosition.borrowShares = BigInt.fromI32(100);
    initialPosition.collateral = BigInt.fromI32(100);
    initialPosition.lastUpdate = BigInt.fromI32(1);
    initialPosition.save();

    const repayEvent = createRepayEvent(
      id,
      caller,
      onBehalf,
      assets,
      shares,
      timestamp
    );

    handleRepay(repayEvent);

    assert.entityCount("MorphoTx", 1);
    const morphoTx = MorphoTx.load(generateLogId(repayEvent));
    assert.assertNotNull(morphoTx);
    assert.stringEquals(morphoTx!.type, PositionType.BORROW);
    assert.bigIntEquals(morphoTx!.shares, shares.neg());
    assert.bytesEquals(morphoTx!.user, onBehalf);
    assert.bytesEquals(morphoTx!.market, id);
    checkTxEventFields(morphoTx!, repayEvent);

    const position = setupPosition(id, onBehalf);
    assert.assertNotNull(position);
    assert.bytesEquals(position.user, onBehalf);
    assert.bytesEquals(position.market, id);
    assert.bigIntEquals(position.collateral, BigInt.fromI32(100));
    assert.bigIntEquals(position.supplyShares, BigInt.zero());
    assert.bigIntEquals(
      position.borrowShares,
      initialPosition.borrowShares.minus(shares)
    );
    assert.bigIntEquals(position.supplyShards, BigInt.zero());
    assert.bigIntEquals(
      position.borrowShards,
      timestamp
        .minus(initialPosition.lastUpdate)
        .times(initialPosition.borrowShares)
    );
    assert.bigIntEquals(
      position.collateralShards,
      position.collateralShards.plus(
        position.collateral.times(timestamp.minus(position.lastUpdate))
      )
    );
    assert.bigIntEquals(position.lastUpdate, timestamp);

    const market = Market.load(id);
    assert.assertNotNull(market);
    assert.bigIntEquals(
      market!.totalBorrowShares,
      initialMarket!.totalBorrowShares.minus(shares)
    );
    assert.bigIntEquals(
      market!.totalBorrowShards,
      initialMarket!.totalBorrowShards.plus(
        initialMarket!.totalBorrowShares.times(
          timestamp.minus(initialMarket!.lastUpdate)
        )
      )
    );
    assert.bigIntEquals(market!.lastUpdate, timestamp);
    assert.bigIntEquals(market!.totalSupplyShares, BigInt.zero());
    assert.bigIntEquals(market!.totalSupplyShards, BigInt.zero());
    assert.bigIntEquals(
      market!.totalCollateral,
      initialMarket!.totalCollateral
    );
    assert.bigIntEquals(
      market!.totalCollateralShards,
      initialMarket!.totalCollateralShards.plus(
        initialMarket!.totalCollateral.times(
          timestamp.minus(initialMarket!.lastUpdate)
        )
      )
    );
  });
});

describe("MetaMorpho as collateral", () => {
  beforeEach(() => {
    const market = new Market(Bytes.fromI32(1234567890));
    market.collateralToken = Bytes.fromHexString(
      "0x1111000000000000000000000000000000000000"
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

    //We create a vault
    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0x1111000000000000000000000000000000000000")
    );
    metaMorpho.totalShares = BigInt.fromI32(100);
    metaMorpho.totalShards = BigInt.fromI32(100);
    metaMorpho.lastUpdate = BigInt.fromI32(1);

    metaMorpho.save();

    // We create a position for the user
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );

    const initialMetaMorphoPosition = setupMetaMorphoPosition(
      metaMorpho.id,
      caller
    );
    initialMetaMorphoPosition.shares = BigInt.fromI32(100);
    initialMetaMorphoPosition.lastUpdate = BigInt.fromI32(1);
    initialMetaMorphoPosition.save();
  });
  afterEach(() => {
    clearStore();
  });
  test("SupplyCollateral with a metaMorpho as collateral, for itself", () => {
    const id = Bytes.fromI32(1234567890);
    const onBehalf = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const caller = onBehalf;

    const assets = BigInt.fromI32(200);
    const timestamp = BigInt.fromI32(3);
    const newSupplyCollateralEvent = createSupplyCollateralEvent(
      id,
      caller,
      onBehalf,
      assets,
      timestamp
    );
    handleSupplyCollateral(newSupplyCollateralEvent);

    assert.entityCount("MorphoTx", 1);
    assert.entityCount("MetaMorphoTx", 0);

    const morphoTx = MorphoTx.load(generateLogId(newSupplyCollateralEvent));
    assert.assertNotNull(morphoTx);
  });
});
