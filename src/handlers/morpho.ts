import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import {
  AccrueInterest as AccrueInterestEvent,
  Borrow as BorrowEvent,
  Liquidate as LiquidateEvent,
  Repay as RepayEvent,
  Supply as SupplyEvent,
  SupplyCollateral as SupplyCollateralEvent,
  Withdraw as WithdrawEvent,
  WithdrawCollateral as WithdrawCollateralEvent,
  SetFeeRecipient as SetFeeRecipientEvent,
  CreateMarket as CreateMarketEvent,
} from "../../generated/Morpho/Morpho";
import {
  Market,
  MetaMorpho,
  MorphoFeeRecipient,
  MorphoTx,
} from "../../generated/schema";
import { handleMorphoTx } from "../distribute-market-rewards";
import { getMarket, setupUser } from "../initializers";
import { snapshotMarket } from "../snapshots";
import { generateLogId, EventType } from "../utils";

import { handleTransferEntity } from "./meta-morpho";

export function handleAccrueInterest(event: AccrueInterestEvent): void {
  const market = getMarket(event.params.id);
  market.totalSupplyAssets = market.totalSupplyAssets.plus(
    event.params.interest
  );
  market.totalBorrowAssets = market.totalBorrowAssets.plus(
    event.params.interest
  );

  snapshotMarket(market, event.block.timestamp, event.block.number);
  market.save();

  if (event.params.feeShares.isZero()) return;

  const feeRecipient = MorphoFeeRecipient.load(Bytes.empty());
  if (!feeRecipient) {
    log.critical("Morpho not found", []);
    return;
  }

  // We consider the fees accrued as a supply.
  const id = generateLogId(event);
  const morphoTx = new MorphoTx(id);
  morphoTx.type = EventType.ACCRUE_INTEREST;
  morphoTx.user = feeRecipient.feeRecipient;
  morphoTx.market = getMarket(event.params.id).id;
  morphoTx.shares = event.params.feeShares;
  // interests are already accrued above
  morphoTx.assets = BigInt.zero();

  morphoTx.timestamp = event.block.timestamp;

  morphoTx.txHash = event.transaction.hash;
  morphoTx.txIndex = event.transaction.index;
  morphoTx.logIndex = event.logIndex;

  morphoTx.blockNumber = event.block.number;
  morphoTx.save();

  handleMorphoTx(morphoTx);
}

export function handleBorrow(event: BorrowEvent): void {
  const id = generateLogId(event);
  const morphoTx = new MorphoTx(id);
  morphoTx.type = EventType.BORROW;
  morphoTx.user = setupUser(event.params.onBehalf).id;
  morphoTx.market = getMarket(event.params.id).id;
  morphoTx.shares = event.params.shares;
  morphoTx.assets = event.params.assets;

  morphoTx.timestamp = event.block.timestamp;

  morphoTx.txHash = event.transaction.hash;
  morphoTx.txIndex = event.transaction.index;
  morphoTx.logIndex = event.logIndex;

  morphoTx.blockNumber = event.block.number;
  morphoTx.save();

  handleMorphoTx(morphoTx);
}

