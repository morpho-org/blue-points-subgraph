import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import { MetaMorphoTx } from "../generated/schema";

import { setupMetaMorpho, setupMetaMorphoPosition } from "./initializers";
import { snapshotMetaMorpho, snapshotMetaMorphoPosition } from "./snapshots";

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

  metaMorpho.save();
}

export function computeMetaMorphoPositionPoints(
  mmAddress: Bytes,
  userAddress: Bytes,
  timestamp: BigInt
): void {
  const mmPosition = setupMetaMorphoPosition(mmAddress, userAddress);

  // One point = one share for one second.
  const pointsReceived = timestamp
    .minus(mmPosition.lastUpdate)
    .times(mmPosition.shares);

  mmPosition.supplyPoints = mmPosition.supplyPoints.plus(pointsReceived);

  mmPosition.save();
}
export function distributeMetaMorphoRewards(mmTx: MetaMorphoTx): void {
  // position rewards

  computeMetaMorphoPoints(mmTx.metaMorpho, mmTx.timestamp);

  computeMetaMorphoPositionPoints(mmTx.metaMorpho, mmTx.user, mmTx.timestamp);

  // accounting. We update the total shares of the metamorpho and the position.
  const metaMorpho = setupMetaMorpho(mmTx.metaMorpho);

  const mmPosition = setupMetaMorphoPosition(mmTx.metaMorpho, mmTx.user);

  metaMorpho.totalShares = metaMorpho.totalShares.plus(mmTx.shares);
  metaMorpho.save();
  const metaMorphoSnapshot = snapshotMetaMorpho(
    metaMorpho,
    mmTx.timestamp,
    mmTx.blockNumber
  );

  mmPosition.shares = mmPosition.shares.plus(mmTx.shares);
  mmPosition.save();
  snapshotMetaMorphoPosition(
    mmPosition,
    metaMorphoSnapshot,
    mmTx.timestamp,
    mmTx.blockNumber
  );

  // we update the lastUpdate field after the snapshots are taken.
  // this allows us to store the previous snapshot id for each snapshot.
  metaMorpho.lastUpdate = mmTx.timestamp;
  metaMorpho.save();
  mmPosition.lastUpdate = mmTx.timestamp;
  mmPosition.save();
}
