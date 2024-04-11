import { assert } from "matchstick-as";

import { ethereum, Bytes, BigInt, Address } from "@graphprotocol/graph-ts";

import {
  AccrueInterest,
  Borrow,
  CreateMarket,
  Liquidate,
  Repay,
  SetFeeRecipient,
  Supply,
  SupplyCollateral,
  Withdraw,
  WithdrawCollateral,
} from "../generated/Morpho/Morpho";
import { MorphoTx } from "../generated/schema";

import { newMockEvent } from "./defaults";

export function checkTxEventFields(
  metaMorphoTx: MorphoTx,
  event: ethereum.Event
): void {
  assert.bigIntEquals(metaMorphoTx!.timestamp, event.block.timestamp);
  assert.bigIntEquals(metaMorphoTx!.blockNumber, event.block.number);
  assert.bigIntEquals(metaMorphoTx!.logIndex, event.logIndex);
  assert.bytesEquals(metaMorphoTx!.txHash, event.transaction.hash);
  assert.bigIntEquals(metaMorphoTx!.txIndex, event.transaction.index);
}

export function createAccrueInterestEvent(
  id: Bytes,
  prevBorrowRate: BigInt,
  interest: BigInt,
  feeShares: BigInt,
  timestamp: BigInt
): AccrueInterest {
  const accrueInterestEvent = changetype<AccrueInterest>(
    newMockEvent(timestamp)
  );

  accrueInterestEvent.parameters = new Array();

  accrueInterestEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  accrueInterestEvent.parameters.push(
    new ethereum.EventParam(
      "prevBorrowRate",
      ethereum.Value.fromUnsignedBigInt(prevBorrowRate)
    )
  );
  accrueInterestEvent.parameters.push(
    new ethereum.EventParam(
      "interest",
      ethereum.Value.fromUnsignedBigInt(interest)
    )
  );
  accrueInterestEvent.parameters.push(
    new ethereum.EventParam(
      "feeShares",
      ethereum.Value.fromUnsignedBigInt(feeShares)
    )
  );

  return accrueInterestEvent;
}

export function createBorrowEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  receiver: Address,
  assets: BigInt,
  shares: BigInt,
  timestamp: BigInt
): Borrow {
  const borrowEvent = changetype<Borrow>(newMockEvent(timestamp));

  borrowEvent.parameters = new Array();

  borrowEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  borrowEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  borrowEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  borrowEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  );
  borrowEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );
  borrowEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  );

  return borrowEvent;
}

export function createCreateMarketEvent(
  id: Bytes,
  marketParams: ethereum.Tuple,

  timestamp: BigInt
): CreateMarket {
  const createMarketEvent = changetype<CreateMarket>(newMockEvent(timestamp));

  createMarketEvent.parameters = new Array();

  createMarketEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  createMarketEvent.parameters.push(
    new ethereum.EventParam(
      "marketParams",
      ethereum.Value.fromTuple(marketParams)
    )
  );

  return createMarketEvent;
}

export function createLiquidateEvent(
  id: Bytes,
  caller: Address,
  borrower: Address,
  repaidAssets: BigInt,
  repaidShares: BigInt,
  seizedAssets: BigInt,
  badDebtAssets: BigInt,
  badDebtShares: BigInt,
  timestamp: BigInt
): Liquidate {
  const liquidateEvent = changetype<Liquidate>(newMockEvent(timestamp));

  liquidateEvent.parameters = new Array();

  liquidateEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam("borrower", ethereum.Value.fromAddress(borrower))
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam(
      "repaidAssets",
      ethereum.Value.fromUnsignedBigInt(repaidAssets)
    )
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam(
      "repaidShares",
      ethereum.Value.fromUnsignedBigInt(repaidShares)
    )
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam(
      "seizedAssets",
      ethereum.Value.fromUnsignedBigInt(seizedAssets)
    )
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam(
      "badDebtAssets",
      ethereum.Value.fromUnsignedBigInt(badDebtAssets)
    )
  );
  liquidateEvent.parameters.push(
    new ethereum.EventParam(
      "badDebtShares",
      ethereum.Value.fromUnsignedBigInt(badDebtShares)
    )
  );

  return liquidateEvent;
}

export function createRepayEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  assets: BigInt,
  shares: BigInt,
  timestamp: BigInt
): Repay {
  const repayEvent = changetype<Repay>(newMockEvent(timestamp));

  repayEvent.parameters = new Array();

  repayEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  repayEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  repayEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  repayEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );
  repayEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  );

  return repayEvent;
}

export function createSetFeeRecipientEvent(
  newFeeRecipient: Address,
  timestamp: BigInt
): SetFeeRecipient {
  const setFeeRecipientEvent = changetype<SetFeeRecipient>(
    newMockEvent(timestamp)
  );

  setFeeRecipientEvent.parameters = new Array();

  setFeeRecipientEvent.parameters.push(
    new ethereum.EventParam(
      "newFeeRecipient",
      ethereum.Value.fromAddress(newFeeRecipient)
    )
  );

  return setFeeRecipientEvent;
}

export function createSupplyEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  assets: BigInt,
  shares: BigInt,
  timestamp: BigInt
): Supply {
  const supplyEvent = changetype<Supply>(newMockEvent(timestamp));

  supplyEvent.parameters = new Array();

  supplyEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  supplyEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  supplyEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  supplyEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );
  supplyEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  );

  return supplyEvent;
}

export function createSupplyCollateralEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  assets: BigInt,
  timestamp: BigInt
): SupplyCollateral {
  const supplyCollateralEvent = changetype<SupplyCollateral>(
    newMockEvent(timestamp)
  );

  supplyCollateralEvent.parameters = new Array();

  supplyCollateralEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  supplyCollateralEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  supplyCollateralEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  supplyCollateralEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );

  return supplyCollateralEvent;
}

export function createWithdrawEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  receiver: Address,
  assets: BigInt,
  shares: BigInt,
  timestamp: BigInt
): Withdraw {
  const withdrawEvent = changetype<Withdraw>(newMockEvent(timestamp));

  withdrawEvent.parameters = new Array();

  withdrawEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  );

  return withdrawEvent;
}

export function createWithdrawCollateralEvent(
  id: Bytes,
  caller: Address,
  onBehalf: Address,
  receiver: Address,
  assets: BigInt,
  timestamp: BigInt
): WithdrawCollateral {
  const withdrawCollateralEvent = changetype<WithdrawCollateral>(
    newMockEvent(timestamp)
  );

  withdrawCollateralEvent.parameters = new Array();

  withdrawCollateralEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  );
  withdrawCollateralEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  withdrawCollateralEvent.parameters.push(
    new ethereum.EventParam("onBehalf", ethereum.Value.fromAddress(onBehalf))
  );
  withdrawCollateralEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  );
  withdrawCollateralEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );

  return withdrawCollateralEvent;
}
