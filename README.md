# Blue Points Subgraph

## Overview
The Blue Points Subgraph Subgraph serves as a dedicated indexing tool to track users proportions of Morpho Blue's Markets & MetaMorpho vaults. 

## Market points.
Market points: one shard unit = one market share for 1 second, per market side. 
For example, if I have 10 supply shares in marketA during 10 seconds, I will have 100 marketA supply shares in total.
The total market shares of one market is growing with the total supply shares (i.e. borrow shares or total collateral). 

The precision of 1 shard is the precision of one morpho share, i.e. underlying token decimals + 6 decimals
for collateral, this is directly the same precision as the underlying token.

## MetaMorpho points
The concept of a Shard for a MetaMorpho vault is exactly the same as for a market shard.
1 MetaMorpho shard = 1 MetaMorpho share for 1 second.

## How to format points
In order to have "human readable" points, we add 6 decimals of precision to the number of points. 
For a given market, the points accrued inherits on the shares precision, and on the collateral asset precision for collateral points.

As a reminder, the precision of the market shares for the borrow & the supply side is the underlying token decimals + 6 decimals.

So the global precision of a supply shard is the underlying token decimals + 12 decimals.