export function handleLiquidate(event: LiquidateEvent): void {
  const market = getMarket(event.params.id);

  const repayId = generateLogId(event).concat(Bytes.fromUTF8(EventType.BORROW));

  const repayMorphoTx = new MorphoTx(repayId);
  repayMorphoTx.type = EventType.BORROW;
  repayMorphoTx.user = setupUser(event.params.borrower).id;
  repayMorphoTx.market = market.id;
  const totalShares = event.params.repaidShares.plus(
    event.params.badDebtShares
  );
  repayMorphoTx.shares = totalShares.neg();
  const totalAssets = event.params.repaidAssets.plus(
    event.params.badDebtAssets
  );
  repayMorphoTx.assets = totalAssets.neg();

  repayMorphoTx.timestamp = event.block.timestamp;

  repayMorphoTx.txHash = event.transaction.hash;
  repayMorphoTx.txIndex = event.transaction.index;
  repayMorphoTx.logIndex = event.logIndex;

  repayMorphoTx.blockNumber = event.block.number;
  repayMorphoTx.save();
  handleMorphoTx(repayMorphoTx);

  const withdrawCollatId = generateLogId(event).concat(
    Bytes.fromUTF8(EventType.COLLATERAL)
  );

  const withdrawCollatTx = new MorphoTx(withdrawCollatId);
  withdrawCollatTx.type = EventType.COLLATERAL;
  withdrawCollatTx.user = setupUser(event.params.borrower).id;
  withdrawCollatTx.market = market.id;
  withdrawCollatTx.shares = BigInt.zero();
  withdrawCollatTx.assets = event.params.seizedAssets.neg();

  withdrawCollatTx.timestamp = event.block.timestamp;

  withdrawCollatTx.txHash = event.transaction.hash;
  withdrawCollatTx.txIndex = event.transaction.index;
  withdrawCollatTx.logIndex = event.logIndex;

  withdrawCollatTx.blockNumber = event.block.number;
  withdrawCollatTx.save();

  handleMorphoTx(withdrawCollatTx);

  // we also need to remove bad debt assets in the supply of the market
  // if the bad debt shares are not zero
  if (event.params.badDebtShares.gt(BigInt.zero())) {
    const removeBadDebtAssetsId = generateLogId(event).concat(
      Bytes.fromUTF8(EventType.SUPPLY)
    );

    const removeBadDebtAssetsTx = new MorphoTx(removeBadDebtAssetsId);
    removeBadDebtAssetsTx.type = EventType.SUPPLY;
    removeBadDebtAssetsTx.user = setupUser(event.params.borrower).id;
    removeBadDebtAssetsTx.market = market.id;
    // we dont need to remove shares, only assets
    removeBadDebtAssetsTx.shares = BigInt.zero();
    removeBadDebtAssetsTx.assets = event.params.badDebtAssets.neg();

    removeBadDebtAssetsTx.timestamp = event.block.timestamp;

    removeBadDebtAssetsTx.txHash = event.transaction.hash;
    removeBadDebtAssetsTx.txIndex = event.transaction.index;
    removeBadDebtAssetsTx.logIndex = event.logIndex;

    removeBadDebtAssetsTx.blockNumber = event.block.number;
    removeBadDebtAssetsTx.save();

    handleMorphoTx(removeBadDebtAssetsTx);
  }

  if (MetaMorpho.load(market.collateralToken) != null) {
    handleTransferEntity(
      event,
      market.collateralToken,
      event.params.borrower,
      event.params.caller,
      event.params.seizedAssets
    );
  }
}

export function handleRepay(event: RepayEvent): void {
  const id = generateLogId(event);
  const morphoTx = new MorphoTx(id);
  morphoTx.type = EventType.BORROW;
  morphoTx.user = setupUser(event.params.onBehalf).id;
  morphoTx.market = getMarket(event.params.id).id;
  morphoTx.shares = event.params.shares.neg();
  morphoTx.assets = event.params.assets.neg();

  morphoTx.timestamp = event.block.timestamp;

  morphoTx.txHash = event.transaction.hash;
  morphoTx.txIndex = event.transaction.index;
  morphoTx.logIndex = event.logIndex;

  morphoTx.blockNumber = event.block.number;
  morphoTx.save();

  handleMorphoTx(morphoTx);
}

export function handleSupply(event: SupplyEvent): void {
  const id = generateLogId(event);

  const morphoTx = new MorphoTx(id);
  morphoTx.type = EventType.SUPPLY;
  morphoTx.user = setupUser(event.params.onBehalf).id;
  morphoTx.market = getMarket(event.params.id).id;
  morphoTx.shares = event.params.shares;
  morphoTx.assets = event.params.assets;

  morphoTx.timestamp = event.block.timestamp;

  morphoTx.txHash = event.transaction.hash;
  morphoTx.txIndex = event.transaction.index;
  morphoTx.logIndex = event.logIndex;

  morphoTx.blockNumber = event.block.number;
  morphoTx.save();

  handleMorphoTx(morphoTx);
}

