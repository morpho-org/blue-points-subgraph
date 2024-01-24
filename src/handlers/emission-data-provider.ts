import { RewardsEmissionSet as RewardsEmissionSetEvent } from "../../generated/EmissionDataProvider/EmissionDataProvider";
import {
  RateUpdateTx,
  RewardProgram,
  RewardsRate,
} from "../../generated/schema";
import { INITIAL_INDEX } from "../constants";
import { updateRewardsRate } from "../distribute-rewards";
import { setupMarket, setupURD, setupUser } from "../initializers";
import { generateLogId, hashBytes } from "../utils";

export function handleRewardsEmissionSet(event: RewardsEmissionSetEvent): void {
  const rewardProgramId = hashBytes(
    event.params.sender
      .concat(event.params.rewardToken)
      .concat(event.params.urd)
  );

  let rewardProgram = RewardProgram.load(rewardProgramId);
  if (!rewardProgram) {
    rewardProgram = new RewardProgram(rewardProgramId);
    rewardProgram.sender = setupUser(event.params.sender).id;
    rewardProgram.rewardToken = event.params.rewardToken;
    rewardProgram.urd = setupURD(event.params.urd).id;
    rewardProgram.save();
  }

  const id = hashBytes(rewardProgram.id.concat(event.params.market));
  let rewardsRate = RewardsRate.load(id);

  if (!rewardsRate) {
    rewardsRate = new RewardsRate(id);
    rewardsRate.supplyIndex = INITIAL_INDEX;
    rewardsRate.borrowIndex = INITIAL_INDEX;
    rewardsRate.collateralIndex = INITIAL_INDEX;
    rewardsRate.rewardProgram = rewardProgram.id;
    rewardsRate.market = setupMarket(event.params.market).id;
    rewardsRate.lastUpdateTimestamp = event.block.timestamp;
  } else {
    // Update the distribution up to the new timestamp.
    rewardsRate = updateRewardsRate(rewardsRate, event.block.timestamp);
  }

  rewardsRate.supplyRatePerYear =
    event.params.rewardsEmission.supplyRewardTokensPerYear;
  rewardsRate.borrowRatePerYear =
    event.params.rewardsEmission.borrowRewardTokensPerYear;
  rewardsRate.collateralRatePerYear =
    event.params.rewardsEmission.collateralRewardTokensPerYear;

  rewardsRate.availableAt = event.block.timestamp;

  rewardsRate.save();

  const rateUpdateTx = new RateUpdateTx(generateLogId(event));
  // entities already set
  rateUpdateTx.sender = event.params.sender;
  rateUpdateTx.urd = event.params.urd;
  rateUpdateTx.rewardToken = event.params.rewardToken;
  rateUpdateTx.rewardProgram = rewardProgram.id;
  rateUpdateTx.rewardsRate = rewardsRate.id;
  rateUpdateTx.market = event.params.market;
  rateUpdateTx.supplyRatePerYear =
    event.params.rewardsEmission.supplyRewardTokensPerYear;
  rateUpdateTx.borrowRatePerYear =
    event.params.rewardsEmission.borrowRewardTokensPerYear;
  rateUpdateTx.collateralRatePerYear =
    event.params.rewardsEmission.collateralRewardTokensPerYear;
  rateUpdateTx.timestamp = event.block.timestamp;

  rateUpdateTx.txHash = event.transaction.hash;
  rateUpdateTx.txIndex = event.transaction.index;
  rateUpdateTx.logIndex = event.logIndex;

  rateUpdateTx.blockNumber = event.block.number;
  rateUpdateTx.save();
}
