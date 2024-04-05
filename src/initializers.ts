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

export function setupMarket(marketId: Bytes): Market {
  let market = Market.load(marketId);
  if (!market) {
    market = new Market(marketId);
    market.totalSupplyShares = BigInt.zero();
    market.totalBorrowShares = BigInt.zero();
    market.totalCollateral = BigInt.zero();

    market.totalSupplyShards = BigInt.zero();
    market.totalBorrowShards = BigInt.zero();
    market.totalCollateralShards = BigInt.zero();

    market.totalSupplyPoints = BigInt.zero();
    market.supplyPointsIndex = BigInt.zero();
    market.totalBorrowPoints = BigInt.zero();
    market.borrowPointsIndex = BigInt.zero();
    market.totalCollateralPoints = BigInt.zero();
    market.collateralPointsIndex = BigInt.zero();

    market.lastUpdate = BigInt.zero(); // This is going to be updated with the first update of the market total supplyShares/borrowShares/collateral

    market.save();
  }

  return market;
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

    position.supplyShards = BigInt.zero();
    position.borrowShards = BigInt.zero();
    position.collateralShards = BigInt.zero();

    position.lastUpdate = BigInt.zero(); // will be modified before adding any shares.

    position.supplyPoints = BigInt.zero();
    position.lastSupplyPointsIndex = BigInt.zero();
    position.borrowPoints = BigInt.zero();
    position.lastBorrowPointsIndex = BigInt.zero();
    position.collateralPoints = BigInt.zero();
    position.lastCollateralPointsIndex = BigInt.zero();

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
  userAddress: Bytes,
  metaMorphoAddress: Bytes
): MetaMorphoPosition {
  const mmPositionId = hashBytes(metaMorphoAddress.concat(userAddress));
  let metaMorphoPosition = MetaMorphoPosition.load(mmPositionId);
  if (!metaMorphoPosition) {
    metaMorphoPosition = new MetaMorphoPosition(mmPositionId);

    metaMorphoPosition.metaMorpho = setupMetaMorpho(metaMorphoAddress).id;

    metaMorphoPosition.user = setupUser(userAddress).id;

    metaMorphoPosition.shares = BigInt.zero();

    metaMorphoPosition.supplyShards = BigInt.zero();
    metaMorphoPosition.lastUpdate = BigInt.zero();

    metaMorphoPosition.supplyPoints = BigInt.zero();
    metaMorphoPosition.lastSupplyPointsIndex = BigInt.zero();

    metaMorphoPosition.save();
  }
  return metaMorphoPosition;
}
