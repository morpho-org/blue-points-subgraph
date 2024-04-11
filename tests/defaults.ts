import {
  Address,
  BigInt,
  Bytes,
  Wrapped,
  ethereum,
} from "@graphprotocol/graph-ts";

const defaultAddress = Address.fromString(
  "0xA16081F360e3847006dB660bae1c6d1b2e17eC2A"
);
const defaultAddressBytes = defaultAddress as Bytes;
const defaultBigInt = BigInt.fromI32(1);
const defaultIntBytes = Bytes.fromI32(1);
const defaultEventDataLogType = "default_log_type";

export function newMockEvent(timestamp: BigInt): ethereum.Event {
  return new ethereum.Event(
    defaultAddress,
    defaultBigInt,
    defaultBigInt,
    defaultEventDataLogType,
    newBlock(timestamp),
    newTransaction(),
    [],
    newTransactionReceipt()
  );
}

function newBlock(timestamp: BigInt): ethereum.Block {
  return new ethereum.Block(
    defaultAddressBytes,
    defaultAddressBytes,
    defaultAddressBytes,
    defaultAddress,
    defaultAddressBytes,
    defaultAddressBytes,
    defaultAddressBytes,
    defaultBigInt,
    defaultBigInt,
    defaultBigInt,
    timestamp,
    defaultBigInt,
    defaultBigInt,
    defaultBigInt,
    defaultBigInt
  );
}

function newTransaction(): ethereum.Transaction {
  return new ethereum.Transaction(
    defaultAddressBytes,
    defaultBigInt,
    defaultAddress,
    defaultAddress,
    defaultBigInt,
    defaultBigInt,
    defaultBigInt,
    defaultAddressBytes,
    defaultBigInt
  );
}

function newTransactionReceipt(): ethereum.TransactionReceipt {
  return new ethereum.TransactionReceipt(
    defaultAddressBytes,
    defaultBigInt,
    defaultAddressBytes,
    defaultBigInt,
    defaultBigInt,
    defaultBigInt,
    defaultAddress,
    [newLog()],
    defaultBigInt,
    defaultAddressBytes,
    defaultAddressBytes
  );
}

function newLog(): ethereum.Log {
  return new ethereum.Log(
    defaultAddress,
    [defaultAddressBytes],
    defaultAddressBytes,
    defaultAddressBytes,
    defaultIntBytes,
    defaultAddressBytes,
    defaultBigInt,
    defaultBigInt,
    defaultBigInt,
    defaultEventDataLogType,
    new Wrapped(false)
  );
}
