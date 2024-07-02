import {
  describe,
  test,
  clearStore,
  afterEach,
  assert,
} from "matchstick-as/assembly";

import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

import {
  MetaMorpho,
  MetaMorphoPosition,
  MetaMorphoTx,
} from "../generated/schema";
import {
  handleAccrueInterest,
  handleDeposit,
  handleSetFeeRecipient,
  handleTransfer,
  handleWithdraw,
} from "../src/handlers/meta-morpho";
import { setupMetaMorphoPosition } from "../src/initializers";
import { generateLogId } from "../src/utils";

import {
  checkTxEventFields,
  createAccrueInterestEvent,
  createDepositEvent,
  createTransferEvent,
  createWithdrawEvent,
  createSetFeeRecipientEvent,
} from "./meta-morpho-utils";

describe("MetaMorpho handlers", () => {
  afterEach(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AccrueInterest with no fee recipient", () => {
    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0xa16081f360e3847006db660bae1c6d1b2e17ec2a")
    );
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.totalPoints = BigInt.fromI32(123);
    metaMorpho.totalShares = BigInt.fromI32(123);
    metaMorpho.totalAssets = BigInt.fromI32(122);

    metaMorpho.save();
    const newTotalAssets = BigInt.fromI32(123);
    const feeShares = BigInt.fromI32(0);
    const timestamp = BigInt.fromI32(1);
    const newAccrueFeeEvent = createAccrueInterestEvent(
      newTotalAssets,
      feeShares,
      timestamp
    );
    handleAccrueInterest(newAccrueFeeEvent);

    assert.entityCount("MetaMorphoTx", 0);
    assert.entityCount("MetaMorphoPosition", 0);
  });
  test("AccrueInterest with a fee recipient but no fees", () => {
    const feeRecipient = Bytes.fromHexString(
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2b"
    );

    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0xa16081f360e3847006db660bae1c6d1b2e17ec2a")
    );
    metaMorpho.feeRecipient = feeRecipient;

    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.totalPoints = BigInt.fromI32(123);
    metaMorpho.totalShares = BigInt.fromI32(123);
    metaMorpho.totalAssets = BigInt.fromI32(122);

    metaMorpho.save();
    const newTotalAssets = BigInt.fromI32(123);
    const feeShares = BigInt.fromI32(0);
    const timestamp = BigInt.fromI32(1);
    const newAccrueFeeEvent = createAccrueInterestEvent(
      newTotalAssets,
      feeShares,
      timestamp
    );
    handleAccrueInterest(newAccrueFeeEvent);

    assert.entityCount("MetaMorphoTx", 0);
    assert.entityCount("MetaMorphoPosition", 0);
  });
  test("AccrueInterest with a fee recipient", () => {
    const feeRecipient = Bytes.fromHexString(
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2b"
    );

    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0xa16081f360e3847006db660bae1c6d1b2e17ec2a")
    );
    metaMorpho.feeRecipient = feeRecipient;
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.totalPoints = BigInt.fromI32(123);
    metaMorpho.totalShares = BigInt.fromI32(123);
    metaMorpho.totalAssets = BigInt.fromI32(122);

    metaMorpho.save();
    const newTotalAssets = BigInt.fromI32(123);
    const feeShares = BigInt.fromI32(234);
    const timestamp = BigInt.fromI32(1);
    const newAccrueFeeEvent = createAccrueInterestEvent(
      newTotalAssets,
      feeShares,
      timestamp
    );
    handleAccrueInterest(newAccrueFeeEvent);

    assert.entityCount("MetaMorphoTx", 1);
    assert.entityCount("MetaMorphoPosition", 1);
    const metaMorphoTx = MetaMorphoTx.load(generateLogId(newAccrueFeeEvent));
    assert.assertNotNull(metaMorphoTx);

    assert.bytesEquals(metaMorphoTx!.user, feeRecipient);
    assert.bytesEquals(metaMorphoTx!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(metaMorphoTx!.shares, feeShares);
    assert.bigIntEquals(
      metaMorphoTx!.timestamp,
      newAccrueFeeEvent.block.timestamp
    );

    const position = MetaMorphoPosition.load(
      metaMorpho.id.concat(feeRecipient)
    );
    assert.assertNotNull(position);
    assert.bytesEquals(position!.user, feeRecipient);
    assert.bytesEquals(position!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(position!.shares, feeShares);
    assert.bigIntEquals(position!.supplyPoints, BigInt.zero());

    checkTxEventFields(metaMorphoTx!, newAccrueFeeEvent);
  });

  test("Deposit for a new user", () => {
    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0xA16081F360e3847006dB660bae1c6d1b2e17eC2A")
    );
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.totalPoints = BigInt.fromI32(0);
    metaMorpho.totalShares = BigInt.fromI32(123);
    metaMorpho.totalAssets = BigInt.fromI32(122);
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.save();

    const sender = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const owner = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const assets = BigInt.fromI32(234);
    const shares = BigInt.fromI32(123);
    const timestamp = BigInt.fromI32(10);
    const newDepositEvent = createDepositEvent(
      sender,
      owner,
      assets,
      shares,
      timestamp
    );
    handleDeposit(newDepositEvent);

    assert.entityCount("MetaMorphoTx", 1);
    assert.entityCount("MetaMorphoPosition", 1);
    const metaMorphoTx = MetaMorphoTx.load(generateLogId(newDepositEvent));
    assert.assertNotNull(metaMorphoTx);
    assert.bytesEquals(metaMorphoTx!.user, owner);
    assert.bytesEquals(metaMorphoTx!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(metaMorphoTx!.shares, shares);

    checkTxEventFields(metaMorphoTx!, newDepositEvent);

    const position = MetaMorphoPosition.load(metaMorpho.id.concat(owner));
    assert.assertNotNull(position);
    assert.bytesEquals(position!.user, owner);
    assert.bytesEquals(position!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(position!.shares, shares);
    assert.bigIntEquals(position!.supplyPoints, BigInt.zero());
    assert.bigIntEquals(position!.lastUpdate, timestamp);

    const metaMorphoAfterTx = MetaMorpho.load(metaMorpho.id);
    assert.assertNotNull(metaMorphoAfterTx);
    assert.bigIntEquals(metaMorphoAfterTx!.lastUpdate, timestamp);
    assert.bigIntEquals(
      metaMorphoAfterTx!.totalShares,
      metaMorpho.totalShares.plus(shares)
    );
    assert.bigIntEquals(
      metaMorphoAfterTx!.totalPoints,
      metaMorpho.totalPoints.plus(
        metaMorpho.totalShares.times(timestamp.minus(metaMorpho.lastUpdate))
      )
    );
  });

  test("Deposit for an existing user", () => {
    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0xA16081F360e3847006dB660bae1c6d1b2e17eC2A")
    );
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.totalPoints = BigInt.fromI32(100);
    metaMorpho.totalShares = BigInt.fromI32(123);
    metaMorpho.totalAssets = BigInt.fromI32(122);
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.save();

    const sender = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const owner = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const position = setupMetaMorphoPosition(metaMorpho.id, owner);
    position.lastUpdate = BigInt.fromI32(0);
    position.shares = BigInt.fromI32(123);
    position.save();

    const assets = BigInt.fromI32(234);
    const shares = BigInt.fromI32(123);
    const timestamp = BigInt.fromI32(10);
    const newDepositEvent = createDepositEvent(
      sender,
      owner,
      assets,
      shares,
      timestamp
    );
    handleDeposit(newDepositEvent);

    assert.entityCount("MetaMorphoTx", 1);
    assert.entityCount("MetaMorphoPosition", 1);
    const metaMorphoTx = MetaMorphoTx.load(generateLogId(newDepositEvent));
    assert.assertNotNull(metaMorphoTx);
    assert.bytesEquals(metaMorphoTx!.user, owner);
    assert.bytesEquals(metaMorphoTx!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(metaMorphoTx!.shares, shares);

    checkTxEventFields(metaMorphoTx!, newDepositEvent);

    const positionAfterTx = MetaMorphoPosition.load(
      metaMorpho.id.concat(owner)
    );
    assert.assertNotNull(positionAfterTx);
    assert.bytesEquals(positionAfterTx!.user, owner);
    assert.bytesEquals(positionAfterTx!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(positionAfterTx!.shares, shares.plus(position.shares));
    assert.bigIntEquals(
      positionAfterTx!.supplyPoints,
      timestamp
        .minus(position.lastUpdate)
        .times(position.shares)
        .plus(position.supplyPoints)
    );

    assert.bigIntEquals(positionAfterTx!.lastUpdate, timestamp);

    const metaMorphoAfterTx = MetaMorpho.load(metaMorpho.id);
    assert.assertNotNull(metaMorphoAfterTx);
    assert.bigIntEquals(metaMorphoAfterTx!.lastUpdate, timestamp);
    assert.bigIntEquals(
      metaMorphoAfterTx!.totalShares,
      metaMorpho.totalShares.plus(shares)
    );
    assert.bigIntEquals(
      metaMorphoAfterTx!.totalPoints,
      metaMorpho.totalPoints.plus(
        metaMorpho.totalShares.times(timestamp.minus(metaMorpho.lastUpdate))
      )
    );
  });

  test("Withdraw of an existing position", () => {
    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0xA16081F360e3847006dB660bae1c6d1b2e17eC2A")
    );
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.totalPoints = BigInt.fromI32(123);
    metaMorpho.totalShares = BigInt.fromI32(123);
    metaMorpho.totalAssets = BigInt.fromI32(122);
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.save();

    const owner = Address.fromString(
      "0x0000000000000000000000000000000000000003"
    );

    const position = setupMetaMorphoPosition(metaMorpho.id, owner);
    position.lastUpdate = BigInt.fromI32(1);
    position.shares = BigInt.fromI32(123);
    position.save();
    const sender = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const receiver = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const assets = BigInt.fromI32(234);
    const shares = BigInt.fromI32(123);
    const timestamp = BigInt.fromI32(3);
    const withdrawEvent = createWithdrawEvent(
      sender,
      receiver,
      owner,
      assets,
      shares,
      timestamp
    );
    handleWithdraw(withdrawEvent);

    assert.entityCount("MetaMorphoTx", 1);
    assert.entityCount("MetaMorphoPosition", 1);
    assert.entityCount("MetaMorpho", 1);
    const metaMorphoTx = MetaMorphoTx.load(generateLogId(withdrawEvent));
    assert.assertNotNull(metaMorphoTx);
    assert.bytesEquals(metaMorphoTx!.user, owner);
    assert.bytesEquals(metaMorphoTx!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(metaMorphoTx!.shares, shares.neg());

    checkTxEventFields(metaMorphoTx!, withdrawEvent);

    const mmPosition = MetaMorphoPosition.load(metaMorpho.id.concat(owner));
    assert.assertNotNull(mmPosition);
    assert.bytesEquals(mmPosition!.user, owner);
    assert.bytesEquals(mmPosition!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(mmPosition!.shares, BigInt.fromI32(0));
    assert.bigIntEquals(mmPosition!.supplyPoints, BigInt.fromI32(246));
    assert.bigIntEquals(mmPosition!.lastUpdate, timestamp);

    const metaMorphoAfterTx = MetaMorpho.load(metaMorpho.id);
    assert.assertNotNull(metaMorphoAfterTx);
    assert.bigIntEquals(metaMorphoAfterTx!.lastUpdate, timestamp);
    assert.bigIntEquals(metaMorphoAfterTx!.totalShares, BigInt.zero());
    assert.bigIntEquals(
      metaMorphoAfterTx!.totalPoints,
      BigInt.fromI32(123 + 246)
    );
  });

  test("Transfer of a mint event", () => {
    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0xA16081F360e3847006dB660bae1c6d1b2e17eC2A")
    );
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.totalPoints = BigInt.fromI32(123);
    metaMorpho.totalShares = BigInt.fromI32(123);
    metaMorpho.totalAssets = BigInt.fromI32(122);
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.save();

    const sender = Address.zero();
    const receiver = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const shares = BigInt.fromI32(123);
    const timestamp = BigInt.fromI32(3);
    const transferEvent = createTransferEvent(
      sender,
      receiver,
      shares,
      timestamp
    );
    handleTransfer(transferEvent);

    assert.entityCount("MetaMorphoTx", 0);
    assert.entityCount("MetaMorphoPosition", 0);
  });

  test("Transfer of a burn event", () => {
    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0xA16081F360e3847006dB660bae1c6d1b2e17eC2A")
    );
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.totalPoints = BigInt.fromI32(123);
    metaMorpho.totalShares = BigInt.fromI32(123);
    metaMorpho.totalAssets = BigInt.fromI32(122);
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.save();

    const sender = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const receiver = Address.zero();
    const shares = BigInt.fromI32(123);
    const timestamp = BigInt.fromI32(3);
    const transferEvent = createTransferEvent(
      sender,
      receiver,
      shares,
      timestamp
    );
    handleTransfer(transferEvent);

    assert.entityCount("MetaMorphoTx", 0);
    assert.entityCount("MetaMorphoPosition", 0);
  });

  test("Transfer to a new user", () => {
    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0xA16081F360e3847006dB660bae1c6d1b2e17eC2A")
    );
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.totalPoints = BigInt.fromI32(123);
    metaMorpho.totalShares = BigInt.fromI32(123);
    metaMorpho.totalAssets = BigInt.fromI32(122);
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.save();

    const sender = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const receiver = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const shares = BigInt.fromI32(123);
    const timestamp = BigInt.fromI32(3);

    const initialSenderPosition = setupMetaMorphoPosition(
      metaMorpho.id,
      sender
    );
    initialSenderPosition.shares = shares;
    initialSenderPosition.lastUpdate = BigInt.fromI32(1);
    initialSenderPosition.save();

    const transferEvent = createTransferEvent(
      sender,
      receiver,
      shares,
      timestamp
    );
    handleTransfer(transferEvent);

    assert.entityCount("MetaMorphoTx", 2);
    assert.entityCount("MetaMorphoPosition", 2);
    const txFrom = MetaMorphoTx.load(
      generateLogId(transferEvent).concat(Bytes.fromI32(1))
    );
    assert.assertNotNull(txFrom);
    assert.bytesEquals(txFrom!.user, sender);
    assert.bytesEquals(txFrom!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(txFrom!.shares, shares.neg());
    assert.bigIntEquals(txFrom!.timestamp, timestamp);
    checkTxEventFields(txFrom!, transferEvent);

    const txTo = MetaMorphoTx.load(
      generateLogId(transferEvent).concat(Bytes.fromI32(2))
    );
    assert.assertNotNull(txTo);
    assert.bytesEquals(txTo!.user, receiver);
    assert.bytesEquals(txTo!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(txTo!.shares, shares);
    assert.bigIntEquals(txTo!.timestamp, timestamp);
    checkTxEventFields(txTo!, transferEvent);

    const positionFrom = MetaMorphoPosition.load(metaMorpho.id.concat(sender));
    assert.assertNotNull(positionFrom);
    assert.bytesEquals(positionFrom!.user, sender);
    assert.bytesEquals(positionFrom!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(positionFrom!.shares, BigInt.zero());
    assert.bigIntEquals(
      positionFrom!.supplyPoints,
      initialSenderPosition.supplyPoints.plus(
        timestamp.minus(initialSenderPosition.lastUpdate).times(shares)
      )
    );
    assert.bigIntEquals(positionFrom!.lastUpdate, timestamp);

    const positionTo = MetaMorphoPosition.load(metaMorpho.id.concat(receiver));
    assert.assertNotNull(positionTo);
    assert.bytesEquals(positionTo!.user, receiver);
    assert.bytesEquals(positionTo!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(positionTo!.shares, shares);
    assert.bigIntEquals(positionTo!.supplyPoints, BigInt.zero());
    assert.bigIntEquals(positionTo!.lastUpdate, timestamp);

    const metaMorphoAfterTx = MetaMorpho.load(metaMorpho.id);
    assert.assertNotNull(metaMorphoAfterTx);
    assert.bigIntEquals(metaMorphoAfterTx!.lastUpdate, timestamp);
    assert.bigIntEquals(metaMorphoAfterTx!.totalShares, metaMorpho.totalShares);
    assert.bigIntEquals(
      metaMorphoAfterTx!.totalPoints,
      metaMorpho.totalPoints.plus(
        timestamp.minus(metaMorpho.lastUpdate).times(metaMorpho.totalShares)
      )
    );
  });

  test("Transfer to an existing user", () => {
    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0xA16081F360e3847006dB660bae1c6d1b2e17eC2A")
    );
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.totalPoints = BigInt.fromI32(123);
    metaMorpho.totalShares = BigInt.fromI32(246);
    metaMorpho.totalAssets = BigInt.fromI32(245);
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.save();

    const sender = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const receiver = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    );
    const shares = BigInt.fromI32(123);
    const timestamp = BigInt.fromI32(3);

    const initialSenderPosition = setupMetaMorphoPosition(
      metaMorpho.id,
      sender
    );
    initialSenderPosition.shares = shares;
    initialSenderPosition.lastUpdate = BigInt.fromI32(1);
    initialSenderPosition.save();

    const initialReceiverPosition = setupMetaMorphoPosition(
      metaMorpho.id,
      receiver
    );
    initialReceiverPosition.shares = BigInt.fromI32(123);
    initialReceiverPosition.lastUpdate = BigInt.fromI32(1);
    initialReceiverPosition.save();

    const transferEvent = createTransferEvent(
      sender,
      receiver,
      shares,
      timestamp
    );
    handleTransfer(transferEvent);

    assert.entityCount("MetaMorphoTx", 2);
    assert.entityCount("MetaMorphoPosition", 2);
    const txFrom = MetaMorphoTx.load(
      generateLogId(transferEvent).concat(Bytes.fromI32(1))
    );
    assert.assertNotNull(txFrom);
    assert.bytesEquals(txFrom!.user, sender);
    assert.bytesEquals(txFrom!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(txFrom!.shares, shares.neg());
    assert.bigIntEquals(txFrom!.timestamp, timestamp);
    checkTxEventFields(txFrom!, transferEvent);

    const txTo = MetaMorphoTx.load(
      generateLogId(transferEvent).concat(Bytes.fromI32(2))
    );
    assert.assertNotNull(txTo);
    assert.bytesEquals(txTo!.user, receiver);
    assert.bytesEquals(txTo!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(txTo!.shares, shares);
    assert.bigIntEquals(txTo!.timestamp, timestamp);
    checkTxEventFields(txTo!, transferEvent);

    const positionFrom = MetaMorphoPosition.load(metaMorpho.id.concat(sender));
    assert.assertNotNull(positionFrom);
    assert.bytesEquals(positionFrom!.user, sender);
    assert.bytesEquals(positionFrom!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(positionFrom!.shares, BigInt.zero());
    assert.bigIntEquals(
      positionFrom!.supplyPoints,
      initialSenderPosition.supplyPoints.plus(
        timestamp.minus(initialSenderPosition.lastUpdate).times(shares)
      )
    );
    assert.bigIntEquals(positionFrom!.lastUpdate, timestamp);

    const positionTo = MetaMorphoPosition.load(metaMorpho.id.concat(receiver));
    assert.assertNotNull(positionTo);
    assert.bytesEquals(positionTo!.user, receiver);
    assert.bytesEquals(positionTo!.metaMorpho, metaMorpho.id);
    assert.bigIntEquals(
      positionTo!.shares,
      initialReceiverPosition.shares.plus(shares)
    );
    assert.bigIntEquals(
      positionTo!.supplyPoints,
      initialReceiverPosition.supplyPoints.plus(
        timestamp.minus(initialReceiverPosition.lastUpdate).times(shares)
      )
    );
    assert.bigIntEquals(positionTo!.lastUpdate, timestamp);

    const metaMorphoAfterTx = MetaMorpho.load(metaMorpho.id);
    assert.assertNotNull(metaMorphoAfterTx);
    assert.bigIntEquals(metaMorphoAfterTx!.lastUpdate, timestamp);
    assert.bigIntEquals(metaMorphoAfterTx!.totalShares, metaMorpho.totalShares);
    assert.bigIntEquals(
      metaMorphoAfterTx!.totalPoints,
      metaMorpho.totalPoints.plus(
        timestamp.minus(metaMorpho.lastUpdate).times(metaMorpho.totalShares)
      )
    );
  });

  test("SetFeeRecipient with no fee recipient", () => {
    const metaMorpho = new MetaMorpho(
      Bytes.fromHexString("0xA16081F360e3847006dB660bae1c6d1b2e17eC2A")
    );
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.totalPoints = BigInt.fromI32(123);
    metaMorpho.totalShares = BigInt.fromI32(123);
    metaMorpho.totalAssets = BigInt.fromI32(122);
    metaMorpho.lastUpdate = BigInt.fromI32(1);
    metaMorpho.save();

    const newFeeRecipient = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    const timestamp = BigInt.fromI32(3);
    const setFeeRecipientEvent = createSetFeeRecipientEvent(
      newFeeRecipient,
      timestamp
    );
    handleSetFeeRecipient(setFeeRecipientEvent);

    assert.entityCount("MetaMorphoTx", 0);
    assert.entityCount("MetaMorphoPosition", 0);
    assert.entityCount("MetaMorpho", 1);
    const metaMorphoAfterTx = MetaMorpho.load(metaMorpho.id);
    assert.assertNotNull(metaMorphoAfterTx);
    assert.bytesEquals(metaMorphoAfterTx!.feeRecipient!, newFeeRecipient);
  });
});
