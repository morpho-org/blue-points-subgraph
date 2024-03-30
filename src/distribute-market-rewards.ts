import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import { MorphoTx } from "../generated/schema";

import { POINTS_RATE_PER_SECONDS, PRECISION } from "./constants";
import { getMarket, setupPosition } from "./initializers";
import { PositionType } from "./utils";

export function computeMarketPoints(marketId: Bytes, timestamp: BigInt): void {
  const market = getMarket(marketId);

  const deltaT = timestamp.minus(market.lastUpdate);
  if (deltaT.lt(BigInt.fromI32(0))) {
    log.critical("Negative deltaT for MetaMorpho {}", [
      market.id.toHexString(),
    ]);
  }

  const pointEmitted = deltaT.times(POINTS_RATE_PER_SECONDS);
  if (market.totalSupplyShares.gt(BigInt.zero())) {
    market.totalSupplyPoints = market.totalSupplyPoints.plus(pointEmitted);
    market.supplyPointsIndex = market.supplyPointsIndex.plus(
      pointEmitted.times(PRECISION).div(market.totalSupplyShares)
    );
  }

  if (market.totalBorrowShares.gt(BigInt.zero())) {
    market.totalBorrowPoints = market.totalBorrowPoints.plus(pointEmitted);
    market.borrowPointsIndex = market.borrowPointsIndex.plus(
      pointEmitted.times(PRECISION).div(market.totalBorrowShares)
    );
  }

  if (market.totalCollateral.gt(BigInt.zero())) {
    market.totalCollateralPoints =
      market.totalCollateralPoints.plus(pointEmitted);
    market.collateralPointsIndex = market.collateralPointsIndex.plus(
      pointEmitted.times(PRECISION).div(market.totalCollateral)
    );
  }

  if (market.totalSupplyShares.gt(BigInt.zero())) {
    const supplyShardsEmitted = deltaT.times(market.totalSupplyShares);
    market.totalSupplyShards =
      market.totalSupplyShards.plus(supplyShardsEmitted);
  }

  if (market.totalBorrowShares.gt(BigInt.zero())) {
    const borrowShardsEmitted = deltaT.times(market.totalBorrowShares);
    market.totalBorrowShards =
      market.totalBorrowShards.plus(borrowShardsEmitted);
  }

  if (market.totalCollateral.gt(BigInt.zero())) {
    const collateralShardsEmitted = deltaT.times(market.totalCollateral);
    market.totalCollateralShards = market.totalCollateralShards.plus(
      collateralShardsEmitted
    );
  }

  market.lastUpdate = timestamp;
  market.save();
}

export function computeUserPoints(
  marketId: Bytes,
  userAddress: Bytes,
  timestamp: BigInt
): void {
  const market = getMarket(marketId);
  const position = setupPosition(marketId, userAddress);

  const supplyPointsAccrued = market.supplyPointsIndex
    .minus(position.lastSupplyPointsIndex)
    .times(position.supplyShares);
  position.supplyPoints = position.supplyPoints.plus(supplyPointsAccrued);
  position.lastSupplyPointsIndex = market.supplyPointsIndex;

  const borrowPointsAccrued = market.borrowPointsIndex
    .minus(position.lastBorrowPointsIndex)
    .times(position.borrowShares);
  position.borrowPoints = position.borrowPoints.plus(borrowPointsAccrued);
  position.lastBorrowPointsIndex = market.borrowPointsIndex;

  const collateralPointsAccrued = market.collateralPointsIndex
    .minus(position.lastCollateralPointsIndex)
    .times(position.collateral);
  position.collateralPoints = position.collateralPoints.plus(
    collateralPointsAccrued
  );
  position.lastCollateralPointsIndex = market.collateralPointsIndex;

  // Account of shards
  const supplyShardsReceived = timestamp
    .minus(position.lastUpdate)
    .times(position.supplyShares);
  position.supplyShards = position.supplyShards.plus(supplyShardsReceived);

  const borrowShardsReceived = timestamp
    .minus(position.lastUpdate)
    .times(position.borrowShares);
  position.borrowShards = position.borrowShards.plus(borrowShardsReceived);

  const collateralShardsReceived = timestamp
    .minus(position.lastUpdate)
    .times(position.collateral);
  position.collateralShards = position.collateralShards.plus(
    collateralShardsReceived
  );

  position.lastUpdate = timestamp;
  position.save();
}
export function handleMorphoTx(morphoTx: MorphoTx): void {
  computeMarketPoints(morphoTx.market, morphoTx.timestamp);
  computeUserPoints(morphoTx.market, morphoTx.user, morphoTx.timestamp);

  const market = getMarket(morphoTx.market);
  const position = setupPosition(morphoTx.market, morphoTx.user);

  // account of the morphoTx
  if (morphoTx.type === PositionType.SUPPLY) {
    position.supplyShares = position.supplyShares.plus(morphoTx.shares);
    market.totalSupplyShares = market.totalSupplyShares.plus(morphoTx.shares);
  } else if (morphoTx.type === PositionType.BORROW) {
    position.borrowShares = position.borrowShares.plus(morphoTx.shares);
    market.totalBorrowShares = market.totalBorrowShares.plus(morphoTx.shares);
  } else if (morphoTx.type === PositionType.COLLATERAL) {
    position.collateral = position.collateral.plus(morphoTx.shares);
    market.totalCollateral = market.totalCollateral.plus(morphoTx.shares);
  }

  position.save();
  market.save();
}
