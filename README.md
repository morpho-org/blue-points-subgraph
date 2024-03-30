# Morpho Blue Rewards Subgraph

## Overview
The Morpho Blue Rewards Subgraph serves as a dedicated indexing tool to track rewards accrued by users of Morpho Blue's ecosystem. It focuses on indexing rewards from programs offering specified rates through the [Rate Displayer](https://github.com/morpho-org/morpho-blue-rewards-emissions), giving insights into rewards dynamics across different Morpho markets.

## Market shards.
Market shards: one shard = one market share for 1 second, per market side. 
For example, if I have 10 supply shares in marketA during 10 seconds, I will have 100 marketA supply shares in total.
The total market shares of one market is growing with the total supply shares (i.e. borrow shares or total collateral). 

The precision of 1 shard is the precision of one morpho share, i.e. underlying token decimals + 6 decimals
for collateral, this is directly the same precision as the underlying token.
## Market points
Points are corresponding to a constant rate over the time: There is 1 market point distributed per second for one given market side.

If I have 10 supply shares in marketA during 10 seconds, and totalSupply is 100, I will have 10 points * 10 shares / 100 totalSupply = 1 supply point for this market.
Precision of market points is 1e18. 


## MetaMorpho shards
The concept of a Shard for a MetaMorpho vault is exactly the same as for a market shard.
1 MetaMorpho shard = 1 MetaMorpho share for 1 second.

## MetaMorpho points
MetaMorpho points are points redistributed to the MetaMorpho users. They are totally independent from the market points.

If you want to redistribute the MetaMorpho Market points to the metamorpho users, you can do the followign
- compute the MetaMorpho points for each markets
- compute the MetaMorpho points for each users
- redirstribute each market point for each users with : userMarketPoints = userVaultPoints * marketPoints / totalMarketPoints.

