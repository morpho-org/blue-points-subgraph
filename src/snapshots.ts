import { BigInt } from "@graphprotocol/graph-ts";

import {
  Market,
  MarketSnapshot,
  MetaMorpho,
  MetaMorphoPosition,
  MetaMorphoPositionSnapshot,
  MetaMorphoSnapshot,
  Position,
  PositionSnapshot,
} from "../generated/schema";

export function snapshotMarket(
  market: Market,
  timestamp: BigInt,
  blockNumber: BigInt
): MarketSnapshot {
  const snapshotId = market.id.toHexString() + "-" + timestamp.toString();

  let snapshot = MarketSnapshot.load(snapshotId);
  if (!snapshot) {
    snapshot = new MarketSnapshot(snapshotId);
  }

  snapshot.market = market.id;
  snapshot.totalSupplyShares = market.totalSupplyShares;
  snapshot.totalSupplyAssets = market.totalSupplyAssets;
  snapshot.totalBorrowShares = market.totalBorrowShares;
  snapshot.totalBorrowAssets = market.totalBorrowAssets;
  snapshot.totalCollateral = market.totalCollateral;
  snapshot.totalSupplyPoints = market.totalSupplyPoints;
  snapshot.totalBorrowPoints = market.totalBorrowPoints;
  snapshot.totalCollateralPoints = market.totalCollateralPoints;

  if (market.lastUpdate != timestamp)
    snapshot.previousSnapshot =
      market.id.toHexString() + "-" + market.lastUpdate.toString();

  snapshot.timestamp = timestamp;
  snapshot.blockNumber = blockNumber;
  snapshot.save();
  return snapshot;
}

export function snapshotPosition(
  position: Position,
  marketSnapshot: MarketSnapshot,
  timestamp: BigInt,
  blockNumber: BigInt
): PositionSnapshot {
  const snapshotId = position.id.toHexString() + "-" + timestamp.toString();

  let snapshot = PositionSnapshot.load(snapshotId);
  if (!snapshot) {
    snapshot = new PositionSnapshot(snapshotId);
  }

  snapshot.position = position.id;
  snapshot.user = position.user;
  snapshot.marketSnapshot = marketSnapshot.id;
  snapshot.supplyShares = position.supplyShares;
  snapshot.borrowShares = position.borrowShares;
  snapshot.collateral = position.collateral;
  snapshot.supplyPoints = position.supplyPoints;
  snapshot.borrowPoints = position.borrowPoints;
  snapshot.collateralPoints = position.collateralPoints;
  snapshot.ofMetaMorpho = position.ofMetaMorpho;

  if (position.lastUpdate != timestamp)
    snapshot.previousSnapshot =
      position.id.toHexString() + "-" + position.lastUpdate.toString();

  snapshot.timestamp = timestamp;
  snapshot.blockNumber = blockNumber;
  snapshot.save();
  return snapshot;
}

export function snapshotMetaMorpho(
  metaMorpho: MetaMorpho,
  timestamp: BigInt,
  blockNumber: BigInt
): MetaMorphoSnapshot {
  const snapshotId = metaMorpho.id.toHexString() + "-" + timestamp.toString();

  let snapshot = MetaMorphoSnapshot.load(snapshotId);
  if (!snapshot) {
    snapshot = new MetaMorphoSnapshot(snapshotId);
  }

  snapshot.metaMorpho = metaMorpho.id;
  snapshot.feeRecipient = metaMorpho.feeRecipient;
  snapshot.totalShares = metaMorpho.totalShares;
  snapshot.totalAssets = metaMorpho.totalAssets;
  snapshot.totalPoints = metaMorpho.totalPoints;

  if (metaMorpho.lastUpdate != timestamp)
    snapshot.previousSnapshot =
      metaMorpho.id.toHexString() + "-" + metaMorpho.lastUpdate.toString();

  snapshot.timestamp = timestamp;
  snapshot.blockNumber = blockNumber;
  snapshot.save();
  return snapshot;
}

export function snapshotMetaMorphoPosition(
  position: MetaMorphoPosition,
  metaMorphoSnapshot: MetaMorphoSnapshot,
  timestamp: BigInt,
  blockNumber: BigInt
): MetaMorphoPositionSnapshot {
  const snapshotId = position.id.toHexString() + "-" + timestamp.toString();

  let snapshot = MetaMorphoPositionSnapshot.load(snapshotId);
  if (!snapshot) {
    snapshot = new MetaMorphoPositionSnapshot(snapshotId);
  }

  snapshot.metaMorphoSnapshot = metaMorphoSnapshot.id;
  snapshot.user = position.user;
  snapshot.shares = position.shares;
  snapshot.supplyPoints = position.supplyPoints;

  if (position.lastUpdate != timestamp)
    snapshot.previousSnapshot =
      position.id.toHexString() + "-" + position.lastUpdate.toString();

  snapshot.timestamp = timestamp;
  snapshot.blockNumber = blockNumber;
  snapshot.save();
  return snapshot;
}