export function handleSupplyCollateral(event: SupplyCollateralEvent): void {
  const market = getMarket(event.params.id);
  const id = generateLogId(event);
  const morphoTx = new MorphoTx(id);
  morphoTx.type = EventType.COLLATERAL;
  morphoTx.user = setupUser(event.params.onBehalf).id;
  morphoTx.market = market.id;
  morphoTx.shares = BigInt.zero();
  morphoTx.assets = event.params.assets;

  morphoTx.timestamp = event.block.timestamp;

  morphoTx.txHash = event.transaction.hash;
  morphoTx.txIndex = event.transaction.index;
  morphoTx.logIndex = event.logIndex;

  morphoTx.blockNumber = event.block.number;
  morphoTx.save();

  handleMorphoTx(morphoTx);

  if (MetaMorpho.load(market.collateralToken) != null) {
    handleTransferEntity(
      event,
      market.collateralToken,
      event.params.caller,
      event.params.onBehalf,
      event.params.assets
    );
  }
}

export function handleWithdraw(event: WithdrawEvent): void {
  const id = generateLogId(event);
  const morphoTx = new MorphoTx(id);
  morphoTx.type = EventType.SUPPLY;
  morphoTx.user = setupUser(event.params.onBehalf).id;
  morphoTx.market = getMarket(event.params.id).id;
  morphoTx.shares = event.params.shares.neg();
  morphoTx.assets = event.params.assets.neg();

  morphoTx.timestamp = event.block.timestamp;

  morphoTx.txHash = event.transaction.hash;
  morphoTx.txIndex = event.transaction.index;
  morphoTx.logIndex = event.logIndex;

  morphoTx.blockNumber = event.block.number;
  morphoTx.save();

  handleMorphoTx(morphoTx);
}

export function handleWithdrawCollateral(event: WithdrawCollateralEvent): void {
  const id = generateLogId(event);
  const market = getMarket(event.params.id);

  const morphoTx = new MorphoTx(id);
  morphoTx.type = EventType.COLLATERAL;
  morphoTx.user = setupUser(event.params.onBehalf).id;
  morphoTx.market = market.id;
  morphoTx.shares = BigInt.zero();
  morphoTx.assets = event.params.assets.neg();

  morphoTx.timestamp = event.block.timestamp;

  morphoTx.txHash = event.transaction.hash;
  morphoTx.txIndex = event.transaction.index;
  morphoTx.logIndex = event.logIndex;

  morphoTx.blockNumber = event.block.number;
  morphoTx.save();

  handleMorphoTx(morphoTx);

  if (MetaMorpho.load(market.collateralToken) != null) {
    handleTransferEntity(
      event,
      market.collateralToken,
      event.params.onBehalf,
      event.params.receiver,
      event.params.assets
    );
  }
}

export function handleSetFeeRecipient(event: SetFeeRecipientEvent): void {
  let morpho = MorphoFeeRecipient.load(Bytes.empty());
  if (!morpho) {
    morpho = new MorphoFeeRecipient(Bytes.empty());
  }
  morpho.feeRecipient = setupUser(event.params.newFeeRecipient).id;
  morpho.save();
}

export function handleCreateMarket(event: CreateMarketEvent): void {
  const market = new Market(event.params.id);

  market.loanToken = event.params.marketParams.loanToken;
  market.collateralToken = event.params.marketParams.collateralToken;

  market.totalSupplyShares = BigInt.zero();
  market.totalSupplyAssets = BigInt.zero();
  market.totalBorrowShares = BigInt.zero();
  market.totalBorrowAssets = BigInt.zero();
  market.totalCollateral = BigInt.zero();

  market.totalSupplyPoints = BigInt.zero();
  market.totalBorrowPoints = BigInt.zero();
  market.totalCollateralPoints = BigInt.zero();

  market.lastUpdate = BigInt.zero(); // This is going to be updated with the first update of the market total supplyShares/borrowShares/collateral

  market.save();
}
