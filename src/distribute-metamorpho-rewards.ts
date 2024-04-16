import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import { MetaMorphoTx } from "../generated/schema";

import { setupMetaMorpho, setupMetaMorphoPosition } from "./initializers";

export function computeMetaMorphoPoints(
  mmAddress: Bytes,
  timestamp: BigInt
): void {
  // Here, we compute the number of points and the number of points that the user has accrued.

  const metaMorpho = setupMetaMorpho(mmAddress);

  const deltaT = timestamp.minus(metaMorpho.lastUpdate);
  if (deltaT.lt(BigInt.fromI32(0))) {
    log.critical("Negative deltaT for MetaMorpho {}", [
      mmAddress.toHexString(),
    ]);
  }

  const pointsEmitted = deltaT.times(metaMorpho.totalShares);
  metaMorpho.totalPoints = metaMorpho.totalPoints.plus(pointsEmitted);

  metaMorpho.lastUpdate = timestamp;
  metaMorpho.save();
}

export function computeMetaMorphoPositionPoints(
  mmAddress: Bytes,
  userAddress: Bytes,
  timestamp: BigInt
): void {
  const mmPosition = setupMetaMorphoPosition(mmAddress, userAddress);

  // One shard = one share for one second.
  const pointsReceived = timestamp
    .minus(mmPosition.lastUpdate)
    .times(mmPosition.shares);

  mmPosition.supplyPoints = mmPosition.supplyPoints.plus(pointsReceived);
  mmPosition.lastUpdate = timestamp;

  mmPosition.save();
}
export function distributeMetaMorphoRewards(mmTx: MetaMorphoTx): void {
  // position rewards

  computeMetaMorphoPoints(mmTx.metaMorpho, mmTx.timestamp);

  computeMetaMorphoPositionPoints(mmTx.metaMorpho, mmTx.user, mmTx.timestamp);

  // accounting. We update the total shares of the metamorpho and the position.
  const metaMorpho = setupMetaMorpho(mmTx.metaMorpho);

  const mmPosition = setupMetaMorphoPosition(mmTx.metaMorpho, mmTx.user);

  mmPosition.shares = mmPosition.shares.plus(mmTx.shares);
  mmPosition.save();
  metaMorpho.totalShares = metaMorpho.totalShares.plus(mmTx.shares);
  metaMorpho.save();
}
