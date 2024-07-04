import { BigInt } from "@graphprotocol/graph-ts";

import { CreateMetaMorpho as CreateMetaMorphoEvent } from "../../generated/MetaMorphoFactory/MetaMorphoFactory";
import { MetaMorpho as MetaMorphoEntity, User } from "../../generated/schema";
import { MetaMorpho as MetaMorphoTemplate } from "../../generated/templates";

export function handleCreateMetaMorpho(event: CreateMetaMorphoEvent): void {
  const mmEntity = new MetaMorphoEntity(event.params.metaMorpho);
  mmEntity.totalShares = BigInt.zero();
  mmEntity.totalAssets = BigInt.zero();

  mmEntity.totalPoints = BigInt.zero();

  mmEntity.lastUpdate = event.block.timestamp;
  mmEntity.save();

  const user = User.load(event.params.metaMorpho);

  if (user) {
    // handle the fact that metamorpho can already have Morpho positions here (because of a donation to a not yet deployed vault)
    // const positions = user.positions.load();
    // for (let i = 0; i < positions.length; i++) {
    //   const position = Position.load(positions[i].id)!;
    //   position.ofMetaMorpho == event.params.metaMorpho;
    //   position.save();
    // }
  }

  MetaMorphoTemplate.create(event.params.metaMorpho);
}
