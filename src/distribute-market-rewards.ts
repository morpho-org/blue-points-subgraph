import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import { MorphoTx } from "../generated/schema";

import { getMarket, setupPosition } from "./initializers";
import { PositionType } from "./utils";

export function computeMarketShards(marketId: Bytes, timestamp: BigInt): void {
  const market = getMarket(marketId);

  const deltaT = timestamp.minus(market.lastUpdate);
  if (deltaT.lt(BigInt.fromI32(0))) {
    log.critical("Negative deltaT for MetaMorpho {}", [
      market.id.toHexString(),
    ]);
  }

  const supplyShardsEmitted = deltaT.times(market.totalSupplyShares);
  market.totalSupplyShards = market.totalSupplyShards.plus(supplyShardsEmitted);

  const borrowShardsEmitted = deltaT.times(market.totalBorrowShares);
  market.totalBorrowShards = market.totalBorrowShards.plus(borrowShardsEmitted);

  const collateralShardsEmitted = deltaT.times(market.totalCollateral);
  market.totalCollateralShards = market.totalCollateralShards.plus(
    collateralShardsEmitted
  );

  market.lastUpdate = timestamp;
  market.save();
}

export function computeUserPositionShards(
  marketId: Bytes,
  userAddress: Bytes,
  timestamp: BigInt
): void {
  const position = setupPosition(marketId, userAddress);

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
  computeMarketShards(morphoTx.market, morphoTx.timestamp);
  computeUserPositionShards(morphoTx.market, morphoTx.user, morphoTx.timestamp);

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
