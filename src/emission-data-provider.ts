import { RewardsEmissionSet as RewardsEmissionSetEvent } from "../generated/EmissionDataProvider/EmissionDataProvider"
import {RateUpdateTx, RewardsRate} from "../generated/schema";
import {BigInt, Bytes} from "@graphprotocol/graph-ts";


export const INITIAL_INDEX = BigInt.fromI32(1e18 as i32);
export function handleRewardsEmissionSet(event: RewardsEmissionSetEvent): void {

    const id = event.params.sender
        .concat(event.params.market)
        .concat(event.params.urd)
        .concat(event.params.rewardToken)
    let rewardsRate = RewardsRate.load(id);

    if(!rewardsRate) {
        rewardsRate = new RewardsRate(id);
        // TODO: handle previously defined rates.
        rewardsRate.supplyIndex = INITIAL_INDEX;
        rewardsRate.borrowIndex = INITIAL_INDEX;
        rewardsRate.collateralIndex = INITIAL_INDEX;
        rewardsRate.sender = event.params.sender;
        rewardsRate.urd = event.params.urd; // TODO: setupURD
        rewardsRate.rewardToken = event.params.rewardToken;
        rewardsRate.market = event.params.market; // TODO: setupMarket

    } else {
        // TODO: update the distribution up to the new timestamp.
    }


    rewardsRate.supplyRatePerYear = event.params.rewardsEmission.supplyRatePerYear;
    rewardsRate.borrowRatePerYear = event.params.rewardsEmission.borrowRatePerYear;
    rewardsRate.collateralRatePerYear = event.params.rewardsEmission.collateralRatePerYear;

    rewardsRate.availableAt = event.block.timestamp;

    rewardsRate.save();

    const rateUpdateTx = new RateUpdateTx(event.transaction.hash.concat(Bytes.fromHexString(event.logIndex.toHexString())));
    rateUpdateTx.sender = event.params.sender;
    rateUpdateTx.urd = event.params.urd;
    rateUpdateTx.rewardToken = event.params.rewardToken;
    rateUpdateTx.market = event.params.market;
    rateUpdateTx.supplyRatePerYear = event.params.rewardsEmission.supplyRatePerYear;
    rateUpdateTx.borrowRatePerYear = event.params.rewardsEmission.borrowRatePerYear;
    rateUpdateTx.collateralRatePerYear = event.params.rewardsEmission.collateralRatePerYear;
    rateUpdateTx.timestamp = event.block.timestamp;

    rateUpdateTx.txHash = event.transaction.hash;
    rateUpdateTx.txIndex = event.transaction.index;
    rateUpdateTx.logIndex = event.logIndex;

    rateUpdateTx.blockNumber = event.block.number;
    rateUpdateTx.save();
}
