import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import { MetaMorphoTx } from "../generated/schema";

import { POINTS_RATE_PER_SECONDS, PRECISION } from "./constants";
import { setupMetaMorpho, setupMetaMorphoPosition } from "./initializers";

export function computeVaultPoints(mmAddress: Bytes, timestamp: BigInt): void {
  // Here, we compute the number of shards and the number of points that the user has accrued.

  const metaMorpho = setupMetaMorpho(mmAddress);

  const deltaT = timestamp.minus(metaMorpho.lastUpdate);
  if (deltaT.lt(BigInt.fromI32(0))) {
    log.critical("Negative deltaT for MetaMorpho {}", [
      mmAddress.toHexString(),
    ]);
  }

  if (metaMorpho.totalShares.gt(BigInt.zero())) {
    const pointEmitted = deltaT.times(POINTS_RATE_PER_SECONDS);

    metaMorpho.totalPoints = metaMorpho.totalPoints.plus(pointEmitted);

    metaMorpho.pointsIndex = metaMorpho.pointsIndex.plus(
      pointEmitted.times(PRECISION).div(metaMorpho.totalShares)
    );

    const shardsEmitted = deltaT.times(metaMorpho.totalShares);

    metaMorpho.totalShards = metaMorpho.totalShards.plus(shardsEmitted);
  }

  metaMorpho.lastUpdate = timestamp;
  metaMorpho.save();
}

export function computeMetaMorphoPositionPoints(
  mmAddress: Bytes,
  userAddress: Bytes,
  timestamp: BigInt
): void {
  const mmPosition = setupMetaMorphoPosition(userAddress, mmAddress);

  const metaMorpho = setupMetaMorpho(mmAddress);
  // One shard = one share for one second.
  const shardsReceived = timestamp
    .minus(mmPosition.lastUpdate)
    .times(mmPosition.shares);

  mmPosition.supplyShards = mmPosition.supplyShards.plus(shardsReceived);
  mmPosition.lastUpdate = timestamp;

  const pointsReceived = metaMorpho.pointsIndex
    .minus(mmPosition.lastSupplyPointsIndex)
    .times(mmPosition.shares)
    .div(PRECISION);

  mmPosition.supplyPoints = mmPosition.supplyPoints.plus(pointsReceived);
  mmPosition.lastSupplyPointsIndex = metaMorpho.pointsIndex;
  mmPosition.save();
}
export function distributeMetaMorphoRewards(mmTx: MetaMorphoTx): void {
  // position rewards

  computeVaultPoints(mmTx.metaMorpho, mmTx.timestamp);

  computeMetaMorphoPositionPoints(mmTx.metaMorpho, mmTx.user, mmTx.timestamp);

  // accounting. We update the total shares of the metamorpho and the position.
  const metaMorpho = setupMetaMorpho(mmTx.metaMorpho);

  const mmPosition = setupMetaMorphoPosition(mmTx.user, mmTx.metaMorpho);

  mmPosition.shares = mmPosition.shares.plus(mmTx.shares);
  metaMorpho.totalShares = metaMorpho.totalShares.plus(mmTx.shares);
  metaMorpho.save();
}
