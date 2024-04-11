import { assert } from "matchstick-as";

import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts";

import { MetaMorphoTx } from "../generated/schema";
import {
  Deposit,
  SetFeeRecipient,
  Transfer,
  Withdraw,
  AccrueInterest,
} from "../generated/templates/MetaMorpho/MetaMorpho";

import { newMockEvent } from "./defaults";

export function checkTxEventFields(
  metaMorphoTx: MetaMorphoTx,
  event: ethereum.Event
): void {
  assert.bigIntEquals(metaMorphoTx!.timestamp, event.block.timestamp);
  assert.bigIntEquals(metaMorphoTx!.blockNumber, event.block.number);
  assert.bigIntEquals(metaMorphoTx!.logIndex, event.logIndex);
  assert.bytesEquals(metaMorphoTx!.txHash, event.transaction.hash);
  assert.bigIntEquals(metaMorphoTx!.txIndex, event.transaction.index);
}

export function createAccrueInterestEvent(
  newTotalAssets: BigInt,
  feeShares: BigInt,
  timestamp: BigInt
): AccrueInterest {
  const accrueFeeEvent = changetype<AccrueInterest>(newMockEvent(timestamp));

  accrueFeeEvent.parameters = new Array();

  accrueFeeEvent.parameters.push(
    new ethereum.EventParam(
      "newTotalAssets",
      ethereum.Value.fromUnsignedBigInt(newTotalAssets)
    )
  );
  accrueFeeEvent.parameters.push(
    new ethereum.EventParam(
      "feeShares",
      ethereum.Value.fromUnsignedBigInt(feeShares)
    )
  );

  return accrueFeeEvent;
}

export function createDepositEvent(
  sender: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt,
  timestamp: BigInt
): Deposit {
  const depositEvent = changetype<Deposit>(newMockEvent(timestamp));

  depositEvent.parameters = new Array();

  depositEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  );
  depositEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  );
  depositEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );
  depositEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  );

  return depositEvent;
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

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt,
  timestamp: BigInt
): Transfer {
  const transferEvent = changetype<Transfer>(newMockEvent(timestamp));

  transferEvent.parameters = new Array();

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  );
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  );
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  );

  return transferEvent;
}

export function createWithdrawEvent(
  sender: Address,
  receiver: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt,
  timestamp: BigInt
): Withdraw {
  const withdrawEvent = changetype<Withdraw>(newMockEvent(timestamp));

  withdrawEvent.parameters = new Array();

  withdrawEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  );
  withdrawEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  );

  return withdrawEvent;
}
