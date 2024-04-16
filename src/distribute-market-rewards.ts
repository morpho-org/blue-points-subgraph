import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import { MorphoTx } from "../generated/schema";

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

  const supplyPointsEmitted = deltaT.times(market.totalSupplyShares);
  market.totalSupplyPoints = market.totalSupplyPoints.plus(supplyPointsEmitted);

  const borrowPointsEmitted = deltaT.times(market.totalBorrowShares);
  market.totalBorrowPoints = market.totalBorrowPoints.plus(borrowPointsEmitted);

  const collateralPointsEmitted = deltaT.times(market.totalCollateral);
  market.totalCollateralPoints = market.totalCollateralPoints.plus(
    collateralPointsEmitted
  );

  market.lastUpdate = timestamp;
  market.save();
}

export function computeUserPositionPoints(
  marketId: Bytes,
  userAddress: Bytes,
  timestamp: BigInt
): void {
  const position = setupPosition(marketId, userAddress);

  // Account of points
  const supplyPointsReceived = timestamp
    .minus(position.lastUpdate)
    .times(position.supplyShares);
  position.supplyPoints = position.supplyPoints.plus(supplyPointsReceived);

  const borrowPointsReceived = timestamp
    .minus(position.lastUpdate)
    .times(position.borrowShares);
  position.borrowPoints = position.borrowPoints.plus(borrowPointsReceived);

  const collateralPointsReceived = timestamp
    .minus(position.lastUpdate)
    .times(position.collateral);
  position.collateralPoints = position.collateralPoints.plus(
    collateralPointsReceived
  );

  position.lastUpdate = timestamp;
  position.save();
}
export function handleMorphoTx(morphoTx: MorphoTx): void {
  computeMarketPoints(morphoTx.market, morphoTx.timestamp);
  computeUserPositionPoints(morphoTx.market, morphoTx.user, morphoTx.timestamp);

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
