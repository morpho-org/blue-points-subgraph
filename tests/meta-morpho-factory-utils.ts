import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { CreateMetaMorpho } from "../generated/MetaMorphoFactory/MetaMorphoFactory";

import { newMockEvent } from "./defaults";

export function createCreateMetaMorphoEvent(
  metaMorpho: Address,
  caller: Address,
  initialOwner: Address,
  initialTimelock: BigInt,
  asset: Address,
  name: string,
  symbol: string,
  salt: Bytes,
  timestamp: BigInt
): CreateMetaMorpho {
  const createMetaMorphoEvent = changetype<CreateMetaMorpho>(
    newMockEvent(timestamp)
  );

  createMetaMorphoEvent.parameters = new Array();

  createMetaMorphoEvent.parameters.push(
    new ethereum.EventParam(
      "metaMorpho",
      ethereum.Value.fromAddress(metaMorpho)
    )
  );
  createMetaMorphoEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  createMetaMorphoEvent.parameters.push(
    new ethereum.EventParam(
      "initialOwner",
      ethereum.Value.fromAddress(initialOwner)
    )
  );
  createMetaMorphoEvent.parameters.push(
    new ethereum.EventParam(
      "initialTimelock",
      ethereum.Value.fromUnsignedBigInt(initialTimelock)
    )
  );
  createMetaMorphoEvent.parameters.push(
    new ethereum.EventParam("asset", ethereum.Value.fromAddress(asset))
  );
  createMetaMorphoEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  );
  createMetaMorphoEvent.parameters.push(
    new ethereum.EventParam("symbol", ethereum.Value.fromString(symbol))
  );
  createMetaMorphoEvent.parameters.push(
    new ethereum.EventParam("salt", ethereum.Value.fromFixedBytes(salt))
  );

  return createMetaMorphoEvent;
}
