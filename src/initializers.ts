import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import {
  Market,
  MetaMorpho,
  MetaMorphoPosition,
  Position,
  User,
} from "../generated/schema";

import { hashBytes } from "./utils";

export function getMarket(marketId: Bytes): Market {
  let market = Market.load(marketId);
  if (!market) {
    log.critical("Market {} not found", [marketId.toHexString()]);
    return market!;
  }

  return market;
}

export function setupUser(address: Bytes): User {
  let user = User.load(address);
  if (!user) {
    user = new User(address);
    user.save();
  }
  return user;
}

export function setupPosition(marketId: Bytes, userAddress: Bytes): Position {
  const positionId = hashBytes(marketId.concat(userAddress));
  let position = Position.load(positionId);

  if (!position) {
    position = new Position(positionId);
    position.user = setupUser(userAddress).id;
    position.market = marketId;
    position.supplyShares = BigInt.zero();
    position.borrowShares = BigInt.zero();
    position.collateral = BigInt.zero();

    position.supplyPoints = BigInt.zero();
    position.borrowPoints = BigInt.zero();
    position.collateralPoints = BigInt.zero();

    position.lastUpdate = BigInt.zero(); // will be modified before adding any shares.

    position.save();
  }

  return position;
}

export function setupMetaMorpho(address: Bytes): MetaMorpho {
  let metaMorpho = MetaMorpho.load(address);
  if (!metaMorpho) {
    log.critical("MetaMorpho {} not found", [address.toHexString()]);
    return metaMorpho!;
  }
  return metaMorpho;
}

export function setupMetaMorphoPosition(
  metaMorphoAddress: Bytes,
  userAddress: Bytes
): MetaMorphoPosition {
  const mmPositionId = hashBytes(metaMorphoAddress.concat(userAddress));
  let metaMorphoPosition = MetaMorphoPosition.load(mmPositionId);
  if (!metaMorphoPosition) {
    metaMorphoPosition = new MetaMorphoPosition(mmPositionId);

    metaMorphoPosition.metaMorpho = setupMetaMorpho(metaMorphoAddress).id;

    metaMorphoPosition.user = setupUser(userAddress).id;

    metaMorphoPosition.shares = BigInt.zero();

    metaMorphoPosition.supplyPoints = BigInt.zero();
    metaMorphoPosition.lastUpdate = BigInt.zero();

    metaMorphoPosition.save();
  }
  return metaMorphoPosition;
}
