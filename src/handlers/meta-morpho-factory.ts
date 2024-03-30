import { BigInt } from "@graphprotocol/graph-ts";

import { CreateMetaMorpho as CreateMetaMorphoEvent } from "../../generated/MetaMorphoFactory/MetaMorphoFactory";
import { MetaMorpho as MetaMorphoEntity, User } from "../../generated/schema";
import { MetaMorpho as MetaMorphoTemplate } from "../../generated/templates";

export function handleCreateMetaMorpho(event: CreateMetaMorphoEvent): void {
  const mmEntity = new MetaMorphoEntity(event.params.metaMorpho);
  mmEntity.totalShares = BigInt.zero();

  mmEntity.totalShards = BigInt.zero();

  mmEntity.totalPoints = BigInt.zero();
  mmEntity.pointsIndex = BigInt.zero();

  mmEntity.lastUpdate = event.block.timestamp;
  mmEntity.save();

  const user = User.load(event.params.metaMorpho);

  if (user) {
    // TODO: handle the fact that metamorpho can already have Morpho positions here.
  }

  MetaMorphoTemplate.create(event.params.metaMorpho);
}
